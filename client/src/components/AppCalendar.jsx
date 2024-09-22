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

const createEvent = (id, title, start, end, project = null, allDay, resourceId, isTemporary = true) =>
{
    const createdEvent = 
    {
        id: id,
        title: title,
        start: start,
        end: end,
        project: project,
        allDay: allDay,
        resourceId: resourceId,
        isTemporary: isTemporary
        
    }
    return createdEvent;
}

export const AppCalendar = 
    ({
        calRef,
        events, 
        setEvents,
        projects, 

        webFunctions, 
        calendarFunctions,
        localizer, 
    }) => 
{    
    const [tempEvent, setTempEvent] = useState(null);
    const [editModalActive, setEditModalActive] = useState(false);

    const modalInputRef = useRef(null);
    const modalRef = useRef(null)
    const selectRef = useRef(null);
    const projectInputRef = useRef(null);
    const projectAddRef = useRef(null);
    const projectsRef = useRef(null);
    const noProjectsRef = useRef(null);
    

    const handleAddProject = (projects) =>
    {
        if(projects === true)
        {
            projectAddRef.current.classList.add(styles.active)
            projectsRef.current.classList.remove(styles.active)
        }
        else if(projects === false)
        {
            projectAddRef.current.classList.add(styles.active)
            noProjectsRef.current.classList.remove(styles.active)
        }
        else if(projects === "close")
        {
            projectAddRef.current.classList.remove(styles.active)
            if(noProjectsRef.current)
            {
                noProjectsRef.current.classList.add(styles.active)
            }
            else
            {
                projectsRef.current.classList.add(styles.active)
            }
        }
    }
    
    useEffect(() =>
    {
        if(!editModalActive && modalInputRef)
        {
            modalInputRef.current.reset();
        }
    }, [editModalActive])
    
    useEffect(() =>
    {
        console.log(tempEvent)
    },[tempEvent])
    
    const openModal = (args) =>
    {
        setEditModalActive(false)
        setEditModalActive(true);
        let modal = modalInputRef.current,
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
            event = createEvent(null, "New Event", args.start, args.end, null , timeDiff >= 24, 'localEvents');
        }
        else
        {
            event = createEvent(null, "New Event", args.start, args.end, null, false, 'localEvents');
        }
        
        setTempEvent(event);
        
        //set as event instead of tempEvent cos useState is asynchronous
        setEvents(prevEvents => [...prevEvents, event])
        openModal(args)
        console.log(tempEvent)
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

        if(tempEvent.isTemporary)
        {
            webFunctions.putEvent(data)
        }
        else
        {
            let event = events.find(e => e.id === tempEvent.id);
            console.log(data)
            webFunctions.patchEvent(event, data)
        }
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
        let event = events.find(event => event.id === info.id);
        console.log(events)
        console.log(event)
        setTempEvent({...event, isTemporary: false, project: event.project_title})
        openModal(info)
    }
    
    const handleCancel = () =>
    {
        setEditModalActive(false)
        if(tempEvent.isTemporary)
        {
            events.pop();
        }
        setTimeout(() =>
        {
            //so the event is wiped AFTER the animation is done
            setTempEvent(null);
        }, 200)
    }
    const handleSelectAdd = (e) =>
    {
        e.preventDefault();
        const project = projectInputRef.current.value;
        if(project.length === 0 && projectAddRef.current.classList.contains(`${styles.active}`))
        {
            projectInputRef.current.setCustomValidity("Project Name cannot be empty")
            projectInputRef.current.reportValidity()
        }
        else
        {
            projectInputRef.current.setCustomValidity("")
            webFunctions.putProject(project)
            projectInputRef.current.value = ""
            handleAddProject("close")
        }
    }
    const handleSelectDelete = () =>
    {
        try
        {
            const project = selectRef.current.value;
            webFunctions.deleteProject(project)
        }
        catch(e)
        {
            console.log(e)
        }
    }

    return (
        <main id={styles.appCalendarWrap}>
            <div id={styles.editModal} className={editModalActive ? styles.active : ""} ref={modalRef}>
                
                <button type='button' id={styles.editModalExit} onClick={() => handleCancel()}>
                    &#10006;
                </button>

                <form id={styles.editModalForm} ref={modalInputRef} onSubmit={handleSubmit}>
                    
                    <input placeholder='Add a title' name='title' required={true} maxLength={50} defaultValue={tempEvent ? tempEvent.title : null}/>

                    <div id={styles.editModalProject}>
                        <label>Project</label>
                        <div id={styles.expandingMenu}>
                            <div id={styles.projectAdd} ref={projectAddRef}>
                                <input ref={projectInputRef} placeholder="Name of Project" />
                                <button type="button" onClick={handleSelectAdd}>✓</button>
                                <button type="button" onClick={() => {handleAddProject("close")}}> - </button>
                            </div>
                            {
                                projects.length > 0 
                                ? 
                                (
                                    <div id={styles.projectDropDown} className={styles.active} ref={projectsRef}>
                                        <select defaultValue={tempEvent && tempEvent.project ? tempEvent.project : "No Project"} name="project" ref={selectRef}>
                                            <option>No Project</option>
                                            {
                                                projects.map((project) => 
                                                (
                                                    <option key={project.id}>{project.title}</option>
                                                ))
                                            }
                                        </select>
                                        <button type="button" onClick={() => handleAddProject(true)}>+</button>
                                        <button type="button" onClick={handleSelectDelete}>🗑</button>
                                    </div>
                                ) 
                                : 
                                (
                                    <div id={styles.noProjects} className={styles.active} ref={noProjectsRef}>
                                        <span>No projects yet</span>
                                        <button type="button" onClick={() => handleAddProject(false)}>+</button>
                                    </div>
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
                        <input 
                            type='checkbox' 
                            checked={tempEvent ? tempEvent.allDay ? true : false : false} 
                            onChange={(e) => 
                            {
                                setTempEvent(prevEvent => 
                                    (
                                        {
                                            ...prevEvent,
                                            allDay: e.target.checked
                                        }
                                    )
                                )
                            }}
                        />
                    </div>
                    <div>
                        <label>Description</label>
                        <textarea name='description' maxLength={500}/>
                    </div>

                    <div id={styles.editModalButtonWrap}>
                        {
                            tempEvent ? tempEvent.isTemporary ? null 
                            : 
                            <button id={styles.editModalDelete} onClick={(e) => 
                            {
                                e.preventDefault()
                                webFunctions.deleteEvent(tempEvent.id)
                                setEditModalActive(false)
                            }}>
                            Delete
                            </button> 
                            : 
                            null
                        }
                        <button type="submit" id={styles.editModalSubmit}>Save</button>
                    </div>
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
