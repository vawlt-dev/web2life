import requests
import datetime

import slack_sdk
import slack_sdk.oauth
from requests_oauthlib import OAuth2Session
from .event_source import EventSource
from django.conf import settings
from django.shortcuts import redirect

from . import event_translation
from .models import Events

# How many seconds per group of messages
# 60 minutes
SECONDS_PER_CHUNK = 60*60

def group_slack_events(data, user_id):
    groups = {}

    for msg in data:
        if msg["user"] != user_id:
            continue
        print(msg)
        time = datetime.datetime.fromtimestamp(float(msg["time"]))
        chunk = int(time.timestamp() / SECONDS_PER_CHUNK)
        if chunk not in groups:
            groups[chunk] = []

        groups[chunk].append(msg)

    return groups

def translate_slack_events(data, user_id):
    '''Turn grouped message events into Events objects'''
    groups = group_slack_events(data, user_id)
    events = []
    for grouped in groups.items():
        chunk = grouped[0]
        group = grouped[1]
        channel_counts = {}
        description = ""
        for msg in group:
            if msg["channel"] not in channel_counts:
                channel_counts[msg["channel"]] = 0
            channel_counts[msg["channel"]] += 1
        
        for i in channel_counts.items():
            channel = i[0]
            count = i[1]
            description += f"{count} messages in {channel}\n"

        events.append(Events(
            title = f"Sent {len(group)} messages",
            description = description,
            start = datetime.datetime.fromtimestamp(chunk * SECONDS_PER_CHUNK),
            end = datetime.datetime.fromtimestamp((chunk + 1) * SECONDS_PER_CHUNK),
        ))

    return events

class SlackEventSource(EventSource):
    '''Implementation of event source for Slack API'''
    state: slack_sdk.oauth.OAuthStateStore
    def connect(self, request):
        self.state = slack_sdk.oauth.state_store.FileOAuthStateStore(expiration_seconds=300)

        url_gen = slack_sdk.oauth.AuthorizeUrlGenerator(
            client_id=settings.SLACK_CLIENT_ID,
            scopes=[
                "channels:history",
                "im:history",
                "channels:read",
                "im:read",
                "mpim:history",
                "groups:history",
            ],
            redirect_uri=settings.SLACK_CALLBACK,
        )
        
        url = url_gen.generate(self.state.issue())
        return redirect(url)

    def import_events(self, request):
        if "slack_token" not in request.session:
            raise EventSource.NotAuthorisedError("Slack not connected")
        
        user_token = request.session.get("slack_token")
        client = slack_sdk.WebClient(token=user_token)

        response = client.conversations_list()
        channel_info = response.get("channels")
        if not channel_info:
            raise EventSource.ResponseError("No channels found", 200)

        channels = []
        for channel in channel_info:
            channels.append(
                {"channel_id": channel.get("id"), "channel_name": channel.get("name")}
            )

        messages = []
        for channel in channels:
            response = slack_sdk.WebClient(token=user_token).conversations_history(channel=channel["channel_id"])
            message_list = response.get("messages")
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
        
        events = translate_slack_events(messages, request.session["slack_user_id"])
        return events
