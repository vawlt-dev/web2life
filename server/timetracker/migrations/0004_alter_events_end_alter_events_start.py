# Generated by Django 5.0.7 on 2024-08-05 11:22

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("timetracker", "0003_events_end_events_isallday_events_start"),
    ]

    operations = [
        migrations.AlterField(
            model_name="events",
            name="end",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="events",
            name="start",
            field=models.DateField(blank=True, null=True),
        ),
    ]