import requests
from django.conf import settings
from django.shortcuts import redirect
from requests_oauthlib import OAuth2Session

from .event_source import EventSource
from . import event_translation
from .models import Events

def connect_microsoft(request):
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

def get_outlook_messages(request):
    credentials_info = request.session.get("microsoft_credentials")
    if not credentials_info or not credentials_info.get("access_token"):
        raise EventSource.NotAuthorisedError("Not connected to Microsoft")

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
        return event_translation.translate_email_events(emails)
    raise EventSource.ResponseError("Microsoft responded with an error code", response.status_code)

def get_microsoft_calendar_events(request):
    credentials_info = request.session.get("microsoft_credentials")

    if not credentials_info or "access_token" not in credentials_info:
        raise EventSource.NotAuthorisedError("Microsoft not connected")

    access_token = credentials_info["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    response = requests.get(
        "https://graph.microsoft.com/v1.0/me/events", headers=headers,
        timeout=settings.REQUEST_TIMEOUT_S,
    )

    if response.status_code != 200:
        raise EventSource.ResponseError("Microsoft responded with an error code", 400)

    calendar_data = response.json().get("value", [])
    #calendar_events = [
    #    {
    #        "title": event.get("subject", "No title"),
    #        "start_time": event.get("start", {}).get(
    #            "dateTime", "Unknown start time"
    #        ),
    #        "end_time": event.get("end", {}).get("dateTime", "Unknown end time"),
    #    }
    #    for event in calendar_data
    #]

    events = [
        Events(
            title = event.get("subject", "No Title"),
            start = event.get("start").get("dateTime"),
            end = event.get("end").get("dateTime")
        )
        for event in calendar_data
    ]
    return events


class MicrosftOutlookEventSource():
    def connect(self, request):
        return connect_microsoft(request)
    def import_events(self, request):
        return get_outlook_messages(request)
    
class MicrosftCalendarEventSource():
    def connect(self, request):
        return connect_microsoft(request)
    def import_events(self, request):
        return get_microsoft_calendar_events(request)
