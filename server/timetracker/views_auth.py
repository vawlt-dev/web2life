import json

import requests
from django.http import JsonResponse, HttpResponse
from django.conf import settings
from django.forms.models import model_to_dict
from django.shortcuts import redirect

from google_auth_oauthlib.flow import Flow
from requests_oauthlib import OAuth2Session

from .event_source_list import EVENT_SOURCES

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
            "https://graph.microsoft.com/v1.0/me/messages", headers=headers,
            timeout=settings.REQUEST_TIMEOUT_S
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
            "https://graph.microsoft.com/v1.0/me/events", headers=headers,
            timeout=settings.REQUEST_TIMEOUT_S,
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
        token = requests.post(token_url, data=params, timeout=settings.REQUEST_TIMEOUT_S).json()

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
            "https://slack.com/api/conversations.list", headers=headers,
            timeout=settings.REQUEST_TIMEOUT_S
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
                timeout=settings.REQUEST_TIMEOUT_S,
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
