from django.utils._os import safe_join
import posixpath
from pathlib import Path
from django.views.static import serve

from django.http import JsonResponse, HttpResponse
import json
from .models import Events
import os


def serve_react(path):
    print("test")


def get_event():
    allevents = Events.objects.all()

    return HttpResponse(json.dumps(allevents))


def set_event(request):
    event = Events(
        projectName=request.POST["projectName"],
        taskName=request.POST["taskName"],
        eventDescription=request.POST["eventDescription"],
    )
    event.save()
    return None


def get_csrf_token(request):

    print(request)
    print("getting csrf token")
    return JsonResponse({token: get_csrf_token(request)})
