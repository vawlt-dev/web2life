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
        print("getting events")
        return get_event()
    if path == "setEvent":
        set_event(request)
    if Path(safe_join(document_root, path)).is_file():
        return serve(request, path, document_root)
    else:
        return serve(request, "index.html", document_root)


def get_event():
    print("In get_event")
    print(allevents)
    allevents = Events.objects.all()
    print(allevents)
    return JsonResponse({"data": json.dumps(allevents)})


def set_event(request):
    print("in set_event")
    print(request.POST)
    event = Events(
        projectName=request.POST["project"],
        taskName=request.POST["task"],
        eventDescription=request.POST["description"],
    )
    event.save()
    return None


def get_csrf_token(request):

    return JsonResponse({"token": django.middleware.csrf.get_token(request)})
