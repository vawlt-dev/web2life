from django.test import TestCase
from . import models
from . import event_translation
import datetime

class EventTranslationTest(TestCase):
	def setUp(self):
		pass

	# @NOTE(Jamie D): This test will break if the title format from translate_github_events is changed
	def test_github_event_translation(self):
		repo_name = "my/repo"
		now = datetime.datetime.now().timestamp()
		data = [
			{
				"repo": repo_name,
				"time": datetime.datetime.fromtimestamp(now).isoformat(),
				"message": "Add some stuff to the thing"
			},
			{
				"repo": repo_name,
				"time": datetime.datetime.fromtimestamp(now).isoformat(),
				"message": "Add some stuff to the thing again"
			},
			# Commit without message
			{
				"repo": repo_name,
				"time": datetime.datetime.fromtimestamp(now).isoformat(),
			},

			# In the next hour
			{
				"repo": repo_name,
				"time": datetime.datetime.fromtimestamp(now+3600).isoformat(),
				"message": "Add some stuff to the thing"
			},
			{
				"repo": repo_name,
				"time": datetime.datetime.fromtimestamp(now+3600).isoformat(),
				"message": "Add some stuff to the thing again"
			},
		]
		events = event_translation.translate_github_events(data)

		self.assertEqual(events[0].title, "Pushed 3 commits to my/repo")
		self.assertEqual(events[1].title, "Pushed 2 commits to my/repo")