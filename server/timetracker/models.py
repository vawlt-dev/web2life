from django.db import models


class Project(models.Model):
    title = models.CharField(max_length=64, primary_key=True)
    description = models.CharField(max_length=256)


class Events(models.Model):
    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=50, default="")
    start = models.DateTimeField(null=True)
    end = models.DateTimeField(null=True)
    allDay = models.BooleanField(default=False)
    task = models.CharField(max_length=30)
    project = models.CharField(max_length=64)
    description = models.CharField(max_length=500)
    projId = models.ForeignKey(Project, on_delete=models.CASCADE)

    class Meta:
        db_table = "Events"
