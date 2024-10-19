import datetime
from collections import defaultdict

import dateutil

from .models import Events
from . import models

def extract_date_hour(date: datetime.datetime):
    '''Get hours since epoch from a datetime object'''
    return int(date.timestamp() / 3600)

# @NOTE(Jamie D)
# Returns an array of Event objects. Commits that happen within the same 1-hour
# time frame are grouped into one event called something like
# "Pushed <no. commits> commits to <respository>".
# Data should be an array of events that came from
# Github.
def translate_github_events(data) -> list:
    '''
    Creates and returns a list of Event objects from 
    Git commit JSON data. The data should contain fields:
    "time": The time of the event in ISO 8601 format.
    "repo": The repository which the commit occured in.
    "message": The commit message.
    '''
    # repository name -> (hour -> commit count) >:(
    commit_count_map = defaultdict(lambda: defaultdict(int))
    description_map = defaultdict(lambda: defaultdict(str))
    #timezone = datetime.timezone(datetime.timedelta(hours=13, minutes=0))

    for e in data:
        time = dateutil.parser.isoparse(e["time"])
        hour = extract_date_hour(time)
        commit_count_map[e["repo"]][hour] += 1
        if "repo" not in e or "message" not in e or "time" not in e:
            continue
        message = e["message"]
        if (
            len(message) + len(description_map[e["repo"]][hour])
            <= models.Events._meta.get_field("description").max_length  #pylint: disable=protected-access disable=no-member
        ):
            description_map[e["repo"]][hour] += "\n- " + e["message"]

    events = []

    for repo in commit_count_map.items():
        for hour in repo[1].keys():
            count = repo[1][hour]
            e = Events(
                title=f"Pushed {count} commits to {repo[0]}",
                projectId=models.get_or_add_project_from_name(repo[0]),
                start=datetime.datetime.fromtimestamp(hour * 3600),
                end=datetime.datetime.fromtimestamp((hour + 1) * 3600),
                allDay=False,
                description=description_map[repo[0]][hour],
            )

            events.append(e)

    return events

# def translate_slack_event(data):
#     try:
#         if data["type"] == "message":
#             return Events(
#                 title=f"Message from {data['user']} in {data['channel']}",
#                 # @TODO: What format is 'ts' in ?
#                 start=datetime.datetime.now(),
#                 end=datetime.datetime.now(),
#                 description=data["text"],
#                 task="Messaging",
#                 allDay=False,
#             )
#         logging.debug(f"Unknown Slack event type {data['type']}")
#         return None
#     except:
#         return None


# def google_email_create_events(data):
#     for email in data:
#         e = None
#         e.start = datetime.datetime.strptime(email["date"], "%a, %d %b %Y %H:%M:%S %z")
#         e.end = datetime.datetime.strptime(
#             email["date"], "%a, %d %b %Y %H:%M:%S %z"
#         ) + datetime.timedelta(hours=0.5)
#         e.title = email["subject"]
#     return e

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
            description += email['subject']

        event = Events(
            title = f"Sent {len(g)} emails",
            description = g,
            start = datetime.datetime.fromtimestamp(hour * 3600),
            end = datetime.datetime.fromtimestamp((hour + 1) * 3600),
            allDay = False,
            projectId = models.get_or_add_project_from_name("Sent Emails"),
        )

        result.append(event)

    return result

