# Generated by Django 5.0.7 on 2024-09-13 12:28

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('timetracker', '0004_remove_events_project'),
    ]

    operations = [
        migrations.AlterField(
            model_name='project',
            name='id',
            field=models.AutoField(primary_key=True, serialize=False),
        ),
    ]