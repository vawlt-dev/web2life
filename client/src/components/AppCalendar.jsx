import React, { useEffect, useRef, useState } from 'react'
import { Calendar, Views, momentLocalizer } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import "react-big-calendar/lib/css/react-big-calendar.css"
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import "./CalendarStyles.css"
import styles from "./AppCalendar.module.css"
import moment, { duration } from 'moment'
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
    const [view, setView] = useState(Views.MONTH)

    const calRef = useRef(null);
    const modalInputRef = useRef(null);
    const projectRef = useRef(null);
    const taskRef = useRef(null);

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
            
    } 
    const handleToolbarEventAdd = () =>
    {
        const data = 
        {
            //round to nearest 15 min period
            start: new Date(new Date().setMinutes(Math.round(new Date().getMinutes() / 15) * 15, 0, 0)), 
            //round to next nearest 15 min period and account for hour rollover
            end: new Date(new Date().setMinutes(Math.round(new Date().getMinutes() / 15) * 15, 0, 0) + 15 * 60000), 
            box:
            {
                x: 250,
                y: 250
            }
        }
        createTempEvent(data)
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
            events.pop();
            console.log("Event popped")
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
            start: new Date(tempEvent.start).toUTCString(),
            end: new Date(tempEvent.end).toUTCString(),
            allDay: tempEvent.allDay
        }
        console.log(data)
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

    const handleEventClick = (info) =>
    {
        console.log(info)
    }

    return (
        <main>
            <div id={styles.editModal} className={editModalActive ? styles.active : ""}>
                
                <button type='button' id={styles.editModalExit} onClick={() => handleCancel()}>
                    &#10006;
                </button>

                <form id={styles.editModalForm} ref={modalInputRef} onSubmit={handleSubmit}>
                    <input placeholder='Add a title' name='title' required={true} maxLength={50}/>
                    <div id={styles.editModalProject}>
                        <label>Project</label>
                            {
                                projectNames && projectNames.length > 0 ?
                                (
                                    <select name='project'>
                                    {
                                        projectNames.map((project, index) =>
                                        (
                                            <option key={index}>
                                                {project}
                                            </option>
                                        ))
                                    }
                                    </select>
                                )
                                :
                                (
                                    <div ref={projectRef}  className={styles.noTaskProject}>
                                        <section>
                                            <span>No projects yet... Add one?</span>
                                            <input placeholder="Name of Project"/>
                                            <button className='editModalTick'>✓</button>
                                        </section>
                                        <button type='button' onClick={() =>
                                        {
                                            if(projectRef)
                                            {
                                                let section = projectRef.current.children[0];
                                                let button = projectRef.current.children[1];

                                                if(section.classList.contains(styles.active))
                                                {
                                                    section.classList.remove(styles.active)
                                                    button.textContent = "+";

                                                }
                                                else
                                                {
                                                    section.classList.add(styles.active);
                                                    button.textContent = "-"
                                                }
                                            }
                                        }}>
                                            +
                                        </button>
                                    </div>
                                )

                            }
                    </div>
                    <div id={styles.editModalTask}>
                        <label>Task</label>
                        {
                            taskNames && taskNames.length > 0 ?
                            <select name='task'>
                            {
                                (
                                    taskNames.map((task, index) => 
                                    (
                                        <option key={index}>
                                            {task}
                                        </option>
                                    ))
                                )
                            }
                            </select>
                            :
                            (
                                <div ref={taskRef}  className={styles.noTaskProject}>
                                    <section>
                                        <span>No projects yet... Add one?</span>
                                        <input placeholder="Name of Project"/>
                                        <button className='editModalTick'>✓</button>
                                    </section>
                                    <button type='button' onClick={() => 
                                    {
                                        if(taskRef)
                                        {
                                            let section = taskRef.current.children[0];
                                            let button = taskRef.current.children[1];

                                            if(section.classList.contains(styles.active))
                                            {
                                                section.classList.remove(styles.active)
                                                button.textContent = "+";

                                            }
                                            else
                                            {
                                                section.classList.add(styles.active);
                                                button.textContent = "-"
                                            }
                                        }
                                    }}>
                                        +
                                    </button>
                                </div>
                            )
                        }
                    </div>
                    <div>
                        <label>Start Time</label>
                        <input type='datetime-local'></input>
                    </div>
                    <div>
                        <label>End Time</label>
                        <input type='datetime-local'></input>
                    </div>
                    <div>
                        <label>All Day Event</label>
                        <input type='checkbox'/>
                    </div>
                    <div>
                        <label>Description</label>
                        <textarea name='description' maxLength={500}/>
                    </div>
                    
                    <button type="submit" id={styles.editModalSubmit}>Save</button>
                </form>
            </div>
                

            <DragAndDropCalendar 
                ref={calRef}
                localizer = {localizer}
                defaultView='day'
                events={
                    [ 
                        {
                            id: 1,
                            title: "test",
                            start: new Date(),
                            end: new Date()
                        } 
                    ]
                    //events
                    }
                
                onDragStart={() => "dragging"}
                onSelectEvent={(info) => { handleEventClick(info)} }
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
                        toolbar: (props) => <Toolbar {...props} toolbarEventAdd={handleToolbarEventAdd}/>
                        //timeSlotWrapper: customColumnWrapper
                        //dayColumnWrapper: customColumnWrapper
                    }

                }
            />
        </main>

    )
}
