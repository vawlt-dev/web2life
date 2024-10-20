import datetime
from collections import defaultdict

import dateutil

from .models import Events
from . import models

GIT_CHUNK_TIME = 60*60

def extract_date_hour(date: datetime.datetime):
    '''Get hours since epoch from a datetime object'''
    return int(date.timestamp() / 3600)

def group_git_events(data: list) -> dict:
    '''
    Group Git events by the timeframe they
    happen in and what repository. Return value is a dictionary
    mapping repository name to a dictionary mapping timeframe to a list
    of events.
    '''
    groups = {}

    for e in data:
        time = e["time"]
        repo = e["repo"]
        timeframe = int(time.timestamp() / GIT_CHUNK_TIME)
        if repo not in groups:
            groups[repo] = {}
        if timeframe not in groups[repo]:
            groups[repo][timeframe] = []
        groups[repo][timeframe].append(e)
    
    return groups

# @NOTE(Jamie D)
# Returns an array of Event objects. Commits that happen within the same 1-hour
# time frame are grouped into one event called something like
# "Pushed <no. commits> commits to <respository>".
# Data should be an array of events that came from
# Github.
def translate_git_events(data) -> list:
    '''
    Creates and returns a list of Event objects from 
    Git commit JSON data. The data should contain fields:
    "time": The time of the event in a datetime object.
    "repo": The repository which the commit occured in.
    "message": The commit message.
    '''
    events = []
    groups = group_git_events(data)
    for group in groups.items():
        repo = group[0]
        group_timeframes = group[1]
        for timeframe in group_timeframes.items():
            timestamp = timeframe[0]
            description = ""
            commits = timeframe[1]
            for commit in commits:
                if "message" in commit:
                    description += f"- {commit['message']}\n"
            events.append(Events(
                title=f"Pushed {len(commits)} commits to {repo}",
                description=description,
                start=datetime.datetime.fromtimestamp(timestamp * GIT_CHUNK_TIME),
                end=datetime.datetime.fromtimestamp((timestamp+1) * GIT_CHUNK_TIME),
            ))
    return events

def group_email_events(data):
    '''Group email subjects and recipients by hour'''

    desc_map = defaultdict(lambda: [])

    for email in data:
        date = dateutil.parser.isoparse(email["date"])
        hour = extract_date_hour(date)
        desc_map[hour].append(email)

    result = []
    for d in desc_map.values():
        result.append(d)

    return result

def translate_email_events(data):
    '''
    Translate list of email event JSON data to a list of Events objects.
    The JSON data must have:
    "date": The date an time the email was received.
    "subject": The subject line of the email.
    '''
    groups = group_email_events(data)
    result = []

    for g in groups:
        description = ""
        first_email = g[0]
        date = dateutil.parser.isoparse(first_email["date"])
        hour = extract_date_hour(date)

        for email in g:
            if "subject" in email:
                description += f"To {email['recipient']}: {email['subject']}\n\n"

        event = Events(
            title = f"Sent {len(g)} emails",
            description = description,
            start = datetime.datetime.fromtimestamp(hour * 3600),
            end = datetime.datetime.fromtimestamp((hour + 1) * 3600),
            allDay = False,
            projectId = models.get_or_add_project_from_name("Sent Emails"),
        )

        result.append(event)

    return result

