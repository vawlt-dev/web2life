# Generated by Django 5.1 on 2024-10-07 05:51

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('timetracker', '0001_initial'),
    ]

    operations = [
        migrations.DeleteModel(
            name='ProjectSlackChannelMapEntry',
        ),
    ]