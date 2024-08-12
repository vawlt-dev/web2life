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
from .models import Events, Projects


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
    print("in set_event")
    print(request)
    print(request.body)
    try:
        data = json.loads(request.body)
        event = Events(
            task=data["task"],
            times=data["times"],
            project=data["project"],
            description=data["description"],
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


def get_project_by_id(request):
    print(request)
    try:
        data = json.loads(request.body)
        project = Projects.objects.get(id=data["project"])
    except Exception as e:
        print(e)
        return HttpResponse()
    finally:
        return JsonResponse({"data": project})


def get_projects_by_name(request):
    print(request)
    try:
        data = json.loads(request.body)
        projects = Projects.objects.filter(name__icontains=data["name"])
    except Exception as e:
        print(e)
        return HttpResponse()
    finally:
        return JsonResponse({"data": projects})


def get_events_by_date(request): ####### IMPORTANT ######
    print(request)               ####### Events.objects.all().filter(times__0__start__icontains="08-11")
    print(Events.objects.all().filter(times__0__start__icontains="08-11"))
    # print(Events.objects.get(id=67).times[0]["start"])
    some = []
    try:
        # data = json.loads(request.body)
        # events = Events.objects.all().filter(times__gt=datetime.date(2024, 12, 8))
        # some = [time for time in events.times.all() if time.get("start") is data["start"]]
        print("")
    except Exception as e:
        print(e)
        return HttpResponse()
    finally:
        return JsonResponse({"data": some})


def update_event_times(request):
    print(request)
    try:
        data = json.loads(request.body)
        event = Events.objects.get(id=data["id"])
        tData = data.get("time")

        oStart = tData.get("oldStart")
        nStart = tData.get("newStart")
        oEnd = tData.get("oldEnd")
        nEnd = tData.get("newEnd")
        oAllDay = tData.get("oldAllDay")
        nAllDay = tData.get("newAllDay")

        if oStart or oEnd or oAllDay:
            for time in event.times:
                print(time)
                if (
                        time.get("start") == oStart
                        and time.get("end") == oEnd
                        and time.get("allDay") == oAllDay
                ):
                    time["start"] = nStart
                    time["end"] = nEnd
                    time["allDay"] = nAllDay
                    break
                    # breaking because we only want to update one entry
        else:
            if not data["time"] in event.times:
                event.times.append(data["time"])

        event.save()
        print(event.times)
        print(event.id)
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
    with open((settings.FRONTEND_BUILD_PATH + "/manifest.json"), "r") as file:
        data = file.read()
    return HttpResponse(data)


def serve_ico(request):
    with open((settings.FRONTEND_BUILD_PATH + "/favicon.ico"), "rb") as file:
        data = file.read()
    return HttpResponse(data)


def set_user(request):
    return None


def get_user_by_id(request):
    return None


def get_users(request):
    return None
