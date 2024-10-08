from .event_source import EventSource
from .github_event_source import GithubEventSource

EVENT_SOURCES = [
	# name: Used to specify source in url e.g. connect-source/github where 'github' is the name
	{"name": "github", "interface": GithubEventSource()},
]