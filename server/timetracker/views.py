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
    return JsonResponse({"data": list(Events.objects.all().values())})


@require_POST
def set_event(request):
    try:
        data = json.loads(request.body)
        event = Events(
            title=data["title"],
            project=data["project"],
            task=data["task"],
            description=data["description"],
            start=data["start"],
            end=data["end"],
            allDay=data["allDay"],
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
    print(f"add_project: {request}")
    try:
        data = json.loads(request.body)
        project = Project(title=data["title"], description=data["description"])
        project.save()
        return HttpResponse()
    except:
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


def google_connect_oauth(request):
    try:
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

        request.session["state"] = state
        return redirect(authorization_url)
    except Exception as e:
        print(e)


def google_callback(request):
    state = request.session.get("state")

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

    request.session["credentials"] = {
        "token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "token_uri": credentials.token_uri,
        "client_id": credentials.client_id,
        "client_secret": credentials.client_secret,
        "scopes": credentials.scopes,
    }

    return redirect("/")


def fetch_google_events(request):
    if "credentials" not in request.session:
        return redirect("google_connect_oauth")

    credentials_info = request.session["credentials"]
    credentials = Credentials(
        token=credentials_info["token"],
        refresh_token=credentials_info["refresh_token"],
        token_uri=credentials_info["token_uri"],
        client_id=credentials_info["client_id"],
        client_secret=credentials_info["client_secret"],
        scopes=credentials_info["scopes"],
    )

    gmail = build("gmail", "v1", credentials=credentials)

    try:
        user = gmail.users().getProfile(userId="me").execute()

        # default is from one month ago
        one_month_ago = (datetime.now() - timedelta(days=30)).strftime("%Y/%m/%d")
        query = f"from:me after:{one_month_ago}"
        messages_result = (
            gmail.users()
            .messages()
            .list(userId="me", q=query, maxResults=100)
            .execute()
        )
        message_ids = messages_result.get("messages", [])

        messageList = []
        for message_id in message_ids:
            message = (
                gmail.users()
                .messages()
                .get(
                    userId="me",
                    id=message_id["id"],
                    format="metadata",
                    metadataHeaders=["Date", "Subject", "To"],
                )
                .execute()
            )
            headers = message["payload"]["headers"]

            info = {
                "date": next(
                    header["value"] for header in headers if header["name"] == "Date"
                ),
                "subject": next(
                    header["value"] for header in headers if header["name"] == "Subject"
                ),
                "recipient": next(
                    header["value"] for header in headers if header["name"] == "To"
                ),
            }
            messageList.append(info)

        calendar = build("calendar", "v3", credentials=credentials)

        event_res = (
            calendar.events()
            .list(calendarId="primary", q=query, maxResults=100)
            .execute()
        )
        events_list = event_res.get("items", [])
        events = []
        for event in events_list:
            info = {
                "title": event.get("summary", "No title"),
                "start": event["start"].get("dateTime", event["start"].get("date")),
                "end": event["end"].get("dateTime", event["end"].get("date")),
            }
            events.append(info)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"info": user, "events": events, "messages": messageList})


def github_connect_oauth(request):
    github_session = OAuth2Session(
        client_id=settings.GITHUB_CLIENT_ID,
        redirect_uri=settings.GITHUB_CALLBACK_URI,
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

        return JsonResponse(events, safe=False)
    except Exception as e:
        print(f"Error fetching token or events: {e}")
        return JsonResponse({"error": str(e)}, status=400)


def slack_connect_oauth(request):
    slack_session = OAuth2Session(
        client_id=settings.SLACK_CLIENT_ID,
        redirect_uri=settings.SLACK_CALLBACK_URI,
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
        redirect_uri=settings.SLACK_CALLBACK_URI,
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


def fetch_slack_events(request):
    pass


# FIXME: Naive timezone warnings?
# Needs min and max parameters in url in format Y-M-D
# To get all events on a certain date just use that date
# as both the min and max arguments
def get_events_by_date(request):
    print(request)
    today = datetime.datetime.now()
    min_arg = request.GET.get("min", "?")
    max_arg = request.GET.get("max", "?")
    min_ts = (
        datetime.datetime.strptime(request.GET.get("min", "?"), "%Y-%m-%d").date()
        if (min_arg != "?")
        else today
    )
    max_ts = (
        datetime.datetime.strptime(request.GET.get("max", "?"), "%Y-%m-%d").date()
        if (max_arg != "?")
        else today
    )

    try:
        events = Events.objects.filter(start__gte=min_ts, end__lte=max_ts).all()
        event_ids = []
        for e in events:
            event_ids.append(e.id)
        # Don't know in what format the front-end wants the events
        return JsonResponse({"data": event_ids})
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
