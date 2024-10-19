import requests
import datetime

from requests_oauthlib import OAuth2Session
from .event_source import EventSource
from django.conf import settings
from django.shortcuts import redirect

from . import event_translation
from .models import Events

def group_slack_events(data):
    groups = {}

    for msg in data:
        time = datetime.datetime.fromtimestamp(float(msg["time"]))
        hour = event_translation.extract_date_hour(time)
        if hour not in groups:
            groups[hour] = []

        groups[hour].append(msg)

    return groups

def translate_slack_events(data):
    '''Turn grouped message events into Events objects'''
    groups = group_slack_events(data)
    events = []
    for grouped in groups.items():
        hour = grouped[0]
        group = grouped[1]
        events.append(Events(
            title=f"Received {len(group)} messages",
            start=datetime.datetime.fromtimestamp(hour * 3600),
            end=datetime.datetime.fromtimestamp((hour + 1) * 3600),
        ))

    return events

class SlackEventSource(EventSource):
    '''Implementation of event source for Slack API'''
    def connect(self, request):
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
    
    def import_events(self, request):
        token = request.session.get("slack_token")

        if not token or "access_token" not in token:
            raise EventSource.NotAuthorisedError("Slack not connected")
        
        access_token = token["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(
            "https://slack.com/api/conversations.list", headers=headers,
            timeout=settings.REQUEST_TIMEOUT_S
        )
        channel_info = response.json().get("channels", [])

        if not channel_info:
            raise EventSource.ResponseError("No channels found", 200)

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
        
        events = translate_slack_events(messages)
        return events
