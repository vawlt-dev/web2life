import json
from django.conf import settings

def load():
    try:
        with open(settings.PREFS_PATH, "r") as file:
            return json.load(file), None
    except json.JSONDecodeError as e:
        return {"error": "Failed to decode preferences"}, e
    except Exception as e:
        return {"error": f"{e}"}, e


def save(data):
    try:
        with open(settings.PREFS_PATH, "w") as file:
            json.dump(data, file)
            print(f"Saved preferences to {settings.PREFS_PATH}")
    except Exception as e:
        print(f"Failed to save preferences: {e}")