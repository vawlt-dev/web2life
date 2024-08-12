from django.db import models

class User(models.Model):
    id = models.AutoField(primary_key=True)
    firstName = models.CharField(max_length=64)
    lastName = models.CharField(max_length=64)

    class Meta:
        db_table = "Users"

class Events(models.Model):
    id = models.AutoField(primary_key=True)
    # projid = models.AutoField(foreign_key=True)
    # userid = models.autoField(foreign_key=True)
    task = models.CharField(max_length=32)
    times = models.JSONField(default=list, null=True)
    project = models.CharField(max_length=32)
    description = models.CharField(max_length=500)
    # When the user is deleted, the user's events in the table are deleted too
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True)

    class Meta:
        db_table = "Events"

class Projects(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=64)

    class Meta:
        db_table = "Projects"