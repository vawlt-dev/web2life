# Generated by Django 5.1 on 2024-09-19 02:22

import timetracker.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('timetracker', '0011_events_origin'),
    ]

    operations = [
        migrations.AlterField(
            model_name='events',
            name='origin',
            field=models.IntegerField(default=timetracker.models.EventOrigin['USER']),
        ),
    ]
