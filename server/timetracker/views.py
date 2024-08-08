from django.utils._os import safe_join
import posixpath
from pathlib import Path
from django.views.static import serve
from django import views

from django.http import JsonResponse, HttpResponse
import json
import django.middleware.csrf
from django.conf import settings
from .models import Events

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

def set_event(request):
    print("in set_event")
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

def update_event_times(request):

    print(request)
    try:
        data = json.loads(request.body)
        print(data)
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
    except Exception as e:
        print(e)
    pass


def clear_events(request):
    Events.objects.all().delete()


def get_csrf_token(request):
    return JsonResponse({"csrf-token": django.middleware.csrf.get_token(request)})
