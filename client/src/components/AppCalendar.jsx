import React, { useEffect, useRef, useState } from 'react'
import { Calendar, Views} from 'react-big-calendar'
import {v6 as uuid} from 'uuid'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import "react-big-calendar/lib/css/react-big-calendar.css"
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import "./CalendarStyles.css"
import styles from "./AppCalendar.module.css"
const DragAndDropCalendar = withDragAndDrop(Calendar)

const hexToRgb = (colour) =>
{
    let r = parseInt(colour.slice(1, 3), 16);
    let g = parseInt(colour.slice(3, 5), 16);
    let b = parseInt(colour.slice(5, 7), 16);
    return { r, g, b };
}
const createEvent = (id = uuid(), 
                     title, 
                     start, 
                     end, 
                     project = null, 
                     description = "",
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
            description: description,
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
    const [popupActive, setPopupActive] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState({ project: 0, description: "" });
    const [editModalActive, setEditModalActive] = useState(false);
    const [ctrlPressed, setCtrlPressed] = useState(false);
    const main = document.querySelector('main');
    //key listener for the CTRL key
    useEffect(() =>
    {
        const ctrlDown = (e) =>
        {
            if(e.key === 'Control')
            {
                // stops event from bubbling up to the calendar listeners
                // otherwise the drag would be broken
                e.stopImmediatePropagation();
                setCtrlPressed(true);
            }
        }
        const ctrlUp = (e) =>
        {
            if(e.key === 'Control')
            {
                e.stopImmediatePropagation();
                setCtrlPressed(false);
            }
        }


        window.addEventListener('keydown', ctrlDown, {capture:true})
        window.addEventListener('keyup', ctrlUp, {capture:true})
        
        return () =>
        {
            window.removeEventListener('keydown', ctrlDown);
            window.removeEventListener('keyup', ctrlUp);
        }
    }, [])
    useEffect(() =>
    {
        console.log(selectedEvent)
    }, [selectedEvent])
    //unselectable right column in day view
    useEffect(() =>
    {
        if(calendarFunctions.view === Views.DAY)
        {
            const slots  = document.querySelectorAll('.rbc-day-slot.rbc-time-column');
            if(slots.length > 1)
            {
                slots[1].classList.add(styles.noSelect)
            }
        }
    }, [calendarFunctions.view])
    
    const modalInputRef = useRef(null);
    const modalRef = useRef(null)
    const selectRef = useRef(null);
    const projectInputRef = useRef(null);
    const projectAddRef = useRef(null);
    const projectsRef = useRef(null);
    const noProjectsRef = useRef(null);
    const popupRef = useRef(null);
    
     const closePopup = () => 
     {
        if (popupRef.current.classList.contains(styles.active)) 
        {
            popupRef.current.classList.remove(styles.active);
            popupRef.current.style.top = 0;
            popupRef.current.style.left = 0;
        }
        setPopupActive(false);
    };

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
        setSelectedEvent(prevEvent => 
        ({
            ...prevEvent,  
            project: 0,
            description: ""
        }));
        if(popupActive)
        {
            closePopup();
            return;
        }
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
            event = createEvent(null, "New Event", args.start, args.end, null, "", timeDiff >= 24, 'localEvents');
        }
        else
        {
            event = createEvent(null, "New Event", args.start, args.end,null, "", false, 'localEvents');
                
        }
            
        setEvents(prevEvents => [...prevEvents, event])    
        openModal(args) 
            
    }

    const openModal = (args) =>
    {
        setEditModalActive(true);
        let modal = modalRef.current;
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
        else
        {
            if(args.clientX > main.getBoundingClientRect().width / 2)
            {
                args.clientX -= modal.getBoundingClientRect().width;
            }
            if(args.clientY > main.getBoundingClientRect().height / 2)
            {
                args.clientY -= modal.getBoundingClientRect().height;
            }
            //click came from an existing event
            modal.style.top = `${args.clientY}px`
            modal.style.left = `${args.clientX}px`
        }
    } 

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
            "",
            null,
            false,
            null,
            true,
        )
        setEvents(prevEvents => [...prevEvents, event]);
        openModal({ box: { x: 500, y: 300 } })
    }
    calendarFunctions.addEventFromSecondaryMenu = handleToolbarEventAdd;



    const handleSubmit = async (e) =>
    {
        e.preventDefault();
        const formData = new FormData(modalInputRef.current);
        const data = 
        {
            title: formData.get("title"),
            project: selectedEvent.project,
            description: selectedEvent.description,
            start: new Date(formData.get('start')),
            end: new Date(formData.get('end')),
            allDay: formData.get('allDay'),
        };
        if (events.length > 0 && ('isTemporary' in events[events.length - 1]))
        {
            await webFunctions.putEvent(data).then(res =>
            {
                if (res)
                {
                    res.resourceId = 'localEvents';
                    setEvents(prevEvents => 
                    [
                        ...prevEvents.filter(event => !event.isTemporary),
                        res
                    ]);
                }
                else
                {
                    webFunctions.getEvents();
                }
            });
        }
        else
        {
            let event = events.find(e => e.id === events[events.length - 1].id);
            await webFunctions.patchEvent(event, data).then(res =>
            {
                if (!res.ok)
                {
                    webFunctions.getEvents();
                }
                else
                {
                    setEvents(prevEvents =>
                        prevEvents.map(e =>
                            e.id === event.id
                                ? { ...e, ...data }
                                : e
                        )
                    );
                }
            });
        }
        setSelectedEvent(prevEvent => 
        ({
            ...prevEvent,  
            project: 0,
            description: ""
        }));
        setEditModalActive(false);
    };
    const handleEventTimeChange = async (info) =>
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
        if(ctrlPressed)
        {
            
            //prevents 3 temp events spawning and looking gross on calendar
            setEvents((prevEvents) => prevEvents.filter(e => !('isTemporary' in e)))
            
            await webFunctions.putEvent(data).then((res) =>
            {
                if(!res.id)
                {
                    webFunctions.getEvents();
                }
                else
                {
                    const updatedEvent = { ...res, resourceId: 'localEvents' };
                    setEvents((prevEvents) => [...prevEvents, updatedEvent])
                }
            })
        
        }
        else
        {
            setEvents(prevEvents => {
                const updatedEvents = prevEvents.map(e => 
                e.id === event.id ? { ...e, start: info.start, end: info.end } : e
                );
                return updatedEvents;
            });
            
            await webFunctions.patchEvent(event, data).then(res =>
            {
                if(!res.ok)
                {
                    webFunctions.getEvents();
                }
            })
        }
    }

    const handleEventClick = (info, e) =>
    {
        if(popupActive)
        {
            closePopup();
            return;
        }
        if(info.resourceId !== 'localEvents')
        {   
            const lineBreaks = info.description.replace(/\n/g, '<br>')
            let labelColour = 'black';

            const rect = e.target.getBoundingClientRect();

            popupRef.current.style.left = `${rect.left + window.scrollX + 190}px`;
            if (rect.left > (main.getBoundingClientRect().width / 2)) {
                popupRef.current.style.left = `${rect.left + window.scrollX - 160}px`;
            }
            popupRef.current.style.top = `${rect.top + window.scrollY - 45}px`;
            popupRef.current.style.backgroundColor = colours[info.source]
                            
            const {r,g,b} = hexToRgb(colours[info.source])
        
            if(r > 128 && g > 128 && b > 128)
            {
                labelColour = 'black';
            }
            else
            {
                labelColour = 'white'
            }
            popupRef.current.style.color = labelColour;
            
            popupRef.current.innerHTML = lineBreaks
            popupRef.current.classList.add(styles.active);
            setPopupActive(true)
            console.log(popupRef)
            
            return
        }

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
        setSelectedEvent(event);
        openModal(e)
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
    const handleDelete = async (id) =>
    {
        setEvents(prevEvents => prevEvents.filter(event => event.id !== id))
        await webFunctions.deleteEvent(id).then(res =>
        {
            if(!res.ok)
            {
                webFunctions.getEvents();
            }
            else
            {
                console.log("Event deleted successfully")
            }
        })
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
                                            value={selectedEvent.project || 0}
                                            name="project" 
                                            ref={selectRef}
                                            onChange={(e) => setSelectedEvent(prevEvent => ({
                                                ...prevEvent, 
                                                project: Number(e.target.value)
                                            }))}
                                        >
                                            <option value={0}>No Project</option>
                                            {
                                                projects.map((project) => 
                                                (
                                                    <option key={project.id} value={project.id}>
                                                        {project.title}
                                                    </option>
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
                        <label htmlFor='description'>Description</label>
                        <textarea 
                            id='description' 
                            name='description' 
                            maxLength={500}
                            value={selectedEvent.description || ""}
                            onChange={(e) => setSelectedEvent(prevEvent => ({...prevEvent, description:e.target.value}))}
                        />
                    </div>

                    <div id={styles.editModalButtonWrap} className={events.length > 0 && 'isTemporary' in events[events.length - 1] ? styles.singleButton : ''}>
                        {
                            events.length > 0 && !('isTemporary' in events[events.length - 1]) ? 
                            <button id={styles.editModalDelete} onClick={(e) => 
                            {
                                e.preventDefault()
                                setEditModalActive(false);
                                setTimeout(() => 
                                {
                                    handleDelete(events[events.length - 1].id)
                                }, 300);
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
                onSelectEvent={(info, e) => { handleEventClick(info, e)}}
                onEventDrop={(info) => handleEventTimeChange(info)}
                onEventResize={(info) => handleEventTimeChange(info)}
                
                onDragStart={(e) =>
                {
                    if(ctrlPressed)
                    {
                        const copy = createEvent(
                            e.event.id,
                            e.event.title,
                            e.event.start,
                            e.event.end,
                            e.event.description,
                            e.event.project,
                            e.event.allDay,
                            e.event.resourceId,
                        );
                        setEvents((prevEvents) => [...prevEvents, copy])
                    }
                }}

                eventPropGetter={(event) => 
                {       
                    let backgroundColor = colours[event.source || 'localEvents'] || colours.local;
                    let labelColour = 'black';

                    if (backgroundColor) 
                    {
                        const { r, g, b } = hexToRgb(backgroundColor);
                        
                        if (r > 128 && g > 128 && b > 128) 
                        {
                            labelColour = 'black';
                        } 
                        else 
                        {
                            labelColour = 'white';
                        }
                    }

                    return {
                        className: styles.event,
                        style: 
                        {
                            color: labelColour,
                            backgroundColor: backgroundColor,
                        }
                    };
                }}
                culture='en'
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
                onNavigate={(date) => calendarFunctions.setDate(date)}
                onView={(view) => calendarFunctions.setView(view)}
                dayLayoutAlgorithm={'overlap'}
                
                resizable
                selectable
                
                allDayAccessor={() => { return false }}
                startAccessor={(event) => 
                {
                    
                    return event.start;
                }}
                endAccessor={(event) => 
                { 
                    return event.end;
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
            <div id={styles.popup} ref={popupRef}/>
        </main>
    )
};
