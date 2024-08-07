import FullCalendar from "@fullcalendar/react"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin, { Draggable } from "@fullcalendar/interaction"
import styles from "./App.module.css";
import { useEffect, useRef, useState } from "react";

export const App = () =>
{
    const calRef = useRef(null);
    const [events, setEvents] = useState([]);
    const [droppedEvents, setDroppedEvents] = useState([]);
    const [CSRFToken, setCSRFToken] = useState(null)
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
    }, [])

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
            console.log(data.data)
            setEvents(data.data)
        })
    }
    const putEvent = (event) =>
    {
        fetch("/setEvent",
        {
           
            method: "POST", 
            headers: 
            {
                'Content-Type': 'application/x-www-form-urlencoded',
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
                console.log("Oh no")
            }
        })
    }
    
    const updateEventTimes = (info) =>
    {
        console.log(info);
        const eventID =events.find(event => (event.id).toString() === (info.event.id).toString()).id, 
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
        fetch("/updateEventTimes",
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
        fetch("/clearEvents");
        setEvents([])
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
        getEvents()
    }

    const displayEvents = () => 
    {
        let tempEvents = [];
        for(let i = 0; i < events.length; i++)
        {
            let eventData;
            if(events[i].times.length > 0)
            {
                for(let j = 0; j < events[i].times.length; j++)
                {
                    eventData = 
                    {
                        id: events[i].id,
                        title: events[i].task,
                        start: events[i].times[j].start,
                        end: events[i].times[j].end,
                        allDay: events[i].times[j].allDay,
                        project: events[i].project,
                        description: events[i].description
                        
                    }
                    tempEvents.push(eventData);
                }
            }
            else
            {
                eventData = 
                    {
                        id: events[i].id,
                        title: events[i].task,
                        start: events[i].times,
                        end: events[i].times,
                        allDay: events[i].times,
                        project: events[i].project,
                        description: events[i].description
                    }
                tempEvents.push(eventData);
            }
        }
        return tempEvents;
    }


    useEffect(() => 
    {
        //creates draggable instances for loaded events
        const existingDraggables = document.querySelectorAll(`.${styles.externalDraggable}`);
        existingDraggables.forEach((element) => 
        {
            const draggableInstance = element.draggableInstance;
            if (draggableInstance) 
            {
                draggableInstance.destroy();
            }
        });

        if (events.length > 0) 
        {
            const externalDraggableElements = document.querySelectorAll(`.${styles.externalDraggable}`);
            externalDraggableElements.forEach((element, index) => 
            {
                const drag = new Draggable(element, 
                {
                    eventData: 
                    {
                        id: events[index]?.id,
                        title: events[index]?.task,
                        times: events[index]?.times,
                        extendedProps: 
                        {
                            project: events[index]?.project,
                            description: events[index]?.description,
                        },
                    },
                });
                element.draggableInstance = drag;
            });
        }
    }, [events]);

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
                    <div id={styles.eventList}>
                    {
                      events.map( (item, index) => (
                           <div className={styles.externalDraggable} 
                               key={index}
                               draggable={true}
                           >
                               {item.task}
                           </div>
                      ))
                    }
            </div>

            </div>
            </div>
        <div id={styles.dataWrap}>
            <button onClick={clearEvents}>Clear Data</button>
        </div>

        <FullCalendar
            ref={calRef}
            plugins={[timeGridPlugin, interactionPlugin]}
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
            
            classname
            events = { 
            
                displayEvents().map(event =>
                ({
                    id: event.id,
                    title: event.title,
                    start: event.start,
                    end: event.end,
                    allDay: event.allDay
                }))
            
            }
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