from .models import Events
from .models import Projects
from .models import ProjectSlackChannelMapEntry
import models
from datetime import datetime
import logging

def generate_project_name_from_github_repo(repo):
    return repo

# Translate event fetched from GitHub into
# Events model. Returns the Events object on success, otherwise None
#
# This looks for a project that has the same name as the repo, and if that doesn't exist, it creates the project
def translate_github_event(data):
    # Example PushEvent:
    # {"type": "PushEvent", "time": "2024-06-03T05:40:32Z", "branch": "main", 
    # "repo": "feijoatears/examplerepo", "commit_sha": "d0b6691e88e487bb32462d19329cec1c5cc7239b"}
    try: 
        if data["type"] == "PushEvent":
            time = datetime.strptime(data["time"], "%Y-%m-%dT%H:%M:%SZ")
            return Events(
                title = f"Pushed a commit to {data['repo']} {data['branch']}",
                projId = models.get_or_add_project_from_name(data['repo']),
                start = time,
                end = time,
                allDay = False,
                task = "Push",
                #@TODO: Commit message should go here
                description = ""
            )
        logging.debug("Unknown GitHub event type {}", data["type"])
        return None
    except:
        return None

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
