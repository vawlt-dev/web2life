from .github_event_source import GithubEventSource
from .gitlab_event_source import GitLabEventSource
from .google_event_source import GoogleGMailEventSource, GoogleCalendarEventSource

EVENT_SOURCES = {
	"github": GithubEventSource(),
	"gitlab": GitLabEventSource(),
	"gmail": GoogleGMailEventSource(),
	"google_calendar": GoogleCalendarEventSource(),
}