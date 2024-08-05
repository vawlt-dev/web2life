from django.db import models


# Create your models here.


class Events(models.Model):
    id = models.AutoField(primary_key=True)
    task = models.CharField(max_length=32)
    start = models.DateTimeField(null=True, blank=True)
    end = models.DateTimeField(null=True, blank=True)
    isAllDay = models.BooleanField(default=True)
    project = models.CharField(max_length=32)
    description = models.CharField(max_length=500)

    # Define the table name
    class Meta:
        db_table = "Events"
