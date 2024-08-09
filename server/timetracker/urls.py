"""
URL configuration for web2life project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, re_path
from . import views
from django.conf import settings
from django.views.generic.base import RedirectView

favicon_view = RedirectView.as_view(url="/static/favicon.ico")

urlpatterns = [
    path("getEvents/", views.get_events),
    path("setEvent/", views.set_event),
    path("updateEventTimes/", views.update_event_times),
    path("clearEvents/", views.clear_events),
    path("deleteEvent/", views.delete_event),
    path("deleteEventTime/", views.delete_event_time),
    path("getCsrfToken/", views.get_csrf_token, name="get_csrf"),
    path("manifest.json/", views.serve_manifest),
    re_path(r"^favicon\.ico$", favicon_view),
    re_path(r"^static/(?P<path>.*)$", views.serve_static),
    path("", views.index),
]
