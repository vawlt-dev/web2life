import datetime
import json
import os
from pathlib import Path
from datetime import datetime, timedelta

import pytz
import django.middleware.csrf
import django.db
import django.db.models
import django.db.models.utils
from django.db.models import Q
from django.utils._os import safe_join
from django.views.static import serve
from django import views
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_POST, require_http_methods
from django.conf import settings
from django.shortcuts import redirect
from requests_oauthlib import OAuth2Session

from .event_source_list import EVENT_SOURCES
from . import prefs as user_prefs
from .models import Events, TemplateEvents, Template
from .models import Project


def get_events(request):  # pylint: disable=unused-argument
    events = []
    for event in Events.objects.select_related("projectId").all():
        events.append(
            {
                "id": event.id,
                "title": event.title,
                "start": event.start,
                "end": event.end,
                "allDay": event.allDay,
                "description": event.description,
                "project_title": event.projectId.title if event.projectId else None,
            }
        )
        print(event)
    return JsonResponse({"data": events})


@require_POST
def set_event(request):
    print(request.body)
    try:
        data = json.loads(request.body)
        project = None
        try:
            project = Project.objects.get(title=data["project"])
        except:
            print("No project found, defaulting to null")

        event = Events(
            title=data["title"],
            description=data["description"],
            start=data["start"],
            end=data["end"],
            allDay=True if data["allDay"] == "on" else False,
            projectId=project,
        )

        event.save()
        return HttpResponse()
    except Exception as e:
        print(e)
        # @TODO: Return error code
        return HttpResponse()


def get_event_by_id(request):
    try:
        data = json.loads(request.body)
        event = Events.objects.get(id=data["id"])
        return JsonResponse({"data": event.task})
    except Exception as e:
        print(e)
        return JsonResponse({"error": "Event not found"})


def get_projects(request):
    projects = list(Project.objects.all().values())
    print(f"get_projects: {request}")
    return JsonResponse({"data": projects})


def add_project(request):
    try:
        data = json.loads(request.body)
        project = Project(title=data["project"])
        project.save()
        return HttpResponse()
    except:
        return HttpResponse()


def filter_events(request):
    events = filter.filter_events(request)
    return JsonResponse({"data": events})


def patch_event(request):
    try:
        data = json.loads(request.body)
        event = Events.objects.get(id=data["originalEvent"]["id"])
        new_event = data["newEvent"]

        new_start = new_event["start"]
        new_end = new_event["end"]
        new_all_day = new_event["allDay"]
        new_description = new_event["description"]
        # newProject = data["newEvent"]["project"]

        event.start = new_start
        event.end = new_end
        event.allDay = new_all_day
        event.description = new_description
        event.save()
    except Exception as e:
        print(e)
    return HttpResponse()


# def update_event_times(request):
#     try:
#         data = json.loads(request.body)
#         event = Events.objects.get(id=data["originalEvent"]["id"])
#         new_event = data["newEvent"]
#         new_start = new_event.get("start")
#         new_end = new_event.get("end")
#         new_all_day = new_event.get("allDay")

#         event.start = new_start
#         event.end = new_end
#         event.allDay = new_all_day
#         event.save()
#     except Exception as e:
#         print(e)
#     return HttpResponse()


# def delete_event_time(request):
#     try:
#         data = json.loads(request.body)
#         event = Events.objects.get(id=data["id"])

#         event.times = [
#             # no idea how this works but it does
#             # can't directly delete the time, so have to
#             # re-create the times array with the time to delete
#             # filtered out
#             time
#             for time in event.times
#             if not (
#                 time.get("start") == data["start"]
#                 and time.get("end") == data["end"]
#                 and time.get("allDay") == data["allDay"]
#             )
#         ]
#         event.save()
#     except Exception as e:
#         print(e)
#     return HttpResponse()


def delete_event(request):
    try:
        data = json.loads(request.body)
        event = Events.objects.get(id=data["id"])
        event.delete()
        print(event)
    except Exception as e:
        print(e)
    return HttpResponse()


def clear_events(request):  # pylint: disable=unused-argument
    print("In clear_events")
    Events.objects.all().delete()
    return HttpResponse()


def delete_project(request):
    print(f"delete_project: {request}")
    try:
        data = json.loads(request.body)
        print(f"Delete project: {data['title']}")
        project = Project.objects.get(title=data["title"])
        project.delete()
        return HttpResponse()
    except:
        return HttpResponse()


###########################
#### SERVER FUNCTIONS #####
###########################


def index(request):
    print("Serve index")
    print(safe_join(settings.FRONTEND_BUILD_PATH, "index.html"))
    return serve(request, "index.html", settings.FRONTEND_BUILD_PATH)


def serve_static(request, path):
    full_path = Path(safe_join(settings.STATIC_SOURCE, path))
    print(f"serve_static(): {full_path}")
    if full_path.is_file():
        return serve(request, path, settings.STATIC_SOURCE)

    return views.defaults.page_not_found(request, FileNotFoundError())


def get_csrf_token(request):
    return JsonResponse({"csrf-token": django.middleware.csrf.get_token(request)})


def serve_manifest(request):
    # with open((settings.FRONTEND_BUILD_PATH + "/manifest.json"), "r") as file:
    #    data = file.read()
    # return HttpResponse(data);
    return serve(request, "manifest.json", settings.FRONTEND_BUILD_PATH)


def serve_ico(request):
    path = "resources/images/favicon.ico"
    # with open((settings.FRONTEND_BUILD_PATH + "/favicon.ico"), "rb") as file:
    #    data = file.read()
    # return HttpResponse(data)
    return serve(request, path, document_root=settings.FRONTEND_BUILD_PATH)


def set_preferences(request):
    try:
        if request.content_type != "application/json":
            return HttpResponse(
                "Invalid content type, expected application/json", status=400
            )
        data = json.loads(request.body)
        prefs_path = settings.PREFS_PATH
        prefs = {}
        if os.path.exists(prefs_path):
            with open(prefs_path, "r") as file:
                try:
                    prefs = json.load(file)
                except json.JSONDecodeError:
                    # file is empty
                    pass
                except Exception as e:
                    # some other exception
                    return JsonResponse({"error": str(e)})

        if "removeGithub" in data:
            removal = data["removeGithub"]
            prefs["githubrepos"] = [
                repo for repo in prefs.get("githubrepos", []) if repo != removal
            ]
            user_prefs.save(prefs)
            return HttpResponse(status=200)

        if "removeGitlab" in data:
            removal = data["removeGitlab"]
            prefs["gitlabrepos"] = [
                repo for repo in prefs.get("gitlabrepos", []) if repo != removal
            ]
            user_prefs.save(prefs)
            return HttpResponse(status=200)

        prefs["githubrepos"] = prefs.get("githubrepos", []) + data.get(
            "githubrepos", []
        )
        prefs["gitlabrepos"] = prefs.get("gitlabrepos", []) + data.get(
            "gitlabrepos", []
        )

        if "break" in data:
            break_data = data["break"]
            if "from" in break_data and "to" in break_data:
                prefs["break"] = {
                    "from": break_data["from"],
                    "to": break_data["to"],
                }

        prefs.update(
            {
                key: value
                for key, value in data.items()
                if key not in ("githubrepos", "gitlabrepos")
            }
        )
        user_prefs.save(prefs)
        return HttpResponse(status=200)
    except json.JSONDecodeError:
        return HttpResponse("Invalid JSON format", status=400)
    except Exception as e:
        # Catch any other errors, such as file write errors
        print(e)
        return HttpResponse(f"An error occurred: {str(e)}", status=500)


def get_preferences(request):  # pylint: disable=unused-argument
    prefs, error = user_prefs.load()
    if error is None or isinstance(error, FileNotFoundError):
        return JsonResponse(prefs, status=200)
    return JsonResponse(prefs, status=500)


def connect_source(request, name):
    try:
        source = EVENT_SOURCES[name]
        return source.connect(request)
    except Exception as e:
        print(f"connect_source: {e}")
    return HttpResponse()


def create_template(request):
    try:
        data = json.loads(request.body)
        name = data.get("name")
        events = data.get("events")
        print(events)
        template = Template(title=name)
        template.save()

        for event in events:
            print(event)
            template_event = TemplateEvents(
                title=event.get("title"),
                start=event.get("start"),
                end=event.get("end"),
                description=event.get("description"),
                projectId=event.get("projectId"),
                templateId=template,
            )
            template_event.save()

        return HttpResponse("Template and events created successfully")

    except ValueError:
        return HttpResponse("Invalid date format", status=400)
    except Exception as e:
        print(f"Error: {e}")
        return HttpResponse(f"An error occurred: {e}", status=500)


def get_templates(request):  # pylint: disable=unused-argument
    templates = []
    for template in Template.objects.all():
        templates.append(
            {
                "id": template.id,
                "title": template.title,
            }
        )
    print(templates)
    return JsonResponse({"data": templates})


def load_template(request):
    try:
        data = json.loads(request.body)
        template_id = data.get("template")
        view_range = data.get("range")

        start_date = datetime.fromisoformat(view_range["start"])
        end_date = datetime.fromisoformat(view_range["end"])

        try:
            template = Template.objects.get(id=template_id)
        except Template.DoesNotExist:
            return JsonResponse({"error": "Template doesn't exist"}, status=404)

        t_events = TemplateEvents.objects.filter(templateId=template)

        if not t_events.exists():
            return JsonResponse(
                {"error": "No events found in the template"}, status=404
            )

        events = []

        for event in t_events:
            days_offset = (
                event.start.date() - min(t_events, key=lambda e: e.start).start.date()
            ).days

            new_start = (start_date + timedelta(days=days_offset)).replace(
                hour=event.start.hour,
                minute=event.start.minute,
                second=event.start.second,
                microsecond=event.start.microsecond,
            )

            new_end = (start_date + timedelta(days=days_offset)).replace(
                hour=event.end.hour,
                minute=event.end.minute,
                second=event.end.second,
                microsecond=event.end.microsecond,
            )

            if start_date <= new_start <= end_date:
                events.append(
                    {
                        "id": event.id,
                        "title": event.title,
                        "start": new_start,
                        "end": new_end,
                        "description": event.description,
                        "projectId": event.projectId.id if event.projectId else None,
                    }
                )
        print(events)
        return JsonResponse({"data": events})

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON format"}, status=400)
    except Exception as e:
        print("Exception occurred: ", str(e))
        return HttpResponse(f"An error occurred: {str(e)}", status=500)


@require_http_methods(["DELETE"])
def delete_template(request):
    try:
        templateId = json.loads(request.body).get("template")
        template = Template.objects.get(id=templateId)
        template.delete()
        return JsonResponse(
            {f"message": "successfully deleted template with ID: {templateId}"}
        )
    except Exception as e:
        return JsonResponse({"error": str(e)})


# not needed currently, hours sorted by frontend
def hours_in_week(request):
    try:
        data = json.loads(request.body)
        date_str = data.get("date")  # ISO format input date
        gmt = pytz.timezone("Etc/GMT-13")

        input_date = datetime.fromisoformat(date_str)
        input_date_utc = input_date.astimezone(pytz.UTC)
        input_date_gmt = input_date_utc.astimezone(gmt)

        monday = input_date_gmt - timedelta(days=input_date_gmt.weekday())
        monday = monday.replace(hour=0, minute=0, second=0, microsecond=0)

        sunday = monday + timedelta(days=6, hours=23, minutes=59, seconds=59)

        events_for_week = Events.objects.filter(
            start__gte=monday.astimezone(pytz.UTC), end__lte=sunday.astimezone(pytz.UTC)
        )
        seconds = 0
        for event in events_for_week:
            k = event.end - event.start
            seconds += k.total_seconds()

        hours = seconds / 3600
        return JsonResponse({"hours": hours})
    except ValueError:
        return HttpResponse("Invalid date format", status=400)
    except Exception as e:
        print(f"Error: {e}")
        return HttpResponse(f"An error occurred: {e}", status=500)
