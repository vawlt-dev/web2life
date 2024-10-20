from django.conf import settings
from django.shortcuts import redirect
from requests_oauthlib import OAuth2Session
import requests
import dateutil

from .event_source import EventSource
from . import security
from . import prefs as user_prefs
from . import event_translation


def import_events_from_project(headers, project_id, user):
    '''
    Import all commits of the given user to the given repository
    specified by the project ID.
    '''
    project_info = requests.get(
        f"https://gitlab.com/api/v4/projects/{project_id}",
        headers=headers,
        timeout=10,
    ).json()

    repo_name = project_info['path_with_namespace']

    push_events = requests.get(
        f"https://gitlab.com/api/v4/projects/{project_id}/repository/commits?author={user}",
        headers=headers,
        timeout=10,
    ).json()

    events = []
    for event in push_events:
        push_data = event.get("push_data", {})

        events.append(
            {
                "repo": repo_name,
                "time": dateutil.parser.isoparse(event.get("created_at")),
                "message": push_data.get("message"),
            }
        )

    return events

class GitLabEventSource(EventSource):
    '''
    Implementation of EventSource for GitLab. Very similar to GitHubEventSource.
    '''
    def connect(self, request):
        state = security.generate_state()
        verifier = security.generate_code_verifier()
        challenge = security.generate_code_challenge(verifier)

        request.session["gitlab_verifier"] = verifier
        gitlab = OAuth2Session(
            client_id=settings.GITLAB_CLIENT_ID,
            redirect_uri=settings.GITLAB_CALLBACK,
            scope=["read_user", "api"],
            state=state,
        )
        authorization_url, _ = gitlab.authorization_url(
            "https://gitlab.com/oauth/authorize",
            code_challenge=challenge,
            code_challenge_method="S256",
        )

        return redirect(authorization_url)

    def import_events(self, request):
        access_token = request.session["gitlab_token"]["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}

        prefs, _ = user_prefs.load()

        if 'error' in prefs or 'gitlabrepos' not in prefs or len(prefs['gitlabrepos']) == 0:
            print("Error importing GitLab events: GitLab repositories not configured in settings")
            return []

        user = prefs['gitlabusername']

        events = []

        for project in prefs['gitlabrepos']:
            try:
                events.extend(import_events_from_project(headers, project, user))
            except Exception as e:
                print(f"Error importing GitLab events: {e}")
        translated = event_translation.translate_git_events(events)
        return translated
