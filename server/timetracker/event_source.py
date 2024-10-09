from django.http import HttpResponse

class EventSource():
	def connect(self, request):
		return HttpResponse()
	def import_events(self, request):
		return []
