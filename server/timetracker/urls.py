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

from django.urls import path, re_path

# from django.conf import settings
from django.views.generic.base import RedirectView
from . import views
from . import views_auth

urlpatterns = [
    path("getEvents/", views.get_events),
    path("setEvent/", views.set_event),
    path("patchEvent/", views.patch_event),
    path("clearEvents/", views.clear_events),
    path("deleteEvent/", views.delete_event),
    path("getCsrfToken/", views.get_csrf_token),
    path("getProjects/", views.get_projects),
    path("addProject/", views.add_project),
    path("deleteProject/", views.delete_project),
    path("manifest.json/", views.serve_manifest),
    path("filter-events/", views.filter_events),
    # path("set_user/", views.set_user),
    # path("get_users/", views.get_users),
    # path("get_user_by_id/", views.get_user_by_id),
    path("getPreferences/", views.get_preferences),
    path("setPreferences/", views.set_preferences),
    path("setTemplate/", views.create_template),
    path("getTemplates/", views.get_templates),
    path("loadTemplate/", views.load_template),
    path("deleteTemplate/", views.delete_template),
    # OAuth Paths
    ##########################################
    path("oauth/callback/google", views_auth.google_callback),
    path("oauth/callback/microsoft", views_auth.microsoft_callback),
    # Github OAuth paths
    # path("oauth/connect/github", views.github_connect_oauth),
    path("oauth/callback/github", views_auth.github_callback),
    # path("oauth/getGithubEvents", views.get_github_events),
    # Gitlab OAuth paths
    # path("oauth/connect/gitlab", views.gitlab_connect_oauth),
    path("oauth/callback/gitlab", views_auth.gitlab_callback),
    # path("oauth/getGitlabEvents", views.get_gitlab_events),
    # Slack OAuth paths
    path("oauth/callback/slack", views_auth.slack_callback),
    path("oauth/callback/slack_scopes", views_auth.slack_scope_callback),
    # AI Prediction
    re_path("ai/getPrediction/", views.get_ai_prediction),
    # Custom event sources
    re_path(r"^connect-source/(?P<name>.*)$", views.connect_source),
    re_path(r"^import-events/(?P<name>.*)$", views_auth.import_events),
    ########################################
    re_path(r"^favicon\.ico$", views.serve_ico),
    re_path(r"^static/(?P<path>.*)$", views.serve_static),
    path("", views.index),
]
