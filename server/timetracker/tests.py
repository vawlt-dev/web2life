from django.test import TestCase
from . import models
from . import event_translation

class EventTranslationTest(TestCase):
	def setUp(self):
		pass

	def test_github_event_translation(self):
		repo_name = "my/repo"
		data = [
			{
				"repo": repo_name,
			}
		]
		event_translation.translate_github_events(data)