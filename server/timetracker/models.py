from django.db import models


# Create your models here.


class Events(models.Model):
    id = models.AutoField(primary_key=True)
    project = models.CharField(max_length=32)
    task = models.CharField(max_length=32)
    description = models.CharField(max_length=500)

    # Define the table name
    class Meta:
        db_table = "Events"
