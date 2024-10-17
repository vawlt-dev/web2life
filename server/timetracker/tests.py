import datetime
import json
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

        # Make sure this doesn't raise an exception
        event_translation.translate_email_events(data)
    
    def test_endpoints(self):
        now = datetime.datetime.now()

        def assert_response(r, valid_codes):
            if r.status_code not in valid_codes:
                print(r.content)
                raise AssertionError(f"Invalid response status code {r.status_code}")

        def test_endpoint(uri, valid_codes=[200]):
            response = self.client.get(uri)
            assert_response(response, valid_codes)

        def test_endpoint_https(uri, valid_codes=[200]):
            response = self.client.get(uri, **{'wsgi.url_scheme': 'https'})
            assert_response(response, valid_codes)

        def test_post(uri, data, valid_codes=[200]):
            response = self.client.post(uri, json.dumps(data), content_type="application/json")
            assert_response(response, valid_codes)

        test_endpoint("/")
        test_endpoint("/getEvents/")
        test_endpoint("/getProjects/")
        test_endpoint("/getTemplates/")
        test_endpoint("/favicon.ico", [200, 301])
        test_endpoint("/manifest.json", [200, 301])
        test_endpoint("/getPreferences/")
        # Set preferences should return a 400 error because no JSON data is provided
        test_endpoint("/setPreferences/", [400])
        test_endpoint("/getCsrfToken/")
        test_endpoint("/static/this_file_doesnt_exist.js", [404])
        test_endpoint_https("/oauth/connect/google/", [200, 302])
        test_endpoint_https("/oauth/connect/microsoft", [200, 302])
        test_endpoint_https("/oauth/connect/slack", [200, 302])
        test_endpoint_https("/connect-source/github", [200, 302])
        test_endpoint_https("/connect-source/gitlab", [200, 302])
        test_post("/setPreferences/", {"githubusername": "joe"})
        response = self.client.post("/setPreferences/", json.dumps({"githubusername": "joe"}),
                                    content_type="text/html")
        assert_response(response, [400])

        test_endpoint("/clearEvents/")

        dummy_event = {
            "title": "My Event",
            "description": "Some things",
            "start": now.isoformat(),
            "end": (now + datetime.timedelta(hours=2)).isoformat(),
            "allDay": "off",
            "project": "My Project",
        }

        test_post("/setEvent/", dummy_event)



        test_post("/setEvent/", dummy_event)

        test_post("/addProject/", {
            "project": "Project added by /addProject/"
        })

        test_post("/patchEvent/", {
            "originalEvent": {
                "id": 0
            },
            "newEvent": {
                "title": "My Event (With Changes)",
                "description": "Some things that changed",
                "start": now.isoformat(),
                "end": (now + datetime.timedelta(hours=2)).isoformat(),
                "allDay": "off",
                "project": "My Project",
            },
        })
        
        test_post("/deleteEvent/", {
            "id": 0,
        })

        test_post("/deleteProject/", {
            "project": 0,
        })
