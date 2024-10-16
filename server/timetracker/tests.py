import datetime
from django.test import TestCase, Client
from . import event_translation

class EventTranslationTest(TestCase):
    def setUp(self):
        self.client = Client()
        pass

    # @NOTE(Jamie D): This test will break if the title format
    # from translate_github_events is changed
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

    def test_email_grouping(self):
        now = datetime.datetime.now().timestamp()

        data = [
            {
                "subject": "a",
                "date": datetime.datetime.fromtimestamp(now).isoformat(),
                "recipient": "john.smith@email.com",
            },
            {
                "subject": "b",
                "date": datetime.datetime.fromtimestamp(now+3600).isoformat(),
                "recipient": "person@email.com",
            },
            {
                "subject": "c",
                "date": datetime.datetime.fromtimestamp(now+3600).isoformat(),
                "recipient": "jane.doe@email.com",
            },
            {
                "subject": "d",
                "date": datetime.datetime.fromtimestamp(now+7200).isoformat(),
                "recipient": "jane.doe@email.com",
            },
        ]

        result = event_translation.group_email_events(data)
        self.assertEqual(len(result), 3)
        self.assertEqual(len(result[0]), 1)
        self.assertEqual(len(result[1]), 2)
        self.assertEqual(len(result[2]), 1)
    
    def test_endpoints(self):
        def assert_response(r, valid_codes):
            if r.status_code != 200 and r.status_code not in valid_codes:
                raise AssertionError(f"Invalid response status code {r.status_code}")

        def test_endpoint(uri, valid_codes=[]):
            response = self.client.get(uri)
            assert_response(response, valid_codes)

        test_endpoint("/")
        test_endpoint("/getEvents/")
        test_endpoint("/getProjects/")
        test_endpoint("/getTemplates/")
        test_endpoint("/favicon.ico", [301])
        test_endpoint("/manifest.json", [301])
        test_endpoint("/getPreferences/")
