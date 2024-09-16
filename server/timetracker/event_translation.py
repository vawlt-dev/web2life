from .models import Events
from .models import Project
from .models import ProjectSlackChannelMapEntry
from . import models
from datetime import datetime
import calendar
from collections import defaultdict
import logging

def generate_project_name_from_github_repo(repo):
    return repo

# @NOTE(Jamie D)
# Returns an array of Event objects. Commits that happen within the same 1-hour
# time frame are grouped into one event called something like "Pushed <no. commits> commits to <respository>".
# Data should be an array of events that came from
# Github. @TODO: Only works on PushEvent for now
def translate_github_events(data) -> list:
    # repository name -> (hour -> commit count) >:(
    commit_count_map = defaultdict(lambda:defaultdict(int))
    description_map = defaultdict(lambda:defaultdict(str))

    for e in data:
        time = datetime.strptime(e["time"], "%Y-%m-%dT%H:%M:%SZ")
        ts = time.timestamp()
        hour = int(ts / 3600)
        commit_count_map[e["repo"]][hour] += 1
        try:
            message = e["message"]
            if len(message) + len(description_map[e["repo"]][hour]) <= models.Events._meta.get_field("description").max_length:
                description_map[e["repo"]][hour] += "\n- " + e["message"]
        except: pass
        
    events = []

    for repo in commit_count_map.keys():
        for hour in commit_count_map[repo].keys():
            count = commit_count_map[repo][hour]
            print(description_map[repo][hour])
            #print(f"{hour} {repo}: {commit_count_map[repo][hour]}")
            e = Events(
                title = f"Pushed {count} commits to {repo}",
                projectID = models.get_or_add_project_from_name(repo),
                start = datetime.fromtimestamp(hour * 3600),
                end = datetime.fromtimestamp((hour + 1) * 3600),
                allDay = False,
                description = "",
            )

            events.append(e)

    return events

#@TODO: Set up a POST to use this
def map_slack_channel_to_project(channel_name, project_name):
    ProjectSlackChannelMapEntry.objects.create(project=project_name, channel_name=channel_name)

def translate_slack_event(data):
    try:
        if data["type"] == "message":
            project = ProjectSlackChannelMapEntry.objects.get(channel_name=data["channel"])
            if project == None: return None
            return Events(
                title = f"Message from {data['user']} in {data['channel']}",
                #@TODO: What format is 'ts' in ?
                start = datetime.now(),
                end = datetime.now(),
                description=data["text"],
                projId = project.project,
                task = "Messaging",
                allDay = False,
            )
        logging.debug("Unknown Slack event type {}", data["type"])
        return None
    except:
        return None
