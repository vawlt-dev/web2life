from django.utils._os import safe_join
import posixpath
from pathlib import Path
from django.views.static import serve


from django.http import JsonResponse, HttpResponse
import json

from .models import Events


def serve_react(request, path, document_root=None):
    path = posixpath.normpath(path).lstrip("/")
    if Path(safe_join(document_root, path)).is_file():
        return serve(request, path, document_root)
    else:
        return serve(request, "index.html", document_root)


def get_event():
    allevents = Events.objects.all()

    return HttpResponse(json.dumps(allevents))


def set_event(request):
    event = Events(
        projectName=request.POST['projectName'],
        taskName=request.POST['taskName'],
        eventDescription=request.POST['eventDescription'],
    )
    event.save()
    return None
