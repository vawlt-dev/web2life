# Generated by Django 4.2.1 on 2024-08-22 03:57

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('timetracker', '0011_project_alter_events_project'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='project',
            name='end',
        ),
        migrations.RemoveField(
            model_name='project',
            name='start',
        ),
    ]