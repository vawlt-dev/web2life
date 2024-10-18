import os
import json
from django.conf import settings

def load():
    '''
    Load preferences from path in settings.
    Returns a dictionary of the preferences and an exception if any occured.
    '''
    if not os.path.exists(settings.PREFS_PATH):
        return {"error": "File not found"}, FileNotFoundError()

    try:
        with open(settings.PREFS_PATH, "r") as file:
            return json.load(file), None
    except json.JSONDecodeError as e:
        return {"error": "Failed to decode preferences"}, e
    except Exception as e:
        return {"error": f"{e}"}, e

def save(data):
    '''
    Save preference dictionary 'data' to the path
    specified in settings.
    '''
    try:
        with open(settings.PREFS_PATH, "w") as file:
            json.dump(data, file)
            print(f"Saved preferences to {settings.PREFS_PATH}")
    except Exception as e:
        print(f"Failed to save preferences: {e}")
