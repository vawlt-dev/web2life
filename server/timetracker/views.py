import datetime
import json
import os
import base64
import hashlib
import random
import string
import traceback
from pathlib import Path
from datetime import datetime, timedelta
import django.db
import django.db.models
import django.db.models.utils
import requests
import django.middleware.csrf

from django.utils._os import safe_join
from django.views.static import serve
from django import views
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_POST
from django.forms.models import model_to_dict
from django.conf import settings
from django.shortcuts import redirect
from googleapiclient.http import BatchHttpRequest
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import Flow

from requests_oauthlib import OAuth2Session

from . import event_translation
from .event_source_list import EVENT_SOURCES

# from . import filter as filtering
from .models import Events
from .models import Project


def generate_state():
    return "".join(random.choices(string.ascii_letters + string.digits, k=32))


def generate_code_verifier():
    return base64.urlsafe_b64encode(os.urandom(32)).rstrip(b"=").decode("utf-8")


def generate_code_challenge(verifier):
    digest = hashlib.sha256(verifier.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest).rstrip(b"=").decode("utf-8")


def get_events(request):  # pylint: disable=unused-argument
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
        return HttpResponse()
    except Exception as e:
        print(e)
        # @TODO: Return error code
        return HttpResponse()


def get_event_by_id(request):
    print(request)
    try:
        data = json.loads(request.body)
        event = Events.objects.get(id=data["id"])
        return JsonResponse({"data": event.task})
    except Exception as e:
        print(e)
        return JsonResponse({"error": "Event not found"})


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
        new_event = data["newEvent"]

        new_start = new_event["start"]
        new_end = new_event["end"]
        new_all_day = new_event["allDay"]
        new_description = new_event["description"]
        # newProject = data["newEvent"]["project"]

        event.start = new_start
        event.end = new_end
        event.allDay = new_all_day
        event.description = new_description
        event.save()
    except Exception as e:
        print(e)
    return HttpResponse()


def update_event_times(request):
    try:
        data = json.loads(request.body)
        event = Events.objects.get(id=data["originalEvent"]["id"])
        new_event = data["newEvent"]
        new_start = new_event.get("start")
        new_end = new_event.get("end")
        new_all_day = new_event.get("allDay")

        event.start = new_start
        event.end = new_end
        event.allDay = new_all_day
        event.save()
    except Exception as e:
        print(e)
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
    return HttpResponse()


def delete_event(request):
    try:
        data = json.loads(request.body)
        event = Events.objects.get(id=data["id"])
        event.delete()
        print(event)
    except Exception as e:
        print(e)
    return HttpResponse()


def clear_events(request):  # pylint: disable=unused-argument
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


def google_connect_oauth(request):  # pylint: disable=unused-argument
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
    authorization_url, _ = flow.authorization_url(
        access_type="offline", include_granted_scopes="true"
    )

    return redirect(authorization_url)


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
def github_connect_oauth(request):  # pylint: disable=unused-argument
    github_session = OAuth2Session(
        client_id=settings.GITHUB_CLIENT_ID,
        redirect_uri=settings.GITHUB_CALLBACK,
        scope="repo,read:user",
    )
    auth_url, _ = github_session.authorization_url(
        "https://github.com/login/oauth/authorize"
    )
    return redirect(auth_url)


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


def github_get_user_events_for_repo(session, user, repo):
    try:
        response = session.get(
            f"https://api.github.com/repos/{repo}/commits?author={user}"
        ).json()
        events = []
        for event in response:
            commit = event["commit"]
            events.append(
                {
                    "type": "push",
                    "time": commit["author"]["date"],
                    "repo": repo,
                    "message": commit["message"],
                }
            )
        return events
    except Exception as e:
        print(f"Failed to get GitHub events: {e}")
        return []

def get_and_translate_github_events(request):
    """Get GitHub events for user and repositories as specified in preferences"""
    prefs = load_preferences_from_file()
    if "error" in prefs:
        return []

    token = request.session.get("github_oauth_token")
    if not token:
        return []
    github_session = OAuth2Session(client_id=settings.GITHUB_CLIENT_ID, token=token)
    events = []
    user = prefs["githubusername"]
    for repo in prefs["githubrepos"]:
        events.extend(github_get_user_events_for_repo(github_session, user, repo))

    # Translate events
    translated = event_translation.translate_github_events(events)
    return translated

def get_github_events(request):
    try:
        events = get_and_translate_github_events(request)
        event_dict = []
        # Can't serialize models directly to JSON, so manually convert each event to a dict
        for t in events:
            event_dict.append(model_to_dict(t))
        return JsonResponse({"data": event_dict})
    except Exception as e:
        return JsonResponse({"error": f"{e}"})

###########################
#### GITLAB FUNCTIONS #####
###########################


def gitlab_connect_oauth(request):
    state = generate_state()
    verifier = generate_code_verifier()
    challenge = generate_code_challenge(verifier)

    request.session["gitlab_verifier"] = verifier
    gitlab = OAuth2Session(
        client_id=settings.GITLAB_CLIENT_ID,
        redirect_uri=settings.GITLAB_CALLBACK,
        scope=["read_user", "api"],
        state=state,
    )
    authorization_url, _ = gitlab.authorization_url(
        "https://gitlab.com/oauth/authorize",
        code_challenge=challenge,
        code_challenge_method="S256",
    )

    return redirect(authorization_url)


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


def get_gitlab_events(request):
    # may want to alter this in settings, points to the test gitlab repo
    PROJECT_ID = 61199933

    access_token = request.session["gitlab_token"]["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    # Gitlab is surprisingly comprehensive in the information returned by the push events
    # we don't need to analyze the branches API, we can just select all events where
    # the action was 'created' and the reference type is 'branch'
    try:
        push_events = requests.get(
            f"https://gitlab.com/api/v4/projects/{PROJECT_ID}/events?action=pushed",
            headers=headers,
        ).json()

        events = []
        for event in push_events:
            push_data = event.get("push_data", {})

            events.append(
                {
                    "type": "push",
                    "branch": push_data.get("ref"),
                    "time": event.get("created_at"),
                    "commit_sha": push_data.get("commit_to"),
                    "commit_title": push_data.get("commit_title"),
                }
            )

            if (
                push_data.get("action") == "created"
                and push_data.get("ref_type") == "branch"
            ):
                events.append(
                    {
                        "type": "branch_creation",
                        "branch": push_data.get("ref"),
                        "time": event.get("created_at"),
                        "commit_sha": push_data.get("commit_to"),
                        "commit_title": push_data.get("commit_title"),
                    }
                )

        return JsonResponse({"data": events}, safe=False)
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
    request.session["slack_state"] = state
    return redirect(authorization_url)


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


###########################
#### SERVER FUNCTIONS #####
###########################


def index(request):
    print("Serve index")
    print(safe_join(settings.FRONTEND_BUILD_PATH, "index.html"))
    return serve(request, "index.html", settings.FRONTEND_BUILD_PATH)


def serve_static(request, path):
    full_path = Path(safe_join(settings.STATIC_SOURCE, path))
    print(f"serve_static(): {full_path}")
    if full_path.is_file():
        return serve(request, path, settings.STATIC_SOURCE)

    return views.default.page_not_found(request, FileNotFoundError())


def get_csrf_token(request):
    return JsonResponse({"csrf-token": django.middleware.csrf.get_token(request)})


def serve_manifest(request):
    # with open((settings.FRONTEND_BUILD_PATH + "/manifest.json"), "r") as file:
    #    data = file.read()
    # return HttpResponse(data);
    return serve(request, "manifest.json", settings.FRONTEND_BUILD_PATH)


def serve_ico(request):
    path = "resources/images/favicon.ico"
    # with open((settings.FRONTEND_BUILD_PATH + "/favicon.ico"), "rb") as file:
    #    data = file.read()
    # return HttpResponse(data)
    return serve(request, path, document_root=settings.FRONTEND_BUILD_PATH)


def set_user(request):  # pylint: disable=unused-argument
    return None


def get_user_by_id(request):  # pylint: disable=unused-argument
    return None


def get_users(request):  # pylint: disable=unused-argument
    return None


def set_preferences(request):
    try:
        if request.content_type != "application/json":
            return HttpResponse(
                "Invalid content type, expected application/json", status=400
            )
        data = json.loads(request.body)
        prefs_path = settings.PREFS_PATH
        prefs = {}
        if os.path.exists(prefs_path):
            with open(prefs_path, "r") as file:
                try:
                    prefs = json.load(file)
                except json.JSONDecodeError:
                    # file is empty
                    pass
                except Exception as e:
                    # some other exception
                    return JsonResponse({"error": str(e)})

        if "removeGithub" in data:
            removal = data["removeGithub"]
            prefs["githubrepos"] = [
                repo for repo in prefs.get("githubrepos", []) if repo != removal
            ]
            save_preferences_to_file(prefs)
            return HttpResponse(status=200)

        if "removeGitlab" in data:
            removal = data["removeGitlab"]
            prefs["gitlabrepos"] = [
                repo for repo in prefs.get("gitlabrepos", []) if repo != removal
            ]
            save_preferences_to_file(prefs)
            return HttpResponse(status=200)

        prefs["githubrepos"] = prefs.get("githubrepos", []) + data.get(
            "githubrepos", []
        )
        prefs["gitlabrepos"] = prefs.get("gitlabrepos", []) + data.get(
            "gitlabrepos", []
        )

        prefs.update(
            {
                key: value
                for key, value in data.items()
                if key != "githubrepos" and key != "gitlabrepos"
            }
        )
        save_preferences_to_file(prefs)
        return HttpResponse(status=200)
    except json.JSONDecodeError:
        return HttpResponse("Invalid JSON format", status=400)
    except Exception as e:
        # Catch any other errors, such as file write errors
        print(e)
        return HttpResponse(f"An error occurred: {str(e)}", status=500)


def load_preferences_from_file():
    try:
        with open(settings.PREFS_PATH, "r") as file:
            return json.load(file)
    except json.JSONDecodeError:
        return {"error": "Failed to decode preferences"}
    except Exception as e:
        return {"error": f"{e}"}


def save_preferences_to_file(data):
    try:
        with open(settings.PREFS_PATH, "w") as file:
            json.dump(data, file)
            print(f"Saved preferences to {settings.PREFS_PATH}")
    except Exception as e:
        print(f"Failed to save preferences: {e}")


def get_preferences(request):  # pylint: disable=unused-argument
    prefs = load_preferences_from_file()
    if "error" in prefs:
        return JsonResponse(prefs, status=500)
    return JsonResponse(prefs)

def connect_source(request, name):
    try:
        for source in EVENT_SOURCES:
            if source['name'] == name:
                iface = source['interface']
                return iface.connect(request)
    except Exception as e:
        print(f"connect_source: {e}")
    return HttpResponse()

def import_events(request, name):
    print(name)
    try:
        for source in EVENT_SOURCES:
            print(f"{name} == {source['name']}")
            if source['name'] == name:
                iface = source['interface']
                events = iface.import_events(request)
                event_dict = []
                for e in events:
                    event_dict.append(model_to_dict(e))
                return JsonResponse({"data": event_dict})
    except Exception as e:
        return JsonResponse({"error": f"{e}"})
    return JsonResponse({"error": f"Event source {name} does not exist"})
