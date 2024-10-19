import datetime
import traceback
from datetime import timedelta
from datetime import datetime

from django.conf import settings
from django.shortcuts import redirect
from django.http import JsonResponse, HttpResponse
from django.forms.models import model_to_dict
from googleapiclient.http import BatchHttpRequest
import googleapiclient.discovery
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow

from .event_source import EventSource
from . import event_translation
from .models import Events

def connect_google():
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
    print(authorization_url)
    return redirect(authorization_url)


# uses batch processing, cuts time down from 25 seconds to 2 seconds (50 messages)
def get_gmail_messages(request):
    if "google_credentials" not in request.session:
        raise EventSource.NotAuthorisedError("Not connected to Google")

    credentials_info = request.session["google_credentials"]
    credentials = Credentials(
        token=credentials_info["token"],
        refresh_token=credentials_info["refresh_token"],
        token_uri=credentials_info["token_uri"],
        client_id=credentials_info["client_id"],
        client_secret=credentials_info["client_secret"],
        scopes=credentials_info["scopes"],
    )

    gmail = googleapiclient.discovery.build("gmail", "v1", credentials=credentials)

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
    return translated

def get_google_calendar_events(request):
    if "google_credentials" not in request.session:
        raise EventSource.NotAuthorisedError("Not connected to Google")

    credentials_info = request.session["google_credentials"]
    credentials = Credentials(
        token=credentials_info["token"],
        refresh_token=credentials_info["refresh_token"],
        token_uri=credentials_info["token_uri"],
        client_id=credentials_info["client_id"],
        client_secret=credentials_info["client_secret"],
        scopes=credentials_info["scopes"],
    )
    
    calendar = googleapiclient.discovery.build("calendar", "v3", credentials=credentials)
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
    #for event in events_list:
    #    info = {
    #        "id": event.get("id"),
    #        "title": event.get("summary", "No title"),
    #        "start": event["start"].get("dateTime", event["start"].get("date")),
    #        "end": event["end"].get("dateTime", event["end"].get("date")),
    #    }
    #    events.append(info)

    for e in events_list:
        
        events.append(
            Events(
                title=e.get("summary", "No title"),
                start=e["start"].get("dateTime", e["start"].get("date")),
                end=e["end"].get("dateTime", e["end"].get("date")),
            )
        )

    return events

class GoogleCalendarEventSource(EventSource):
    def connect(self, request):
        return connect_google()
    def import_events(self, request):
        return get_google_calendar_events(request)

class GoogleGMailEventSource(EventSource):
    def connect(self, request):
        return connect_google()
    def import_events(self, request):
        return get_gmail_messages(request)
