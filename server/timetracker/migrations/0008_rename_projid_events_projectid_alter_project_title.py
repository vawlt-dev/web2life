# Generated by Django 5.0.7 on 2024-09-13 12:43

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('timetracker', '0007_remove_project_description'),
    ]

    operations = [
        migrations.RenameField(
            model_name='events',
            old_name='projId',
            new_name='projectId',
        ),
        migrations.AlterField(
            model_name='project',
            name='title',
            field=models.CharField(max_length=64, unique=True),
        ),
    ]
