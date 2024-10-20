from django.conf import settings
from django.shortcuts import redirect

from requests_oauthlib import OAuth2Session
import dateutil

from .event_source import EventSource
from . import prefs as user_prefs
from . import event_translation

def get_user_events_for_repo(session, user, repo):
    '''Get all commits of a user to a given repository (e.g. my/repo)'''
    try:
        response = session.get(
            f"https://api.github.com/repos/{repo}/commits?author={user}"
        ).json()
        events = []
        for event in response:
            commit = event["commit"]
            events.append(
                {
                    "type": "push",
                    "time": dateutil.parser.isoparse(commit["author"]["date"]),
                    "repo": repo,
                    "message": commit["message"],
                }
            )
        return events
    except Exception as e:
        print(f"Failed to get GitHub events: {e}")
        return []

class GithubEventSource(EventSource):
    '''
    Implementation of EventSource for GitHub.
    Takes commits of user to repositories specified in preferences.
    '''
    def connect(self, request): #pylint: disable=unused-argument
        github_session = OAuth2Session(
            client_id=settings.GITHUB_CLIENT_ID,
            redirect_uri=settings.GITHUB_CALLBACK,
            scope="repo,read:user",
        )
        auth_url, _ = github_session.authorization_url(
            "https://github.com/login/oauth/authorize"
        )
        return redirect(auth_url)

    def import_events(self, request):
        prefs, _ = user_prefs.load()

        if 'error' in prefs or 'githubrepos' not in prefs or len(prefs['githubrepos']) == 0:
            print("Error importing GitHub events: GitHub repositories not configured in settings")
            return []

        token = request.session.get("github_oauth_token")
        if not token:
            print("No GitHub session token")
            return []

        github_session = OAuth2Session(client_id=settings.GITHUB_CLIENT_ID, token=token)
        events = []
        user = prefs["githubusername"]
        for repo in prefs["githubrepos"]:
            events.extend(get_user_events_for_repo(github_session, user, repo))

        # Translate events
        translated = event_translation.translate_git_events(events)
        return translated
