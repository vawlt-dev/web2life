import datetime
import json
import requests
import django.middleware.csrf

from django.utils._os import safe_join
from pathlib import Path
from django.views.static import serve
from django import views
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_POST
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from django.conf import settings
from .models import Events
from .models import Project
from google_auth_oauthlib.flow import Flow
from django.shortcuts import redirect
from requests_oauthlib import OAuth2Session
from datetime import datetime, timedelta
from . import event_translation
from . import filter
import os
import base64
import hashlib
import random
import string
import traceback


def generate_state():
    return "".join(random.choices(string.ascii_letters + string.digits, k=32))


def generate_code_verifier():
    return base64.urlsafe_b64encode(os.urandom(32)).rstrip(b"=").decode("utf-8")


def generate_code_challenge(verifier):
    digest = hashlib.sha256(verifier.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest).rstrip(b"=").decode("utf-8")


def index(request):
    print("Serve index")
    print(safe_join(settings.FRONTEND_BUILD_PATH, "index.html"))
    return serve(request, "index.html", settings.FRONTEND_BUILD_PATH)


def serve_static(request, path):
    full_path = Path(safe_join(settings.STATIC_SOURCE, path))
    print(f"serve_static(): {full_path}")
    if full_path.is_file():
        return serve(request, path, settings.STATIC_SOURCE)
    else:
        return views.default.page_not_found(request, FileNotFoundError())


def get_events(request):
    events = []
    for event in Events.objects.select_related("projectId").all():
        events.append(
            {
                "id": event.id,
                "title": event.title,
                "start": event.start,
                "end": event.end,
                "allDay": event.allDay,
                "description": event.description,
                "project_title": event.projectId.title if event.projectId else None,
            }
        )
    return JsonResponse({"data": events})


@require_POST
def set_event(request):
    try:
        data = json.loads(request.body)
        project = None
        try:
            project = Project.objects.get(title=data["project"])
        except:
            print("No project found, defaulting to null")

        print(data["allDay"])
        event = Events(
            title=data["title"],
            description=data["description"],
            start=data["start"],
            end=data["end"],
            allDay=True if data["allDay"] == "on" else False,
            projectId=project,
        )
        event.save()
    except Exception as e:
        print(e)
    finally:
        return HttpResponse()


def get_event_by_id(request):
    print(request)
    try:
        data = json.loads(request.body)
        event = Events.objects.get(id=data["id"])
    except Exception as e:
        print(e)
        return HttpResponse()
    finally:
        return JsonResponse({"data": event.task})


def get_projects(request):
    projects = list(Project.objects.all().values())
    print(f"get_projects: {request}")
    return JsonResponse({"data": projects})


def add_project(request):
    try:
        data = json.loads(request.body)
        project = Project(title=data["project"])
        project.save()
        return HttpResponse()
    except:
        return HttpResponse()


def filter_events(request):
    events = filter.filter_events(request)
    return JsonResponse({"data": events})


def patch_event(request):
    try:
        data = json.loads(request.body)
        event = Events.objects.get(id=data["originalEvent"]["id"])

        newStart = data["newEvent"]["start"]
        newEnd = data["newEvent"]["end"]
        newAllDay = data["newEvent"]["allDay"]
        newDescription = data["newEvent"]["description"]
        # newProject = data["newEvent"]["project"]

        event.start = newStart
        event.end = newEnd
        event.allDay = newAllDay
        event.description = newDescription
        event.save()
    except Exception as e:
        print(e)
    return HttpResponse()


def update_event_times(request):
    try:
        data = json.loads(request.body)
        event = Events.objects.get(id=data["originalEvent"]["id"])
        newEvent = data["newEvent"]
        newStart = newEvent.get("start")
        newEnd = newEvent.get("end")
        newAllDay = newEvent.get("allDay")

        event.start = newStart
        event.end = newEnd
        event.allDay = newAllDay
        print(newStart)
        event.save()
    except Exception as e:
        print(e)
    finally:
        return HttpResponse()


def delete_event_time(request):
    try:
        data = json.loads(request.body)
        event = Events.objects.get(id=data["id"])

        event.times = [
            # no idea how this works but it does
            # can't directly delete the time, so have to
            # re-create the times array with the time to delete
            # filtered out
            time
            for time in event.times
            if not (
                time.get("start") == data["start"]
                and time.get("end") == data["end"]
                and time.get("allDay") == data["allDay"]
            )
        ]
        event.save()
    except Exception as e:
        print(e)
    finally:
        return HttpResponse()


def delete_event(request):
    try:
        data = json.loads(request.body)
        event = Events.objects.get(id=data["id"])
        event.delete()
        print(event)
    except Exception as e:
        print(e)
    finally:
        return HttpResponse()


def clear_events(request):
    print("In clear_events")
    Events.objects.all().delete()
    return HttpResponse()


def delete_project(request):
    print(f"delete_project: {request}")
    try:
        data = json.loads(request.body)
        print(f"Delete project: {data['title']}")
        project = Project.objects.get(title=data["title"])
        project.delete()
        return HttpResponse()
    except:
        return HttpResponse()


###########################
#### GOOGLE FUNCTIONS #####
###########################


def google_connect_oauth(request):
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
    authorization_url, state = flow.authorization_url(
        access_type="offline", include_granted_scopes="true"
    )
    # store states with their own keys, otherwise the values might conflict
    # i.e. send gmail creds to microsoft
    request.session["google_state"] = state

    return redirect(authorization_url)


def google_callback(request):
    state = request.session.get("google_state")

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
    flow.state = state

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


from googleapiclient.discovery import build
from googleapiclient.http import BatchHttpRequest
from google.oauth2.credentials import Credentials
from datetime import datetime, timedelta


# uses batch processing, cuts time down from 25 seconds to 2 seconds (50 messages)
def get_gmail_messages(request):
    if "google_credentials" not in request.session:
        return redirect(google_connect_oauth)

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
        query = f"after:{one_month_ago.strftime('%Y/%m/%d')}"

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
                info = {
                    "date": next(
                        header["value"]
                        for header in headers
                        if header["name"] == "Date"
                    ),
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

        return JsonResponse({"data": message_list})

    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"error": str(e)})


def get_google_calendar_events(request):
    if "google_credentials" not in request.session:
        return redirect(google_connect_oauth)

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


###########################
### MICROSOFT FUNCTIONS ###
###########################


def microsoft_connect_oauth(request):
    authorization_base_url = (
        "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
    )

    microsoft = OAuth2Session(
        client_id=settings.MICROSOFT_CLIENT_ID,
        redirect_uri=settings.MICROSOFT_CALLBACK,
        scope=[
            "https://graph.microsoft.com/Mail.Read",
            "https://graph.microsoft.com/Calendars.Read",
            "offline_access",
        ],
    )

    authorization_url, state = microsoft.authorization_url(authorization_base_url)

    request.session["microsoft_state"] = state

    return redirect(authorization_url)


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
        return JsonResponse({"error": str(e)}, status=400)

    request.session["microsoft_credentials"] = {
        "access_token": token.get("access_token"),
        "refresh_token": token.get("refresh_token"),
        "token_type": token.get("token_type"),
        "expires_in": token.get("expires_in"),
        "scope": token.get("scope"),
    }
    print(token.get("scope"))
    return redirect("/")


def get_outlook_messages(request):
    credentials_info = request.session.get("microsoft_credentials")
    if not credentials_info or not credentials_info.get("access_token"):
        return redirect(microsoft_connect_oauth)

    try:
        headers = {"Authorization": f"Bearer {credentials_info['access_token']}"}
        response = requests.get(
            "https://graph.microsoft.com/v1.0/me/messages", headers=headers
        )

        if response.status_code == 200:
            email_data = response.json().get("value", [])
            emails = [
                {
                    "time_sent": email.get("sentDateTime"),
                    "recipient": email.get("toRecipients", [{}])[0]
                    .get("emailAddress", {})
                    .get("address"),
                    "subject": email.get("subject"),
                }
                for email in email_data
            ]
            return JsonResponse({"data": emails})
        else:
            return JsonResponse(
                {"error": f"Failed to fetch emails: {response.status_code}"},
                status=response.status_code,
            )
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


def get_microsoft_calendar_events(request):
    credentials_info = request.session.get("microsoft_credentials")

    if not credentials_info or "access_token" not in credentials_info:
        return redirect(microsoft_connect_oauth)

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


###########################
#### GITHUB FUNCTIONS #####
###########################
def github_connect_oauth(request):
    github_session = OAuth2Session(
        client_id=settings.GITHUB_CLIENT_ID,
        redirect_uri=settings.GITHUB_CALLBACK,
        scope="repo,read:user",
    )
    auth_url, state = github_session.authorization_url(
        "https://github.com/login/oauth/authorize"
    )
    request.session["oauth_state"] = state
    return redirect(auth_url)


def github_callback(request):
    github_session = OAuth2Session(
        client_id=settings.GITHUB_CLIENT_ID,
        redirect_uri=settings.GITHUB_CALLBACK_URI,
        scope="repo,read:user",
    )
    try:
        token = github_session.fetch_token(
            "https://github.com/login/oauth/access_token",
            client_secret=settings.GITHUB_SECRET,
            authorization_response=request.build_absolute_uri(),
        )

        request.session["oauth_token"] = token

        username = github_session.get("https://api.github.com/user").json().get("login")

        response = github_session.get(
            f"https://api.github.com/users/{username}/events/public"
        )
        events_json = response.json()

        events = []
        for event in events_json:
            if event["type"] == "PushEvent":
                branch_name = event["payload"]["ref"].split("/")[-1]
                repo_name = event["repo"]["name"]
                for commit in event["payload"]["commits"]:
                    events.append(
                        {
                            "type": "PushEvent",
                            "time": event["created_at"],
                            "branch": branch_name,
                            "repo": repo_name,
                            "commit_sha": commit["sha"],
                            "message": commit["message"],
                        }
                    )
            elif (
                event["type"] == "CreateEvent"
                and event["payload"]["ref_type"] == "branch"
            ):
                events.append(
                    {
                        "type": "CreateEvent",
                        "time": event["created_at"],
                        "branch": branch_name,
                        "repo": repo_name,
                    }
                )

        test = event_translation.translate_github_events(events)

        return JsonResponse(events, safe=False)
    except Exception as e:
        print(f"Error fetching token or events: {e}")
        return JsonResponse({"error": str(e)}, status=400)


###########################
#### GITLAB FUNCTIONS #####
###########################


def gitlab_connect_oauth(request):
    # for some horrid reason, gitlab REALLY doesn't like to work with the oauth2 library
    # so i had to manually make the requests and authorize it
    state = generate_state()
    verifier = generate_code_verifier()
    challenge = generate_code_challenge(verifier)

    request.session["oauth_state"] = state
    request.session["code_verifier"] = verifier

    authorization_url = (
        "https://gitlab.com/oauth/authorize"
        + f"?client_id={settings.GITLAB_CLIENT_ID}"
        + f"&redirect_uri={settings.GITLAB_CALLBACK}"
        + "&response_type=code"
        + f"&state={state}"
        + "&scope=read_user+api"
        + f"&code_challenge={challenge}"
        + "&code_challenge_method=S256"
    )
    return redirect(authorization_url)


def gitlab_callback(request):
    # i know this is a bit busted, will fix later
    code = request.GET.get("code")
    verifier = request.session["code_verifier"]

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
        print(token)
        request.session["oauth_token"] = token
        headers = {"Authorization": f"Bearer {token['access_token']}"}

        projects = requests.get(
            "https://gitlab.com/api/v4/projects", headers=headers
        ).json()

        for project in projects:
            repo_ID = projects[project]["id"]
            repo_name = projects[project]["name"]

            pushEvents = requests.get(
                f"https://gitlab.com/api/v4/projects/{repo_ID}/events?action=pushed",
                headers=headers,
            ).json()
            branchEvents = requests.get(
                f"https://gitlab.com/api/v4/projects/{repo_ID}/repository/branches",
                headers=headers,
            ).json()

            events = []
            for event in pushEvents:
                events.append(
                    {
                        "repo": repo_name,
                        "branch": event["push_data"]["ref"],
                        "time": event["created_at"],
                        "commit_sha": event["push_data"]["commit_to"],
                    }
                )
            for branch in branchEvents:
                if (
                    "parent_ids" in branch["commit"]
                    and not branch["commit"]["parent_ids"]
                ):
                    events.append(
                        {
                            "repo": repo_name,
                            "branch": branch["name"],
                            "time": branch["commit"]["committed_date"],
                            "commit_sha": branch["commit"]["id"],
                        }
                    )
            return JsonResponse(events, safe=False)
        else:
            return JsonResponse({"error:": "No projects found"})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


###########################
##### SLACK FUNCTIONS #####
###########################
def slack_connect_oauth(request):
    slack_session = OAuth2Session(
        client_id=settings.SLACK_CLIENT_ID,
        redirect_uri=settings.SLACK_CALLBACK,
        scope=[
            "channels:history",
            "im:history",
            "channels:read",
            "im:read",
            "mpim:history",
            "groups:history",
        ],
    )
    authorization_url, state = slack_session.authorization_url(
        "https://slack.com/oauth/v2/authorize"
    )
    request.session["oauth_state"] = state
    return redirect(authorization_url)


def slack_callback(request):
    slack_session = OAuth2Session(
        client_id=settings.SLACK_CLIENT_ID,
        state=request.session["oauth_state"],
        redirect_uri=settings.SLACK_CALLBACK,
    )

    try:
        token = slack_session.fetch_token(
            "https://slack.com/api/oauth.v2.access",
            client_secret=settings.SLACK_SECRET,
            authorization_response=request.build_absolute_uri(),
        )
        request.session["oauth_token"] = token

        headers = {"Authorization": f"Bearer {token['access_token']}"}

        response = requests.get(
            "https://slack.com/api/conversations.list",
            headers=headers,
        )
        channel_info = response.json().get("channels", [])
        channels = {}
        for channel in channel_info:
            channel_id = channel.get("id")
            channel_name = channel.get("name")
            channels[channel_id] = channel_name

        print(channels)
        print(
            requests.get(
                "https://slack.com/api/conversations.history",
                headers=headers,
                params={"channel": channel_id},
            ).json()
        )
        messages = []
        for channel_id, channel_name in channels.items():
            response = requests.get(
                "https://slack.com/api/conversations.history",
                headers=headers,
                params={"channel": channel_id},
            )
            messageList = response.json().get("messages", [])

            for message in messageList:
                messages.append(
                    {
                        "type": "message",
                        "user": message.get("user"),
                        "time": message.get("ts"),
                        "text": message.get("text"),
                        "channel": channel_name,
                    }
                )
        print(messages)
        return JsonResponse(messages, safe=False)

    except Exception as e:
        print(f"Error fetching token or messages: {e}")
        return JsonResponse({"error": str(e)}, status=400)


def get_slack_events(request):
    pass


def get_csrf_token(request):
    return JsonResponse({"csrf-token": django.middleware.csrf.get_token(request)})


def serve_manifest(request):
    # with open((settings.FRONTEND_BUILD_PATH + "/manifest.json"), "r") as file:
    #    data = file.read()
    # return HttpResponse(data);
    return serve(request, "manifest.json", settings.FRONTEND_BUILD_PATH)


def serve_ico(request):
    # with open((settings.FRONTEND_BUILD_PATH + "/favicon.ico"), "rb") as file:
    #    data = file.read()
    # return HttpResponse(data)
    return serve(request, "favicon.ico", settings.FRONTEND_BUILD_PATH)


def set_user(request):
    return None


def get_user_by_id(request):
    return None


def get_users(request):
    return None
