from .event_source import EventSource
from . import views

class GithubEventSource(EventSource):
	def connect(self, request):
		return views.github_connect_oauth(request)
	def import_events(self, request):
		return views.get_and_translate_github_events(request)
