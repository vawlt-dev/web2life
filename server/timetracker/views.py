from django.utils._os import safe_join
import posixpath
from pathlib import Path
from django.views.static import serve

from django.http import JsonResponse, HttpResponse
import json
import django.middleware.csrf
from .models import Events


def serve_react(request, path, document_root=None):
    path = posixpath.normpath(path).lstrip("/")
    print(path)
    if path == "getCsrfToken":
        return get_csrf_token(request)
    if path == "getEvent":
        return get_event()
    if path == "setEvent":
        set_event(request)
    if path == "updateEvent":
        update_event(request)
    if path == "removeEvent":
        # TODO
        pass
    if path == "clearEvents":
        clear_events()
    if Path(safe_join(document_root, path)).is_file():
        return serve(request, path, document_root)
    else:
        return serve(request, "index.html", document_root)


def get_event():
    return JsonResponse({"data": list(Events.objects.all().values())})


def set_event(request):
    print("in set_event")
    print(request.body)
    try:
        data = json.loads(request.body)
        event = Events(
            task=data["task"],
            start=data["start"],
            end=data["end"],
            project=data["project"],
            description=data["description"],
        )
        event.save()
    except Exception as e:
        print(e)


def update_event(request):
    try:
        data = json.loads(request.body)

        event = Events.objects.get(id=data["id"])
        event.start = data["newTime"]
        event.save()
    except Exception as e:
        print(e)
    pass


def clear_events():
    Events.objects.all().delete()


def get_csrf_token(request):

    return JsonResponse({"csrf-token": django.middleware.csrf.get_token(request)})
