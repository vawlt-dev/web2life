import datetime
import json
import os
from pathlib import Path
from datetime import datetime, timedelta
import dateutil.parser

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
    return JsonResponse({"data": events})


@require_POST
def set_event(request):
    print("In setEvent")
    print(request.body)
    try:
        data = json.loads(request.body)
        project = None

        if data.get("projectId"):
            try:
                project = Project.objects.get(id=data["projectId"])
            except Project.DoesNotExist:
                print("No project found, defaulting to null")
        else:
            print("No project provided, setting project to None")

        try:
            start_datetime = dateutil.parser.isoparse(data["start"])
            end_datetime = dateutil.parser.isoparse(data["end"])

            event = Events(
                title=data["title"],
                description=data["description"],
                start=start_datetime,
                end=end_datetime,
                allDay=False,
                projectId=project,
            )
            event.save()
            event_data = {
                "id": event.id,
                "title": event.title,
                "description": event.description,
                "start": event.start,
                "end": event.end,
                "allDay": event.allDay,
                "projectId": (
                    event.projectId.id if event.projectId else None
                ),  # Handle project if present
            }
            return JsonResponse(event_data)
        except Exception as e:
            print("Error saving event:", e)
            return HttpResponse(f"Error saving event: {e}", status=500)

    except Exception as e:
        print("Error in request body:", e)
        return HttpResponse(f"Error processing event: {e}", status=400)


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
        template = Template(title=name)
        template.save()

        for event in events:
            e_start = datetime.fromisoformat(event["start"])
            e_end = datetime.fromisoformat(event["end"])
            template_event = TemplateEvents(
                title=event.get("title"),
                start=datetime.astimezone(e_start, pytz.UTC),
                end=datetime.astimezone(e_end, pytz.UTC),
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
    return JsonResponse({"data": templates})


from datetime import datetime, timedelta
import pytz


from datetime import datetime, timedelta
import pytz


import calendar  # Import the calendar module


from datetime import datetime, timedelta
import pytz
import calendar


from datetime import datetime, timedelta
import pytz
import calendar


from datetime import datetime, timedelta
import pytz
import calendar


def load_template(request):
    try:
        data = json.loads(request.body)
        template_id = data.get("template")
        view_range = data.get("range")

        new_start_date = datetime.fromisoformat(view_range.get("start")).date()
        new_end_date = datetime.fromisoformat(view_range.get("end")).date()

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
            original_event_start = event.start.date()
            original_weekday = original_event_start.weekday()
            new_weekday = new_start_date.weekday()

            days_to_shift = (original_weekday - new_weekday) % 7
            event_start_time = event.start.time()

            if (
                days_to_shift == 0
                and original_weekday == 6
                and event_start_time < datetime.strptime("11:00:00", "%H:%M:%S").time()
            ):
                days_to_shift = 7

            elif days_to_shift == 0 and original_weekday != 6:
                if event_start_time < datetime.strptime("11:00:00", "%H:%M:%S").time():
                    days_to_shift = 1
                else:
                    days_to_shift = 7

            new_event_start_date = new_start_date + timedelta(days=days_to_shift)
            new_event_end_date = new_event_start_date + (
                event.end.date() - original_event_start
            )

            new_event_start = datetime.combine(new_event_start_date, event.start.time())
            new_event_end = datetime.combine(new_event_end_date, event.end.time())

            if new_start_date <= new_event_start_date <= new_end_date:
                events.append(
                    {
                        "id": event.id,
                        "title": event.title,
                        "start": new_event_start.astimezone(pytz.UTC),
                        "end": new_event_end.astimezone(pytz.UTC),
                        "description": event.description,
                        "projectId": event.projectId,
                    }
                )

        return JsonResponse({"data": events})

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON format"}, status=400)
    except Exception as e:
        print(f"Exception occurred: {str(e)}")
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
