# pylint: disable=too-few-public-methods
from enum import Enum
from django.db import models


class Project(models.Model):
    """A project added by the user that groups events"""

    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=64, unique=True)

    class Meta:  # pylint: disable=missing-class-docstring
        db_table = "Project"


# @NOTE(Jamie D): These codes are what is stored in the DB so don't change them
class EventOrigin(Enum):
    """Currently unused but might be used later"""

    USER = 0
    GOOGLE_GMAIL = 1
    GITHUB = 2
    GITLAB = 3
    MICROSOFT = 4
    SLACK = 5


class Events(models.Model):
    """An event presented to the user in the calendar UI"""

    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=50, default="")
    start = models.DateTimeField(null=True)
    end = models.DateTimeField(null=True)
    allDay = models.BooleanField(default=False, null=True)
    description = models.CharField(max_length=500, default="")
    projectId = models.ForeignKey(
        Project, on_delete=models.CASCADE, default=None, null=True
    )

    def __str__(self):
        return f'{{ID: {self.id}, Title: "{self.title}", Description: "{self.description}"}}'

    class Meta:  # pylint: disable=missing-class-docstring
        db_table = "Events"


def get_or_add_project_from_name(name):
    """Try to find a project matching the specified name.
    If the project does not exist, it is created and added to the database"""
    try:
        project = Project.objects.get(title=name)
        return project

    except Project.DoesNotExist:
        # @TODO: Descriptions
        return Project.objects.create(title=name)


class Template(models.Model):
    '''Just an ID and name. Template events with their templateID as this
    template's ID are part of this template.'''
    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=50, default="")

    def __str__(self):
        return f'{{ID: {self.id}, Title: "{self.title}""}}'

    class Meta:
        db_table = "Template"


class TemplateEvents(models.Model):
    '''Events that are part of a template'''
    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=50, default="")
    start = models.DateTimeField(null=True)
    end = models.DateTimeField(null=True)
    description = models.CharField(max_length=500, default="")
    projectId = models.ForeignKey(
        Project, on_delete=models.CASCADE, default=None, null=True
    )
    templateId = models.ForeignKey(
        Template, on_delete=models.CASCADE, default=None, null=True
    )

    def __str__(self):
        return f'{{ID: {self.id}, Title: "{self.title}", Description: "{self.templateId}"}}'

    class Meta:
        db_table = "TemplateEvents"
