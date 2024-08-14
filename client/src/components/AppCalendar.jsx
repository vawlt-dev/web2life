import React, { useState } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import "react-big-calendar/lib/css/react-big-calendar.css"
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import "./CalendarStyles.css"
import styles from "./AppCalendar.module.css"
import moment from 'moment'
import { Toolbar } from './Toolbar'


const localizer = momentLocalizer(moment)
const DragAndDropCalendar = withDragAndDrop(Calendar)



const createEvent = (id, title, start, end, allDay, resource) =>
{
    const createdEvent = 
    {
        id: id,
        title: title,
        start: start,
        end: end,
        allDay: allDay,
        resource: resource
    }
    return createdEvent;
}

export const AppCalendar = (eventsArray) => 
{
    const [events, setEvents] = useState([eventsArray]);
    const [editModalActive, setEditModalActive] = useState(false);




    const openModal = (args) =>
    {
        setEditModalActive(false)
        console.log(args)
        setTimeout(() => 
        {
            setEditModalActive(true);
            let modal = document.getElementById(styles.editModal),
                main = document.querySelector('main');

            if(args.box)
            {
                //click 
                if(args.box.x > (main.getBoundingClientRect().width) / 2 )
                {
                    args.box.x -= 400;
                }
                if(args.box.y > (main.getBoundingClientRect().height) / 2)
                {
                    args.box.y -= 350;
                }
                console.log(document.querySelector('main').getBoundingClientRect().width)
                modal.style.top = `${args.box.y}px`
                modal.style.left = `${args.box.x}px`
            }
            else if (args.bounds)
            {
                //drag
                if(args.bounds.top > (main.getBoundingClientRect().height) / 2)
                {
                    args.bounds.top -= 350;
                }
                if(args.bounds.left > (main.getBoundingClientRect().width) / 2)
                {
                    args.bounds.left -= 350;
                }
                modal.style.top = `${args.bounds.top}px`
                modal.style.left = `${args.bounds.left}px`
            }
            
        }, 250);
    } 

    const handleCancel = () =>
    {
        setEditModalActive(false)
    }
    const putEvent = () =>
    {
    
    }
    const createTempEvent = (args) =>
    {
        const createdEvent = createEvent(1, "New Event", args.start, args.end, false, null);
        setEvents(prevEvents => [...prevEvents, createdEvent])
        openModal(args)
    }
    const handleEventResize = (info) =>
    {
        let event = events.find(e => e.id === info.event.id);
        let resizedEvent = createEvent(1, event.title, info.start, info.end, false, null);
        setEvents( prevEvents =>
            {
                const updatedEvents = prevEvents.filter(e => 
                {   
                    console.log(e)
                    return e.id !== event.id
                });
                console.log(updatedEvents)
                return [...updatedEvents, resizedEvent]

            }
        )
        console.log(events)
    }
    const handleEventDrop = (info) =>
    {
        let droppedEvent = createEvent(1, "Dropped Event", info.start, info.end, false, null);
        console.log("dropped")
        setEvents(prevEvents => [...prevEvents, droppedEvent])
    }
    const editEvent = (info) =>
    {
        console.log(info)
    }
    
    return (
        <main>
            <div id={styles.editModal} className={editModalActive ? styles.active : ""}>
                <p>{events[events.length - 1].title}</p>
                
                <form>
                    <div>
                        <label>Project</label>
                        <select>
                            <option>a</option>
                            <option>b</option>
                            <option>c</option>
                        </select>
                    </div>
                    <div>
                        <label>Task</label>
                        <select>
                        </select>
                    </div>
                    <div>
                        <label>Description</label>
                        <textarea/>
                    </div>
                    
                </form>
                <div id={styles.editModalButtonWrap}>
                    <button onClick={() => handleCancel()}>Cancel</button>
                    <button onClick={() => putEvent()}>Save</button>
                </div>
            </div>
                

            <DragAndDropCalendar 
                localizer = {localizer}
                defaultView='week'
                events={events}
                onDragStart={() => "dragging"}
                onEventDrop={(info) => handleEventDrop(info)}
                draggableAccessor={() =>true}
                onSelectSlot={info => createTempEvent(info)}
                onDoubleClickEvent={(info) => editEvent(info)}
                resizableAccessor={() => true}
                onEventResize={(info) => handleEventResize(info)}
                
                resizable
                selectable

                components =
                {
                    {
                        toolbar: Toolbar
                    }
                }
            />
        </main>

    )
}
