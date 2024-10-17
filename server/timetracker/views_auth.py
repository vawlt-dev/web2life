import datetime
import requests
import traceback
import json
from datetime import timedelta
from datetime import datetime
from django.http import JsonResponse, HttpResponse
from django.conf import settings
from .event_source_list import EVENT_SOURCES
from django.forms.models import model_to_dict
from googleapiclient.http import BatchHttpRequest
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import Flow
from django.shortcuts import redirect
from requests_oauthlib import OAuth2Session
from . import event_translation

def import_events(request, name):
    try:
        source = EVENT_SOURCES[name]
        events = source.import_events(request)
        event_dict = []
        for e in events:
            event_dict.append(model_to_dict(e))

        return JsonResponse({"data": event_dict})
    except Exception as e:
        return JsonResponse({"error": f"{e}"})

#======================================================================================
# Google
#======================================================================================

def google_callback(request):
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=[
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/calendar.readonly",
        ],
        redirect_uri=settings.GOOGLE_CALLBACK,
    )

    authorization_response = request.build_absolute_uri()
    try:
        flow.fetch_token(authorization_response=authorization_response)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

    credentials = flow.credentials

    request.session["google_credentials"] = {
        "token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "token_uri": credentials.token_uri,
        "client_id": credentials.client_id,
        "client_secret": credentials.client_secret,
        "scopes": credentials.scopes,
    }

    return redirect("/")


# uses batch processing, cuts time down from 25 seconds to 2 seconds (50 messages)
def get_gmail_messages(request):
    if "google_credentials" not in request.session:
        return HttpResponse(401)

    credentials_info = request.session["google_credentials"]
    credentials = Credentials(
        token=credentials_info["token"],
        refresh_token=credentials_info["refresh_token"],
        token_uri=credentials_info["token_uri"],
        client_id=credentials_info["client_id"],
        client_secret=credentials_info["client_secret"],
        scopes=credentials_info["scopes"],
    )

    try:
        gmail = build("gmail", "v1", credentials=credentials)

        one_month_ago = datetime.now() - timedelta(days=30)
        query = f"after:{one_month_ago.strftime('%Y/%m/%d')} from:me"

        # IMPORTANT
        # maxResults cannot exceed 30 if you're using a free Google API due to rate limits

        messages_result = (
            gmail.users().messages().list(userId="me", q=query, maxResults=30).execute()
        )
        message_ids = messages_result.get("messages", [])
        message_list = []

        def handle_message_request(request_id, response, exception):
            if exception is None:
                headers = response["payload"]["headers"]
                date_str = next(
                    header["value"] for header in headers if header["name"] == "Date"
                )

                try:
                    date = datetime.strptime(
                        date_str, "%a, %d %b %Y %H:%M:%S %Z"
                    ).isoformat()
                except ValueError:
                    date = datetime.strptime(
                        date_str, "%a, %d %b %Y %H:%M:%S %z"
                    ).isoformat()

                info = {
                    "date": date,
                    "subject": next(
                        header["value"]
                        for header in headers
                        if header["name"] == "Subject"
                    ),
                    "recipient": next(
                        header["value"] for header in headers if header["name"] == "To"
                    ),
                }

                message_list.append(info)
            else:
                print(f"Error with request {request_id}: {exception}")

        batch = BatchHttpRequest(callback=handle_message_request)
        batch._batch_uri = "https://gmail.googleapis.com/batch"

        for message_id in message_ids:
            batch.add(
                gmail.users()
                .messages()
                .get(
                    userId="me",
                    id=message_id["id"],
                    format="metadata",
                    metadataHeaders=["Date", "Subject", "To"],
                )
            )

        batch.execute()

        translated = event_translation.translate_email_events(message_list)
        translated_dict = []
        for e in translated:
            translated_dict.append(model_to_dict(e))

        return JsonResponse({"data": translated_dict})
        # return JsonResponse({"data": message_list})

    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"error": str(e)})


def get_google_calendar_events(request):
    if "google_credentials" not in request.session:
        return HttpResponse(401)

    credentials_info = request.session["google_credentials"]
    credentials = Credentials(
        token=credentials_info["token"],
        refresh_token=credentials_info["refresh_token"],
        token_uri=credentials_info["token_uri"],
        client_id=credentials_info["client_id"],
        client_secret=credentials_info["client_secret"],
        scopes=credentials_info["scopes"],
    )
    try:
        calendar = build("calendar", "v3", credentials=credentials)
        one_month_ago = datetime.now() - timedelta(days=30)

        event_res = (
            calendar.events()
            .list(
                calendarId="primary",
                timeMin=one_month_ago.isoformat() + "Z",
                maxResults=100,
                singleEvents=True,
                orderBy="startTime",
            )
            .execute()
        )

        events_list = event_res.get("items", [])
        events = []
        for event in events_list:
            info = {
                "id": event.get("id"),
                "title": event.get("summary", "No title"),
                "start": event["start"].get("dateTime", event["start"].get("date")),
                "end": event["end"].get("dateTime", event["end"].get("date")),
            }
            events.append(info)

        return JsonResponse({"data": events})
    except Exception as e:
        return JsonResponse({"error": str(e)})

#======================================================================================
# Microsoft
#======================================================================================

def microsoft_callback(request):
    state = request.session.get("microsoft_state")

    microsoft = OAuth2Session(
        client_id=settings.MICROSOFT_CLIENT_ID,
        redirect_uri=settings.MICROSOFT_CALLBACK,
        state=state,
        scope=[
            "https://graph.microsoft.com/Mail.Read",
            "https://graph.microsoft.com/Calendars.Read",
            "offline_access",
        ],
    )

    authorization_response = request.build_absolute_uri()

    try:
        token = microsoft.fetch_token(
            token_url="https://login.microsoftonline.com/common/oauth2/v2.0/token",
            authorization_response=authorization_response,
            client_secret=settings.MICROSOFT_SECRET,
        )
    except Exception as e:
        print(e)
        return redirect("/")

    request.session["microsoft_credentials"] = {
        "access_token": token.get("access_token"),
        "refresh_token": token.get("refresh_token"),
        "token_type": token.get("token_type"),
        "expires_in": token.get("expires_in"),
        "scope": token.get("scope"),
    }
    return redirect("/")


def get_outlook_messages(request):
    credentials_info = request.session.get("microsoft_credentials")
    if not credentials_info or not credentials_info.get("access_token"):
        return HttpResponse(401)

    try:
        headers = {"Authorization": f"Bearer {credentials_info['access_token']}"}
        response = requests.get(
            "https://graph.microsoft.com/v1.0/me/messages", headers=headers
        )

        if response.status_code == 200:
            email_data = response.json().get("value", [])
            emails = [
                {
                    "date": email.get("sentDateTime"),
                    "recipient": email.get("toRecipients", [{}])[0]
                    .get("emailAddress", {})
                    .get("address"),
                    "subject": email.get("subject"),
                }
                for email in email_data
            ]
            return JsonResponse({"data": emails})

        return JsonResponse(
            {"error": f"Failed to fetch emails: {response.status_code}"},
            status=response.status_code,
        )
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


def get_microsoft_calendar_events(request):
    credentials_info = request.session.get("microsoft_credentials")

    if not credentials_info or "access_token" not in credentials_info:
        return HttpResponse(401)

    try:
        access_token = credentials_info["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}

        response = requests.get(
            "https://graph.microsoft.com/v1.0/me/events", headers=headers
        )

        if response.status_code != 200:
            return JsonResponse(
                {"error": f"Failed to fetch events: {response.status_code}"}
            )

        calendar_data = response.json().get("value", [])
        calendar_events = [
            {
                "title": event.get("subject", "No title"),
                "start_time": event.get("start", {}).get(
                    "dateTime", "Unknown start time"
                ),
                "end_time": event.get("end", {}).get("dateTime", "Unknown end time"),
            }
            for event in calendar_data
        ]
        return JsonResponse({"data": calendar_events})

    except Exception as e:
        return JsonResponse({"error": str(e)})

#======================================================================================
# GitLab
#======================================================================================
def gitlab_callback(request):
    code = request.GET.get("code")
    verifier = request.session["gitlab_verifier"]

    try:
        token_url = "https://gitlab.com/oauth/token"
        params = {
            "client_id": settings.GITLAB_CLIENT_ID,
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": settings.GITLAB_CALLBACK,
            "code_verifier": verifier,
        }
        token = requests.post(token_url, data=params).json()

        request.session["gitlab_token"] = token
        print(json.dumps(token))
        return redirect("/")

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

#======================================================================================
# Slack
#======================================================================================
def slack_callback(request):
    slack = OAuth2Session(
        client_id=settings.SLACK_CLIENT_ID,
        state=request.session.get("slack_state"),
        redirect_uri=settings.SLACK_CALLBACK,
    )

    try:
        token = slack.fetch_token(
            "https://slack.com/api/oauth.v2.access",
            client_secret=settings.SLACK_SECRET,
            authorization_response=request.build_absolute_uri(),
        )

        request.session["slack_token"] = token
        return redirect("/")

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


def get_slack_events(request):
    token = request.session.get("slack_token")

    if not token or "access_token" not in token:
        return JsonResponse({"error": "No access token found in session"})

    access_token = token["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    try:
        response = requests.get(
            "https://slack.com/api/conversations.list", headers=headers
        )
        channel_info = response.json().get("channels", [])

        if not channel_info:
            return JsonResponse({"error": "No channels found"})

        channels = []
        for channel in channel_info:
            channels.append(
                {"channel_id": channel.get("id"), "channel_name": channel.get("name")}
            )

        messages = []
        for channel in channels:
            response = requests.get(
                "https://slack.com/api/conversations.history",
                headers=headers,
                params={"channel": channel["channel_id"]},
            )
            message_list = response.json().get("messages", [])

            for message in message_list:
                messages.append(
                    {
                        "type": "message",
                        "user": message.get("user"),
                        "time": message.get("ts"),
                        "text": message.get("text"),
                        "channel": channel["channel_name"],
                    }
                )

        return JsonResponse({"data": messages})

    except Exception as e:
        return JsonResponse({"error": str(e)})

#======================================================================================
# GitHub
#======================================================================================
def github_callback(request):
    github_session = OAuth2Session(
        client_id=settings.GITHUB_CLIENT_ID,
        redirect_uri=settings.GITHUB_CALLBACK,
        scope="repo,read:user",
    )
    try:
        token = github_session.fetch_token(
            "https://github.com/login/oauth/access_token",
            client_secret=settings.GITHUB_SECRET,
            authorization_response=request.build_absolute_uri(),
        )

        request.session["github_oauth_token"] = token

        return redirect("/")
    except Exception as e:
        print(f"Error during GitHub OAuth callback: {e}")
        return JsonResponse({"error": str(e)}, status=400)
