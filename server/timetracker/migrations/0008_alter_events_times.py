# Generated by Django 5.0.7 on 2024-08-06 11:57

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("timetracker", "0007_remove_events_allday_remove_events_end_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="events",
            name="times",
            field=models.JSONField(default=list, null=True),
        ),
    ]