import React, { useEffect, useRef, useState } from 'react'
import { Calendar, Views, momentLocalizer } from 'react-big-calendar'
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

const customColumnWrapper = () =>
{
    return(
        <div className="height600"> 
            <div></div>
            <div></div>
        </div>
    )
}

export const AppCalendar = ({eventsArray, getEvent, putEvent, patchEvent, deleteEvent}) => 
{    
    const [tempEvent, setTempEvent] = useState(null);
    const [projectNames, setProjectNames] = useState(null);
    const [taskNames, setTaskNames] = useState(null);

    const [events, setEvents] = useState(eventsArray);
    const [editModalActive, setEditModalActive] = useState(false);
    const calRef = useRef(null);
    const modalInputRef = useRef(null);
    const [view, setView] = useState(Views.MONTH)
    
    useEffect(() =>
    {
        setEvents(eventsArray);

        const projects = new Set(), 
              tasks = new Set();

        eventsArray.forEach((event) =>
        {
            if(event.project) projects.add(event.project)
            if(event.task) tasks.add(event.task)
        })
        
        setProjectNames(Array.from(projects))
        setTaskNames(Array.from(tasks));
        console.log(eventsArray)
    },[eventsArray])
   
    useEffect(() =>
    {
        if(view === Views.DAY)
        {
            console.log("its day")
        }
    }, [view])

    const openModal = (args) =>
    {
        setEditModalActive(false)
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
        events.pop();
        console.log(events)
    }

    const createTempEvent = (args) =>
    {
        if(editModalActive)
        {
            console.log("Event popped")
            events.pop();
        } 
        const event = createEvent(null, "New Event", args.start, args.end, false, null);
        setTempEvent(event);
        
        //set as event instead of tempEvent cos useState is asynchronous
        setEvents(prevEvents => [...prevEvents, event])

        openModal(args)
    }

    const editEvent = (info) =>
    {
        console.log(info)
    }
    const handleSubmit = (e) =>
    {
        e.preventDefault();
        const formData = new FormData(modalInputRef.current);
        
        const data = 
        {
            title: formData.get("title"),
            project: formData.get("project"),
            task: formData.get("task"),
            description: formData.get("description"),
            start: tempEvent.start,
            end: tempEvent.end,
            allDay: tempEvent.allDay
        }
        putEvent(data)
        setTempEvent(null);
        setEditModalActive(false)
    }
    const handleEventTimeChange = (info) =>
    {
        let event = events.find(e => e.id === info.event.id);
        const data = 
        {
            title: event.title,
            project: event.project,
            task: event.task,
            description: event.description,
            start: info.start,
            end: info.end,
            allDay: event.allDay
        }

        //fixes a stutter issue by temporarily loading a new event into the calendar
        //before the state change dispatches and updates - not very clean 
        //way around this might be to go async instead? 
        let tempEvent = createEvent(event.id, event.title, info.start, info.end, event.allDay, null);
        setEvents( prevEvents =>
        {
            const updatedEvents = prevEvents.filter(e => 
            {   
                return e.id !== event.id
            });
            return [...updatedEvents, tempEvent]
        }) 
        
        patchEvent(event, data);
    }

    return (
        <main>
            <div id={styles.editModal} className={editModalActive ? styles.active : ""}>
                
                <form ref={modalInputRef} onSubmit={handleSubmit}>
                    <input placeholder='Add a title' name='title' required={true} maxLength={50}/>
                    <div>
                        <label>Project</label>
                        <select name='project'>
                            {
                                projectNames && projectNames.length > 0 ?
                                (
                                    projectNames.map((project, index) =>
                                    (
                                        <option key={index}>
                                            {project}
                                        </option>
                                    ))
                                )
                                :
                                (
                                    <option>No projects yet... Add one?</option>
                                )

                            }
                        </select>
                    </div>
                    <div>
                        <label>Task</label>
                        <select name='task'>
                        {
                            taskNames && taskNames.length > 0 ?
                            (
                                taskNames.map((task, index) => 
                                (
                                    <option key={index}>
                                        {task}
                                    </option>
                                ))
                            )
                            :
                            (
                                <option>No tasks yet... Add one?</option>
                            )
                        }
                        </select>
                    </div>
                    <div>
                        <label>Description</label>
                        <textarea name='description' maxLength={500}/>
                    </div>
                    
                <div id={styles.editModalButtonWrap}>
                    <button type='button' onClick={() => handleCancel()}>Cancel</button>
                    <button type="submit">Save</button>
                </div>
                </form>
            </div>
                

            <DragAndDropCalendar 
                ref={calRef}
                localizer = {localizer}
                defaultView='day'
                events={events}
                
                onDragStart={() => "dragging"}
                onEventDrop={(info) => handleEventTimeChange(info)}
                onSelectSlot={info => createTempEvent(info)}
                onDoubleClickEvent={(info) => editEvent(info)}
                onEventResize={(info) => handleEventTimeChange(info)}
                
                dayLayoutAlgorithm={'overlap'}
                
                resizable
                selectable
                
                min={new Date(new Date().setHours(6, 0, 0, 0))}
                max={new Date(new Date().setHours(18, 0, 0, 0))}
                
                allDayAccessor={(event) =>  event.allDay}
                startAccessor={(event) => { return new Date(event.start) }}
                endAccessor={(event) => { return new Date(event.end) }}
                resizableAccessor={() => true}
                draggableAccessor={() =>true}
                
                components =
                {
                    {
                        toolbar: Toolbar,
                        //timeSlotWrapper: customColumnWrapper
                        //dayColumnWrapper: customColumnWrapper
                    }

                }
            />
        </main>

    )
}
