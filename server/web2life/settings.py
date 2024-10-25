"""
Django settings for web2life project.

Generated by 'django-admin startproject' using Django 5.0.7.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/5.0/ref/settings/
"""

import dotenv
import os
from pathlib import Path
import mimetypes
from django.utils._os import safe_join

dotenv.load_dotenv()

REQUEST_TIMEOUT_S = 10

BASE_DIR = Path(__file__).resolve().parent.parent.parent
# Google OAuth2.0 configs
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_SECRET = os.getenv("GOOGLE_SECRET")
GOOGLE_CALLBACK = os.getenv("GOOGLE_CALLBACK_URI")

#
MICROSOFT_CLIENT_ID = os.getenv("MICROSOFT_CLIENT_ID")
MICROSOFT_SECRET = os.getenv("MICROSOFT_SECRET")
MICROSOFT_CALLBACK = os.getenv("MICROSOFT_CALLBACK_URI")

# Github OAuth2.0 configs
GITHUB_SECRET = os.getenv("GITHUB_SECRET")
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CALLBACK = os.getenv("GITHUB_CALLBACK_URI")

# Slack OAuth2.0 configs
SLACK_CLIENT_ID = os.getenv("SLACK_CLIENT_ID")
SLACK_SECRET = os.getenv("SLACK_SECRET")
SLACK_CALLBACK = os.getenv("SLACK_CALLBACK_URI")

# Gitlab OAuth2.0 configs
GITLAB_CLIENT_ID = os.getenv("GITLAB_CLIENT_ID")
GITLAB_SECRET = os.getenv("GITLAB_SECRET")
GITLAB_CALLBACK = os.getenv("GITLAB_CALLBACK_URI")

# AI config
OPENAI_SECRET = os.getenv("OPENAI_SECRET")
# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = "django-insecure-3n0vpnp8gxqz=gg3l(_mv6cd&rt^0olyzbk*cte$9szi(^y96*"

# Don't change this, otherwise github oauth fails
os.environ["OAUTHLIB_RELAX_TOKEN_SCOPE"] = "1"

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True
ALLOWED_HOSTS = ["*"]

# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django_extensions",
    "timetracker",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "web2life.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "web2life.wsgi.application"


# Database
# https://docs.djangoproject.com/en/5.0/ref/settings/#databases

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}


# Password validation
# https://docs.djangoproject.com/en/5.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.0/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.0/howto/static-files/

STATIC_URL = "/static/"
# disable this is if running locally
# FRONTEND_BUILD_PATH = os.path.join(BASE_DIR, "server", "frontend")
# STATICFILES_DIRS = [
#     os.path.join(FRONTEND_BUILD_PATH, "static"),
# ]

# Disable this if using docker
FRONTEND_BUILD_PATH = os.path.join(BASE_DIR, "client", "build")
STATIC_URL = "/static/"
FRONTEND_BUILD_PATH = "../client/build"
STATIC_SOURCE = safe_join(FRONTEND_BUILD_PATH, "static")
STATICFILES_DIRS = [STATIC_SOURCE]

PREFS_PATH = f"{FRONTEND_BUILD_PATH}/prefs.json"

# Default primary key field type
# https://docs.djangoproject.com/en/5.0/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

mimetypes.add_type("application/javascript", ".js", True)
