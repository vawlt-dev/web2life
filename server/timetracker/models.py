from django.db import models
from enum import Enum

class Project(models.Model):
    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=64, unique=True)

    class Meta:
        db_table = 'Project'

#@NOTE(Jamie D): These codes are what is stored in the DB so don't change them
class EventOrigin(Enum):
    USER = 0
    GOOGLE_GMAIL = 1
    GITHUB = 2
    GITLAB = 3
    MICROSOFT = 4
    SLACK = 5

class Events(models.Model):
    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=50, default="")
    start = models.DateTimeField(null=True)
    end = models.DateTimeField(null=True)
    allDay = models.BooleanField(default=False)
    description = models.CharField(max_length=500)
    projectID = models.ForeignKey(
        Project, on_delete=models.CASCADE, default=None, null=True
    )
    origin = models.IntegerField()

    def __str__(self):
        return f"{{ID: {self.id}, Title: \"{self.title}\", Description: \"{self.description}\"}}"

    class Meta:
        db_table = "Events"


# Maps a Slack channel name to a project in the database
class ProjectSlackChannelMapEntry(models.Model):
    channel_name = models.CharField(max_length=64, primary_key=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)


def get_or_add_project_from_name(name):
    try:
        project = Project.objects.get(title=name)
        return project

    except:
        # @TODO: Descriptions
        return Project.objects.create(title=name)
