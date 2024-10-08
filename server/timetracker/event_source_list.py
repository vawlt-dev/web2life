from .event_source import EventSource
from .github_event_source import GithubEventSource

EVENT_SOURCES = {
	"github": GithubEventSource(),
}