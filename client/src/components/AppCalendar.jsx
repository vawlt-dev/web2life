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

const createEvent = (id, 
                     title, 
                     start, 
                     end, 
                     project = null, 
                     allDay, 
                     resourceId = 'localEvents', 
                     isTemporary = true
                    ) =>
{
    return (
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
    ) 
}

const CustomHeader = (info) =>
{
    let [date, dayOfWeek] = info.label.split(" ");
    date = date[0] === "0" ? date[1] : date;
    return (
        <div className={styles.customHeader}>
            <span>{dayOfWeek}</span>
            <span>{date}</span>
        </div>
    )
}

const GMTToISO = (date) =>
{
    if(!(date instanceof Date))
    {
        date = new Date(date);
    }
    const newDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
    return newDate.toISOString().slice(0, 16)
}

export const AppCalendar = 
    ({
        calRef,
        events, 
        setEvents,
        projects, 
        webFunctions, 
        calendarFunctions,
        colours,
        localizer
    }) => 
{    
    
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
    

    const handleSelectSlot = (args) =>
    {
        let event = null;
        if(editModalActive)
        {
            if('isTemporary' in events[events.length - 1])
            {
                setEvents(prevEvents => prevEvents.slice(0, -1))
            }
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
            
        setEvents(prevEvents => [...prevEvents, event])    
        openModal(args) 
            
    }

    const openModal = (args) =>
    {
        setEditModalActive(true);
        let modal = modalRef.current,
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
                args.box.y -= 400;
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
   const handleAllDayEvent = (event) => 
    {
        if (event.allDay) 
        {
            const start = new Date(event.start);
            const end = new Date(event.end);

            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);

            return { start: start, end: end };
        }

        return { start: new Date(event.start), end: new Date(event.end) };
    };
    const handleToolbarEventAdd = () =>
    {
        let event = createEvent
        (
            null, 
            "New Event", 
            //round to nearest 15 min period
            new Date(new Date().setMinutes(Math.round(new Date().getMinutes() / 15) * 15, 0, 0)),
            //round to next nearest 15 min period and account for hour rollover
            new Date(new Date().setMinutes(Math.round(new Date().getMinutes() / 15) * 15, 0, 0) + 15 * 60000), 
            null,
            false,
            null,
            true,
        )
        setEvents(prevEvents => [...prevEvents, event]);
        openModal({ box: { x: 500, y: 300 } })
    }
    calendarFunctions.addEventFromSecondaryMenu = handleToolbarEventAdd;

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
            start: new Date(formData.get('start')),
            end: new Date(formData.get('end')),
            allDay: formData.get('allDay'),
        }        

        if(events.length > 0 && ('isTemporary' in events[events.length - 1]))
        {
            webFunctions.putEvent(data)
        }
        else
        {
            let event = events.find(e => e.id === events[events.length - 1].id);
            webFunctions.patchEvent(event, data) 
        }
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
        let newEvent = createEvent(event.id, event.title, info.start, info.end, event.allDay, null);
        setEvents( prevEvents =>
        {
            const updatedEvents = prevEvents.filter(e => 
            {   
                return e.id !== event.id
            });
            return [...updatedEvents, newEvent]
        }) 
        
        webFunctions.patchEvent(event, data);
    }

    const handleEventClick = (info) =>
    {
        //for now, make imported events unviewable
        if(info.resourceId !== 'localEvents') return

        //push the selected event to the back
        let event = events.find(event => event.id === info.id);
        
        setEvents(prevEvents =>
        {
            //remove all the temporary events
            const notTemporary = prevEvents.filter(e => !('isTemporary' in e));
            if(notTemporary[notTemporary.length - 1].id !== event.id)
            {
                const filtered = notTemporary.filter(e => e.id !== event.id);
                return [...filtered,  event]
            }
            return notTemporary;
        })
        openModal(info)
    }
    
    const handleCancel = () =>
    {
        setEditModalActive(false)
        //wait until animation is done before removing
        setTimeout(() =>
        {
            setEvents((prevEvents) => prevEvents.filter(e => !('isTemporary' in e)))
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
                    
                    <input placeholder='Add a title' 
                           name='title' 
                           required 
                           maxLength={50} 
                           defaultValue=
                           {
                                events[events.length - 1] ? 
                                    events[events.length - 1].title === "New Event" ? 
                                    null : 
                                    events[events.length - 1].title 
                                : null
                            }
                           />

                    <div id={styles.editModalProject} data-testid={'editModal'}>
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
                                        <select 
                                            defaultValue=
                                            {
                                                events[events.length - 1] && events[events.length - 1].project ? 
                                                events[events.length - 1].project : 
                                                "No Project"
                                            } 
                                            name="project" 
                                            ref={selectRef}
                                        >
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
                        <label htmlFor='startTime'>Start Time</label>
                        <input type='datetime-local' id='startTime'
                            name='start'
                            defaultValue=
                            {   
                                events.length > 0 && events[events.length - 1].start ? 
                                GMTToISO(events[events.length - 1].start) : 
                                null
                            }
                        />
                    </div>
                    <div>
                        <label htmlFor='endTime'>End Time</label>
                        <input type='datetime-local' id='endTime'
                            name='end'
                            defaultValue=
                            {
                                events.length > 0 && events[events.length - 1].end ?
                                GMTToISO(events[events.length - 1].end) :
                                null
                            }
                        />

                    </div>
                    <div>
                        <label htmlFor='allDay'>All Day Event</label>
                        <input 
                            type='checkbox' 
                            checked=
                            {
                                events[events.length - 1] ? 
                                    events[events.length - 1].allDay ? 
                                    true : 
                                    false 
                                : false
                            } 
                            id='allDay'
                            name='allDay'
                            onChange={(e) => 
                            {
                                setEvents(prevEvents => 
                                {
                                    const events = [...prevEvents];
                                    if(events.length > 0)
                                    {
                                        events[events.length - 1] = 
                                        {
                                            ...events[events.length - 1],
                                            allDay: e.target.checked
                                        }
                                    }
                                    return events;
                                }); 
                            }}
                        />
                    </div>
                    <div>
                        <label htmlFor='description'>Description</label>
                        <textarea id='description' name='description' maxLength={500}/>
                    </div>

                    <div id={styles.editModalButtonWrap} className={events.length > 0 && 'isTemporary' in events[events.length - 1] ? styles.singleButton : ''}>
                        {
                            events.length > 0 && !('isTemporary' in events[events.length - 1]) ? 
                            <button id={styles.editModalDelete} onClick={(e) => 
                            {
                                e.preventDefault()
                                webFunctions.deleteEvent(events[events.length - 1].id)
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
                localizer={localizer}
                events={events}
                date={new Date(calendarFunctions.date)}
                view={calendarFunctions.view}
                
                onSelectSlot={info => handleSelectSlot(info)}
                onSelectEvent={(info) => { handleEventClick(info)}}
                onEventDrop={(info) => handleEventTimeChange(info)}
                onEventResize={(info) => handleEventTimeChange(info)}
                onDoubleClickEvent={(info) => editEvent(info)}
                eventPropGetter={(event, start, end, isSelected) => 
                {       
                    //using css injection instead of adding the source as a classname
                    //because we might wanna add a setting for changing event colours later
                    let backgroundColor = ''    

                    switch(event.source)
                    {
                        case 'google':
                            backgroundColor = colours.google;
                            break
                        case 'microsoft':
                            backgroundColor = colours.microsoft;
                            break
                        default:
                            backgroundColor = colours.local;
                            break;
                    }            
                    return {
                        className: styles.event,
                        style:
                        {
                            backgroundColor: backgroundColor,
                        }
                        
                    };
                }}
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
                resourceIdAccessor={(resource) => { return resource.id } }
                resourceTitleAccessor={(resource) => { return resource.title }}
                components=
                {
                    {
                        header: (info) => CustomHeader(info),
                        event: (info) => 
                        {
                            //console.log(info)
                            return(
                                <>
                                    <>
                                        {info.title}
                                        {
                                            info.event.project ? info.event.project : null
                                        }
                                    </>
                                </>
                            )
                        },
                    }
                }
                timeslots={4}
                
                formats=
                {
                    {
                        timeGutterFormat: 'HH:mm'
                    }
                }
                step={15}
                slotPropGetter={() => {return {'data-testid': "slot"} }}
                
                onNavigate={(date) => 
                {
                    calendarFunctions.setDate(date);
                    console.log(date)
                }}
                
                onView={(view) => calendarFunctions.setView(view)}
                dayLayoutAlgorithm={'overlap'}
                resizable
                selectable
                allDayAccessor={() => { return false }}
                startAccessor={(event) => 
                {
                    return handleAllDayEvent(event).start;
                }}
                endAccessor={(event) => 
                { 
                    return handleAllDayEvent(event).end;
                }}
                resizableAccessor={(event) => 
                {
                    return event.resourceId === "localEvents";
                }}
                draggableAccessor={(event) => 
                {
                    return event.resourceId === "localEvents";
                }}
                toolbar={null}
            />
        </main>
    )
};
