from .models import Events
import datetime
from django.forms.models import model_to_dict

def get_all_event_ids():
    events = list(Events.objects.all())
    out = []
    for e in events: out.append(e.id)
    return out

# Needs min and max parameters in url in format Y-M-D
# To get all events on a certain date just use that date
# as both the min and max arguments
def filter_events_by_date(request):
    out = []
    today = datetime.datetime.now()
    min_arg = request.GET.get("date_min", "?")
    max_arg = request.GET.get("date_max", "?")
    
    if min_arg == "?" and max_arg == "?": return get_all_event_ids()

    min_ts = (
        datetime.datetime.strptime(min_arg, "%Y-%m-%d").date()
        if (min_arg != "?")
        else today
    )
    max_ts = (
        datetime.datetime.strptime(max_arg, "%Y-%m-%d").date()
        if (max_arg != "?")
        else today
    )

    try:
        events = Events.objects.filter(start__gte=min_ts, end__lte=max_ts).all()
        for e in events:
            out.append(e.id)
    except Exception as e:
        print(f"filter_events_by_date: {e}")
    return out

# Takes project_id=<int> argument
def filter_events_by_project(request):
    out = []
    arg = request.GET.get("project_id", "?")
    if arg == "?": return get_all_event_ids()
    proj_id = int(arg)
    try:
        events = Events.objects.filter(project_id=proj_id)
        for e in events: out.append(e.id)
    except Exception as e:
        print(f"filter_events_by_project: {e}")
    return out

# Filter supplied events array using parameters from request and return the filtered array
def filter_events(request):
    by_date = filter_events_by_date(request)
    by_project = filter_events_by_project(request)
    intersection = list(set(by_date) & set(by_project))
    print(intersection)
    events = []
    for i in intersection:
        e = Events.objects.get(id=i)
        events.append(model_to_dict(e))
    return events
    
