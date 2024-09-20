import React, { useEffect, useRef, useState } from 'react'
import { Calendar, Views} from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import "react-big-calendar/lib/css/react-big-calendar.css"
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import "./CalendarStyles.css"
import styles from "./AppCalendar.module.css"

const DragAndDropCalendar = withDragAndDrop(Calendar)

/*
    TODO:
        1) Add delete method for the projects list
        2) Add delete method for (local) events
*/

const createEvent = (id, title, start, end, allDay, resourceId) =>
{
    const createdEvent = 
    {
        id: id,
        title: title,
        start: start,
        end: end,
        allDay: allDay,
        resourceId: resourceId
    }
    return createdEvent;
}

export const AppCalendar = 
    ({
        calRef,
        eventsArray, 
        projectsArray, 
        webFunctions, 
        calendarFunctions,
        localizer, 
        setCurrentView
    }) => 
{    

    const [tempEvent, setTempEvent] = useState(null);
    const [events, setEvents] = useState(eventsArray);
    const [projects, setProjects] = useState(null);
    const [editModalActive, setEditModalActive] = useState(false);
    const modalInputRef = useRef(null);
    const projectRef = useRef(null);
    const projectInputRef = useRef(null);

    useEffect(() =>
    {
        setEvents(eventsArray);
        setProjects([{id: 0, title: "Test 1"}])
        console.log(eventsArray)
    },[eventsArray, projectsArray])
   
    useEffect(() =>
    {
        if(!editModalActive && modalInputRef)
        {
            modalInputRef.current.reset();
        }
    }, [editModalActive])
    
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
            allDay: true,
            box:
            {
                x: 250,
                y: 250
            }
        }
        createTempEvent(data)
    }
    calendarFunctions.addEventFromSecondaryMenu = handleToolbarEventAdd;

    const handleCancel = () =>
    {
        setEditModalActive(false)
        events.pop();
    }

    const createTempEvent = (args) =>
    {
        console.log(args)
        let event;
        if(editModalActive)
        {
            events.pop();
            console.log("Event popped")
        } 
        if(!args.allDay)
        {
            let timeDiff = (Math.abs(new Date(args.end) - new Date(args.start))) / (1000 * 60 * 60);
            event = createEvent(null, "New Event", args.start, args.end, timeDiff >= 24, 'localEvents');
        }
        else
        {
            event = createEvent(null, "New Event", args.start, args.end, false, 'localEvents');
        }
        
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
            description: formData.get("description"),
            start: tempEvent.start,
            end: tempEvent.end,
            allDay: tempEvent.allDay
        }        
        webFunctions.putEvent(data)
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
        
        webFunctions.patchEvent(event, data);
    }

    const handleEventClick = (info) =>
    {
        setTempEvent(events.find(event => event.id === info.id))
        openModal(info)
    }
    
    const handleSelectAdd = (e) =>
    {
        e.preventDefault();
        const project = projectInputRef.current.value;
        console.log(document.getElementById(`${styles.projectAdd}`).classList.contains(`${styles.active}`))
        if(project.length === 0 && document.getElementById(`${styles.projectAdd}`).classList.contains(`${styles.active}`))
        {
            projectInputRef.current.setCustomValidity("Project Name cannot be empty")
            projectInputRef.current.reportValidity()
        }
        else
        {
            projectInputRef.current.setCustomValidity("")
            webFunctions.putProject(project)
            projectInputRef.current.value = ""
        }
    }
    const handleSelectDelete = (e) =>
    {
        
    }


    const testevents = [
        {
            allDay: false,
            description: "",
            end: "2024-09-20T23:00:00Z",
            id: 53,
            projectId_id: 2,
            resourceId: "localEvents",
            start: "2024-09-20T19:00:00Z",
            title: "New Event",
        },
        
    ];
    return (
        <main id={styles.appCalendarWrap}>
            <div id={styles.editModal} className={editModalActive ? styles.active : ""}>
                
                <button type='button' id={styles.editModalExit} onClick={() => handleCancel()}>
                    &#10006;
                </button>

                <form id={styles.editModalForm} ref={modalInputRef} onSubmit={handleSubmit}>
                    
                    <input placeholder='Add a title' name='title' required={true} maxLength={50} defaultValue={tempEvent? tempEvent.title : null}/>

                        <div id={styles.editModalProject}>
                        <label>Project</label>

                        <div ref={projectRef} className={styles.expandingMenu}>
                            {
                                projects && projects.length > 0 ? 
                                (
                                    <section id={styles.projectSection}>
                                        <div id={styles.projectDropDown} className={styles.active}>
                                            <select name="project">
                                                {   
                                                    projects.map((project) => 
                                                    (
                                                        <option key={project.id}>
                                                            {project.title}
                                                        </option>
                                                    ))
                                                }
                                            </select>
                                            <button type='button' onClick={() =>
                                            {
                                                console.log(document.getElementById(`${styles.projectDropDown}`))
                                                console.log(document.getElementById(`${styles.projectAdd}`))
                                                document.getElementById(`${styles.projectDropDown}`).classList.remove(`${styles.active}`)
                                                document.getElementById(`${styles.projectAdd}`).classList.add(`${styles.active}`)
                                            }}>+</button>
                                            <button type='button'>
                                                🗑
                                            </button>
                                        </div>

                                        <div id={styles.projectAdd}>
                                            <input ref={projectInputRef} placeholder="Name of Project"/>
                                            <button type='button' onClick={(e) => handleSelectAdd(e)}>✓</button>
                                            <button type='button' onClick={() =>
                                            {
                                                projectInputRef.current.value = "";
                                                document.getElementById(`${styles.projectDropDown}`).classList.add(`${styles.active}`);
                                                document.getElementById(`${styles.projectAdd}`).classList.remove(`${styles.active}`);
                                                projectInputRef.current.setCustomValidity("");
                                            }}> - </button>
                                        </div>
                                    </section>
                                ) : 
                                (
                                    <section id={styles.projectSection}>
                                        <div id={styles.noProjects} className={styles.active}>
                                            <span>No projects yet... Add one?</span>
                                            <button type='button' onClick={() => 
                                            {
                                                document.getElementById(`${styles.projectAdd}`).classList.add(`${styles.active}`);
                                                document.getElementById(`${styles.noProjects}`).classList.remove(`${styles.active}`);
                                            }}>+</button>
                                        </div>
                                        
                                        <div id={styles.projectAdd}>
                                            <input ref={projectInputRef} placeholder="Name of Project"/>
                                            <button onClick={(e) => handleSelectAdd(e)}>
                                                ✓
                                            </button>
                                            <button type='button' onClick={() =>
                                            {
                                                projectInputRef.current.value = "";
                                                document.getElementById(`${styles.noProjects}`).classList.add(`${styles.active}`);
                                                document.getElementById(`${styles.projectAdd}`).classList.remove(`${styles.active}`);
                                                projectInputRef.current.setCustomValidity("");
                                            }}> - </button>
                                        </div>

                                    </section>
                                )
                            }
                        </div>
                    </div>

                    <div>
                        <label>Start Time</label>
                        <input type='datetime-local'
                            defaultValue=
                            {
                                tempEvent ?
                                (
                                    () =>
                                    {
                                        const start = new Date(tempEvent.start);
                                        start.setHours(start.getHours() + 12);
                                        return start.toISOString().slice(0,16)
                                    }
                                )()
                                :
                                null
                            }
                        />
                    </div>
                    <div>
                        <label>End Time</label>
                        <input type='datetime-local' 
                            defaultValue=
                            {
                                tempEvent ?
                                (
                                    () =>
                                    {
                                        const end = new Date(tempEvent.end);
                                        end.setHours(end.getHours() + 12);
                                        return end.toISOString().slice(0,16)
                                    }
                                )()
                                :
                                null
                            }
                        />

                    </div>
                    <div>
                        <label>All Day Event</label>
                        <input type='checkbox' checked={tempEvent ? tempEvent.allDay ? true: false :false}/>
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
                events={events}
                date={new Date(calendarFunctions.date)}
                view={calendarFunctions.view}
                onDragStart={() => "dragging"}
                onSelectEvent={(info) => { handleEventClick(info)} }
                onEventDrop={(info) => handleEventTimeChange(info)}
                onSelectSlot={info => createTempEvent(info)}
                onDoubleClickEvent={(info) => editEvent(info)}
                onEventResize={(info) => handleEventTimeChange(info)}
                resources=
                {
                    
                    calendarFunctions.view === Views.DAY ?
                    [
                        {id: "localEvents", title:"Your Events"},
                        {id: "importedEvents", title:"Imported Events"}
                    ]
                    :
                    null
                    
                }
                //onNavigate={(date) => calendarFunctions.setDate(date)}
                //onView={(view) => calendarFunctions.setView(view)}
                //dayLayoutAlgorithm={'overlap'}
                resizable
                selectable
                min={new Date(new Date().setHours(6, 0, 0, 0))}
                max={new Date(new Date().setHours(18, 0, 0, 0))}
                allDayAccessor={(event) =>  event.allDay}
                startAccessor={(event) => { return new Date(event.start) }}
                endAccessor={(event) => { return new Date(event.end) }}
                resizableAccessor={() => true}
                draggableAccessor={() =>true}
                toolbar={null}
            />
        </main>
    )
};
