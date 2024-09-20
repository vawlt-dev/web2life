from .models import Events
from .models import Project
from .models import ProjectSlackChannelMapEntry
from .models import EventOrigin
from . import models
import datetime
import calendar
from collections import defaultdict
import logging
import dateutil


def generate_project_name_from_github_repo(repo):
    return repo


# @NOTE(Jamie D)
# Returns an array of Event objects. Commits that happen within the same 1-hour
# time frame are grouped into one event called something like "Pushed <no. commits> commits to <respository>".
# Data should be an array of events that came from
# Github. @TODO: Only works on PushEvent for now
def translate_github_events(data) -> list:
    # repository name -> (hour -> commit count) >:(
    commit_count_map = defaultdict(lambda: defaultdict(int))
    description_map = defaultdict(lambda: defaultdict(str))
    timezone = datetime.timezone(datetime.timedelta(hours=13, minutes=0))

    for e in data:
        time = dateutil.parser.isoparse(e["time"])
        ts = time.astimezone(timezone).timestamp()
        hour = int(ts / 3600)
        commit_count_map[e["repo"]][hour] += 1
        try:
            message = e["message"]
            if (
                len(message) + len(description_map[e["repo"]][hour])
                <= models.Events._meta.get_field("description").max_length
            ):
                description_map[e["repo"]][hour] += "\n- " + e["message"]
        except:
            pass

    events = []

    for repo in commit_count_map.keys():
        for hour in commit_count_map[repo].keys():
            count = commit_count_map[repo][hour]
            e = Events(
                title=f"Pushed {count} commits to {repo}",
                projectID=models.get_or_add_project_from_name(repo),
                start=datetime.datetime.fromtimestamp(hour * 3600),
                end=datetime.datetime.fromtimestamp((hour + 1) * 3600),
                allDay=False,
                description=description_map[repo][hour],
            )

            events.append(e)

    return events


# @TODO: Set up a POST to use this
def map_slack_channel_to_project(channel_name, project_name):
    ProjectSlackChannelMapEntry.objects.create(
        project=project_name, channel_name=channel_name
    )


def translate_slack_event(data):
    try:
        if data["type"] == "message":
            project = ProjectSlackChannelMapEntry.objects.get(
                channel_name=data["channel"]
            )
            if project == None:
                return None
            return Events(
                title=f"Message from {data['user']} in {data['channel']}",
                # @TODO: What format is 'ts' in ?
                start=datetime.datetime.now(),
                end=datetime.datetime.now(),
                description=data["text"],
                projId=project.project,
                task="Messaging",
                allDay=False,
            )
        logging.debug("Unknown Slack event type {}", data["type"])
        return None
    except:
        return None


def google_email_create_events(data):
    for email in data:
        e = None
        e.start = datetime.datetime.strptime(email["date"], "%a, %d %b %Y %H:%M:%S %z")
        e.end = datetime.datetime.strptime(
            email["date"], "%a, %d %b %Y %H:%M:%S %z"
        ) + datetime.timedelta(hours=0.5)
        e.title = email["subject"]
    return e
