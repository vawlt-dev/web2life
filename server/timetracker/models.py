from django.db import models


# Create your models here.


class Events(models.Model):
    id = models.AutoField(primary_key=True)
    projectName = models.CharField(max_length=32)
    taskName = models.CharField(max_length=32)
    eventDescription = models.CharField(max_length=500)

    # Define the table name
    class Meta:
        db_table = 'Events'