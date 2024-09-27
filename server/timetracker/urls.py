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
    path("patchEvent/", views.patch_event),
    path("clearEvents/", views.clear_events),
    path("deleteEvent/", views.delete_event),
    path("getCsrfToken/", views.get_csrf_token, name="get_csrf"),
    path("getProjects/", views.get_projects),
    path("addProject/", views.add_project),
    path("deleteProject/", views.delete_project),
    path("manifest.json/", views.serve_manifest),
    path("filter-events/", views.filter_events),
    path("set_user/", views.set_user),
    path("get_users/", views.get_users),
    path("get_user_by_id/", views.get_user_by_id),
    # OAuth Paths
    ##########################################
    # Google OAuth paths
    path("oauth/connect/google/", views.google_connect_oauth),
    path("oauth/callback/google", views.google_callback),
    path("oauth/getGmailMessages/", views.get_gmail_messages),
    path("oauth/getGoogleCalendarEvents/", views.get_google_calendar_events),
    # Github OAuth paths
    path("oauth/connect/github", views.github_connect_oauth),
    path("oauth/callback/github", views.github_callback),
    # Slack OAuth paths
    path("oauth/connect/slack", views.slack_connect_oauth),
    path("oauth/callback/slack", views.slack_callback),
    path("oauth/getSlackEvents/", views.get_slack_events),
    # Gitlab OAuth paths
    path("oauth/connect/gitlab", views.gitlab_connect_oauth),
    path("oauth/callback/gitlab", views.gitlab_callback),
    # Microsoft OAuth paths
    path("oauth/connect/microsoft", views.microsoft_connect_oauth),
    path("oauth/callback/microsoft", views.microsoft_callback),
    path("oauth/getOutlookMessages", views.get_outlook_messages),
    path("oauth/getMicrosoftCalendarEvents", views.get_microsoft_calendar_events),
    ########################################
    re_path(r"^favicon\.ico$", favicon_view),
    re_path(r"^static/(?P<path>.*)$", views.serve_static),
    path("", views.index),
]
