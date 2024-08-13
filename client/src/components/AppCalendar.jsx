import React, { useState } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import "react-big-calendar/lib/css/react-big-calendar.css"
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import "./AppCalendar.css"
import moment from 'moment'
import { Toolbar } from './Toolbar'


const localizer = momentLocalizer(moment)
const DragAndDropCalendar = withDragAndDrop(Calendar)


export const AppCalendar = (eventsArray) => 
{
    const [events, setEvents] = useState([eventsArray]);

    const createEvent = (args) =>
    {
        const createdEvent = 
        {
            title: "New Event",
            start: args.start,
            end: args.end,
            allDay: false,
            resource: null,
        }
        setEvents(prevEvents => [...prevEvents, createdEvent])
        
    }
    return (
        <DragAndDropCalendar 
            localizer = {localizer}
            defaultView='week'
            events={events}
            onDragStart={() => "dragging"}
            draggableAccessor={() =>true}
            onSelectSlot={info => createEvent(info)}

            resizableAccessor={() => true}
            onEventResize={() => console.log("resizing")}

            resizable
            selectable
            components =
            {
                {
                    toolbar: Toolbar
                }
            }
            
            
        />

    )
}
