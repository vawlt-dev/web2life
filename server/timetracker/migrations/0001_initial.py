# Generated by Django 5.0.7 on 2024-10-15 15:47

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Project',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=64, unique=True)),
            ],
            options={
                'db_table': 'Project',
            },
        ),
        migrations.CreateModel(
            name='Template',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('title', models.CharField(default='', max_length=50)),
            ],
            options={
                'db_table': 'Template',
            },
        ),
        migrations.CreateModel(
            name='Events',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('title', models.CharField(default='', max_length=50)),
                ('start', models.DateTimeField(null=True)),
                ('end', models.DateTimeField(null=True)),
                ('allDay', models.BooleanField(default=False, null=True)),
                ('description', models.CharField(default='', max_length=500)),
                ('projectId', models.ForeignKey(default=None, null=True, on_delete=django.db.models.deletion.CASCADE, to='timetracker.project')),
            ],
            options={
                'db_table': 'Events',
            },
        ),
        migrations.CreateModel(
            name='TemplateEvents',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('title', models.CharField(default='', max_length=50)),
                ('start', models.TimeField(null=True)),
                ('end', models.TimeField(null=True)),
                ('day', models.CharField(default='', max_length=9)),
                ('description', models.CharField(default='', max_length=500)),
                ('projectId', models.ForeignKey(default=None, null=True, on_delete=django.db.models.deletion.CASCADE, to='timetracker.project')),
                ('templateId', models.ForeignKey(default=None, null=True, on_delete=django.db.models.deletion.CASCADE, to='timetracker.template')),
            ],
            options={
                'db_table': 'TemplateEvents',
            },
        ),
    ]
