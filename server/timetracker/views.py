import datetime

from django.utils import timezone
from django.utils._os import safe_join
import posixpath
from pathlib import Path
from django.views.static import serve
from django import views
import os
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_POST
import json
import django.middleware.csrf
from django.conf import settings
from .models import Events
from .models import Project


def index(request):
    print("Serve index")
    print(safe_join(settings.FRONTEND_BUILD_PATH, "index.html"))
    return serve(request, "index.html", settings.FRONTEND_BUILD_PATH)


def serve_static(request, path):
    full_path = Path(safe_join(settings.STATIC_SOURCE, path))
    print(f"serve_static(): {full_path}")
    if full_path.is_file():
        return serve(request, path, settings.STATIC_SOURCE)
    else:
        return views.default.page_not_found(request, FileNotFoundError())


def get_events(request):
    return JsonResponse({"data": list(Events.objects.all().values())})


@require_POST
def set_event(request):
    try:
        data = json.loads(request.body)
        event = Events(
            title=data["title"],
            project=data["project"],
            task=data["task"],
            description=data["description"],
            start=data["start"],
            end=data["end"],
            allDay=data["allDay"],
        )
        event.save()
    except Exception as e:
        print(e)
    finally:
        return HttpResponse()


def get_event_by_id(request):
    print(request)
    try:
        data = json.loads(request.body)
        event = Events.objects.get(id=data["id"])
    except Exception as e:
        print(e)
        return HttpResponse()
    finally:
        return JsonResponse({"data": event.task})

def get_projects(request):
    projects = list(Project.objects.all().values())
    print(f"get_projects: {request}")
    return JsonResponse({"data": projects})

def add_project(request):
    print(f"add_project: {request}")
    try:
        data = json.loads(request.body)
        project = Project(title = data['title'], description = data['description'])
        project.save()
        return HttpResponse()
    except:
        return HttpResponse()

def delete_project(request):
    print(f"delete_project: {request}")
    try:
        data = json.loads(request.body)
        print(f"Delete project: {data['title']}")
        project = Project.objects.get(title = data['title'])
        project.delete()
        return HttpResponse()
    except:
        return HttpResponse()

# FIXME: Naive timezone warnings?
# Needs min and max parameters in url in format Y-M-D
# To get all events on a certain date just use that date
# as both the min and max arguments
def get_events_by_date(request):
    print(request)
    today = datetime.datetime.now()
    min_arg = request.GET.get("min", "?")
    max_arg = request.GET.get("max", "?")
    min_ts = datetime.datetime.strptime(request.GET.get("min", "?"), "%Y-%m-%d").date() if (min_arg != '?') else today
    max_ts = datetime.datetime.strptime(request.GET.get("max", "?"), "%Y-%m-%d").date() if (max_arg != '?') else today

    try:
        events = Events.objects.filter(start__gte=min_ts, end__lte=max_ts).all()
        event_ids = []
        for e in events:
            event_ids.append(e.id)
        # Don't know in what format the front-end wants the events
        return JsonResponse({"data": event_ids})
    except Exception as e:
        print(e)
        return HttpResponse()


def update_event_times(request):
    try:
        data = json.loads(request.body)
        event = Events.objects.get(id=data["originalEvent"]["id"])
        newEvent = data["newEvent"]

        newStart = newEvent.get("start")
        newEnd = newEvent.get("end")
        newAllDay = newEvent.get("allDay")

        event.start = newStart
        event.end = newEnd
        event.allDay = newAllDay

        event.save()
    except Exception as e:
        print(e)
    finally:
        return HttpResponse()


def delete_event_time(request):
    try:
        data = json.loads(request.body)
        event = Events.objects.get(id=data["id"])

        event.times = [
            # no idea how this works but it does
            # can't directly delete the time, so have to
            # re-create the times array with the time to delete
            # filtered out
            time
            for time in event.times
            if not (
                time.get("start") == data["start"]
                and time.get("end") == data["end"]
                and time.get("allDay") == data["allDay"]
            )
        ]
        event.save()
    except Exception as e:
        print(e)
    finally:
        return HttpResponse()


def delete_event(request):
    try:
        data = json.loads(request.body)
        event = Events.objects.get(id=data["id"])
        event.delete()
        print(event)
    except Exception as e:
        print(e)
    finally:
        return HttpResponse()


def clear_events(request):
    print("In clear_events")
    Events.objects.all().delete()
    return HttpResponse()


def get_csrf_token(request):
    return JsonResponse({"csrf-token": django.middleware.csrf.get_token(request)})


def serve_manifest(request):
    #with open((settings.FRONTEND_BUILD_PATH + "/manifest.json"), "r") as file:
    #    data = file.read()
    #return HttpResponse(data);
    return serve(request, "manifest.json", settings.FRONTEND_BUILD_PATH)


def serve_ico(request):
    #with open((settings.FRONTEND_BUILD_PATH + "/favicon.ico"), "rb") as file:
    #    data = file.read()
    #return HttpResponse(data)
    return serve(request, "favicon.ico", settings.FRONTEND_BUILD_PATH)


def set_user(request):
    return None


def get_user_by_id(request):
    return None


def get_users(request):
    return None
