# Generated by Django 5.0.6 on 2024-08-03 08:16

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Events",
            fields=[
                ("id", models.AutoField(primary_key=True, serialize=False)),
                ("projectName", models.CharField(max_length=32)),
                ("taskName", models.CharField(max_length=32)),
                ("eventDescription", models.CharField(max_length=500)),
            ],
            options={
                "db_table": "Events",
            },
        ),
    ]
