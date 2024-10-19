from django.http import HttpResponse

class EventSource():
    '''Interface for event sources to implement.
    Add an instance of the implemented interface
    to EVENT_SOURCES in the event_source_list module to
    add that event as a source recognised by the backend.'''

    class NotAuthorisedError(Exception):
        '''The import_events function can raise this
        when authorisation has not occured'''
        def __init__(self, message):
            super().__init__(message)

    def connect(self, request): # pylint: disable=unused-argument
        '''Establish connection/authorisation to the source.'''
        return HttpResponse()
    def import_events(self, request): #pylint: disable=unused-argument
        '''Import events from the source.
        Should return a list of Events objects'''
        return []
