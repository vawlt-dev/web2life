from .github_event_source import GithubEventSource
from .gitlab_event_source import GitLabEventSource

EVENT_SOURCES = {
	"github": GithubEventSource(),
	"gitlab": GitLabEventSource(),
}