import FullCalendar from "@fullcalendar/react"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin, { Draggable } from "@fullcalendar/interaction"
import styles from "./App.module.css";
import trashImage from "./resources/images/trash.svg"
import { useEffect, useRef, useState } from "react";

export const App = () =>
{
    const calRef = useRef(null);
    const trashRef = useRef(null);
    const [events, setEvents] = useState([]);
    const [CSRFToken, setCSRFToken] = useState(null)
    const [currentDraggedEvent, setCurrentDraggedEvent] = useState(null);

    useEffect( () =>
    {
        // for the outer calendar wrapper
        calRef.current.elRef.current.id = styles.calendar
    }, [calRef]) 

    useEffect( () =>
    {
        //set CSRF token for database modification
        fetch("/getCsrfToken",
        {
            method: 'GET'
        })
        .then(res => res.json().then(data =>
        {
            setCSRFToken(data['csrf-token'])
        }))

        getEvents();
        window.addEventListener("mouseup", () =>
        {
            setCurrentDraggedEvent(null);
        })
    }, [])


    useEffect(() => 
    {
        const draggables = document.querySelectorAll(`.${styles.externalDraggable}`);
        
        draggables.forEach((draggable, index) => 
        {
            new Draggable(draggable, 
            {
                eventData: 
                { 
                    id: events[index]?.id,
                    title: events[index]?.title,
                    times: events[index]?.times,
                    extendedProps:
                    {
                        project: events[index]?.project,
                        description: events[index]?.description
                    }
                },
            });   
        });
    }, [events]);


    const opacityAnimation = (obj, animDuration) =>
    {
        if(obj instanceof HTMLElement)
        {
            obj.animate(
                [
                    {opacity: 1},
                    {opacity: 0},
                    {opacity: 1},
                ],
                {
                    duration: animDuration,
                    easing: "ease-in-out"
                    // half duration time so switch triggers on centre keyframe
                }
            )
        }
    }
    
    const getEvents = () =>
    {
        //gets all user events
        fetch("/getEvents").then(res => res.json())
        .then(data =>
        {
            /*
                this iterates over data.data (all of the events) by first destructuring 
                the event into its constituent properties, then, if the event has more than one time,
                it creates a new entry in the (temp) array with that time. if the time.length is 0 it 
                just appends what was originally passed in the destructure. 
                finally, both arrays are joined and returned as one array

                TLDR: this parses the data from the server so that an individual event is made for each event and its specific event times
            */
            const tempEvents = data.data.reduce((accumulator, event) =>
            {
                const { id, task, project, description, times } = event;

                const eventTimes = times.length > 0 ?
                times.map(time => 
                (
                    {
                        id,
                        title: task,
                        start: time.start,
                        end: time.end,
                        allDay: time.allDay,
                        project,
                        description
                    }
                )) 
                :
                [
                    {
                        id,
                        title: task,
                        start: times,
                        end: times,
                        allDay: times,
                        project,
                        description
                    }
                ];
                return [...accumulator, ...eventTimes]
            }, [])
            
            console.log(tempEvents)
            setEvents(tempEvents)
        })
    }
    const putEvent = (event) =>
    {
        //append '/' to posts otherwise will reset to a GET request
        fetch("/setEvent/",
        {
            method: "POST", 
            headers: 
            {
                'X-CSRFToken': CSRFToken
            },
            body: JSON.stringify(event)
        }).then(res =>
        {
            if(res.ok)
            {
                console.log("Successfully posted data")
            }
            else
            {
                console.log("Error with submitting custom event")
            }
        }).then(()=>
        {
            getEvents()
        })
    }
    const deleteEvent = (event) =>
    {
        fetch("/deleteEvent/",
            {
                method: "POST",
                headers:
                {
                    'X-CSRFToken': CSRFToken
                },
                body: JSON.stringify(event)
            }
        ).then(res =>
        {
            if(res.ok)
            {
                console.log("Successfully removed event")
                getEvents();
            }
        })
    }
    const updateEventTimes = (info) =>
    {
        const eventID = events.find(event => (event.id).toString() === (info.event.id).toString()).id, 
              newStart = info.event.start, 
              newEnd = info.event.end, 
              newAllDay = info.event.allDay
        let data = 
        {
            time:
            {
                start: newStart,
                end: newEnd,
                allDay: newAllDay
            },
            id: eventID
        };
        
        if(info.oldEvent)
        {
            data = 
            {
                time:
                {
                    oldStart: info.oldEvent.start,
                    oldEnd: info.oldEvent.end,
                    oldAllDay:info.oldEvent.allDay,
                    newStart: newStart,
                    newEnd: newEnd,
                    newAllDay: newAllDay
                },
                id: eventID
            };
        }
        fetch("/updateEventTimes/",
        {
            method: "PATCH",
            headers:
            {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRFToken': CSRFToken
            },
            body: JSON.stringify(data)
        })
    }

    const clearEvents = () =>
    {
        fetch("/clearEvents").then(res =>
        {
            setEvents([])
        }).then( () =>
        {
            fetch("/getEvents")
        });
    }
    const handleHeaderButtonClick = (method, date) =>
    {
        const api = calRef.current.getApi();

        opacityAnimation(calRef.current.elRef.current, 750);

        setTimeout(() => 
        {
            if(method === "Day")
            {
                if(date)
                {
                    api.changeView("timeGridDay", date)
                }
                else
                {
                    api.changeView("timeGridDay")
                }
            }
            else if(method === "Today")
            {
                api.today();
            }
            else
            {
                api.changeView("timeGridWeek")
            }
        }, 375);            
        // half duration time so switch triggers on centre keyframe
    }
    
    const submitCustomEvent = (e) =>
    {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const event =
        {
            task: formData.get("task"), 
            times: [],
            project: formData.get("proj"),
            description: formData.get("desc")
        }
        putEvent(event);
    }

    return (
        <div id={styles.mainWrap}>
            <div id={styles.eventsContainer}>
            <form id={styles.createEvent} onSubmit={e => submitCustomEvent(e)}>
                <label>
                    Create an Event
                </label>
                <div>
                    <label>Project</label>
                    <input name="proj" type="text" required={true} maxLength={32}/>
                </div>
                <div>
                    <label>Task</label>
                    <input name="task" type="text" required={true}maxLength={32}/>
                </div>
                <div>
                    <label>Description</label>
                    <textarea name="desc" maxLength={500}/>
                </div>
                <div id={styles.createEventButtonWrap}>
                    <button type="submit">Add</button>
                    <button type="reset">Clear</button>
                </div>
            </form>
            
            <div id={styles.eventListWrapper}>
                    <label>Your Events</label>
                    {
                        events.length > 0 ?
                        (
                            <div id={styles.eventList}>
                            {
                                /* 
                                    maps over the events array, and checks for duplicate elements, then converts this into a Map object with key-value pairs,
                                    before converting it again into a new (filtered) array from the values of the Map object -> this removes duplicate elements
                                */
                                
                                [...new Map(events.map(item => [item.id, item])).values()].map((item, index) => 
                                (
                                    <div className={styles.externalDraggable} 
                                    key={index}
                                    draggable={true}
                                    onMouseDown={() => setCurrentDraggedEvent(item)}
                                    >
                                        {item.title}
                                    </div>

                                ))
                                
                            }
                            </div>
                        )
                        :
                        (
                            <div>No events yet</div>
                        )
                    }
            </div>
        </div>



        <div id={styles.trash}  
            ref={trashRef}
            onMouseUp =
            {
                (e) => 
                {
                    if(currentDraggedEvent)
                    {
                        deleteEvent(currentDraggedEvent)
                    }
                    console.log(currentDraggedEvent)
                    setCurrentDraggedEvent(null)
                }
            }
        >
            <img src={trashImage} alt="Trash"></img>
        </div>

        <FullCalendar
            ref={calRef}
            plugins={[timeGridPlugin, interactionPlugin]}
            key={events}
            initialView="timeGridWeek"
            headerToolbar =
            {
                {
                    left: "title",
                    right: "prevYear prev customDayButton customTodayButton customWeekButton next nextYear",
                }
                
            }
            customButtons = 
            {
                {
                    customDayButton: 
                    {
                        text: "Day",
                        click: () => handleHeaderButtonClick("Day")
                    },
                    customTodayButton:
                    {
                        text: "Today",
                        click: () => handleHeaderButtonClick("Today")
                    },
                    customWeekButton: 
                    {
                        text: "Week",
                        click: () => handleHeaderButtonClick("Week")
                    }
                }
            }
            dayHeaderClassNames={styles.calendarHeader}
            viewClassNames={styles.calView}
            slotMinTime="08:00:00"
            slotDuration="00:15:00"
            slotMaxTime="18:15:00"
            dayCellClassNames={styles.weekCells}
            slotLaneClassNames={styles.slotLane}            
            events = { events }
            editable = { true }
            droppable = { true }
            eventReceive = { info => updateEventTimes(info) }
            eventDrop={ info => updateEventTimes(info)}
            eventResize={ info => updateEventTimes(info)}
            dateClick = 
            {
                (info) => 
                {
                    switch(info.view.type)
                    {
                        case "timeGridWeek":
                        {
                            //clicking on a day of month cell takes user to day view of that day
                            handleHeaderButtonClick("Day", info.date)
                            break;
                        }   
                        case "timeGridDay":
                        {
                            //alert("Day Grid")
                            break;
                        }
                        default:
                        {
                            return;
                        }
                    }
                }
            } 
        />
    </div>
  );
}