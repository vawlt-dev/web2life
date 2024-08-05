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

urlpatterns = [
    path("getEvent/", views.get_event),
    path("setEvent/", views.set_event),
    path("clearEvents/", views.clear_events),
    path("getCsrfToken/", views.get_csrf_token, name="get_csrf-"),
    re_path(
        r"^(?P<path>.*)$",
        views.serve_react,
        {"document_root": settings.FRONTEND_BUILD_PATH},
    ),
]
