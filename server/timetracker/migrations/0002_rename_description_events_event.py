# Generated by Django 5.0.7 on 2024-08-03 11:09

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("timetracker", "0001_initial"),
    ]

    operations = [
        migrations.RenameField(
            model_name="Events",
            old_name="projectName",
            new_name="project",
        ),
        migrations.RenameField(
            model_name="Events",
            old_name="taskName",
            new_name="task",
        ),
        migrations.RenameField(
            model_name="Events",
            old_name="eventDescription",
            new_name="description",
        ),
    ]