# Generated by Django 5.0.6 on 2024-10-10 08:47

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('timetracker', '0004_templateevents_projectid'),
    ]

    operations = [
        migrations.AlterField(
            model_name='templateevents',
            name='end',
            field=models.TimeField(null=True),
        ),
        migrations.AlterField(
            model_name='templateevents',
            name='start',
            field=models.TimeField(null=True),
        ),
    ]