from .github_event_source import GithubEventSource
from .gitlab_event_source import GitLabEventSource
from .google_event_source import GoogleGMailEventSource, GoogleCalendarEventSource
from .microsft_event_source import MicrosftCalendarEventSource, MicrosftOutlookEventSource
from .slack_event_source import SlackEventSource

EVENT_SOURCES = {
	"github": GithubEventSource(),
	"gitlab": GitLabEventSource(),
	"gmail": GoogleGMailEventSource(),
	"google_calendar": GoogleCalendarEventSource(),
	"outlook": MicrosftOutlookEventSource(),
	"microsoft_calendar": MicrosftCalendarEventSource(),
	"slack": SlackEventSource(),
}