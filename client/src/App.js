import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin, { Draggable } from "@fullcalendar/interaction"
import styles from "./App.module.css";
import { useEffect, useRef, useState } from "react";

export const App = () =>
{
    const calRef = useRef(null);
    const [events, setEvents] = useState([]);
    const [CSRFToken, setCSRFToken] = useState(null)
    useEffect( () =>
    {
        // for the outer calendar wrapper
        calRef.current.elRef.current.id = styles.calendar
    }, [calRef]) 
    
    useEffect( () =>
    {
        fetch("/getCsrfToken",
        {
            method: 'GET'
        })
        .then((res) => 
        {
            if(res.ok)
            {
                return res.text()
            }
            else
            {
                console.log("Issue getting csrf token")
            }
        }).then(data => 
        {
            //have to do this bc response returns raw string
            setCSRFToken(data.split('"')[3])
        })
    }, [])
    useEffect(() =>
    {
        console.log(CSRFToken + " ----")
    }, [CSRFToken])
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
    
    const getEvent = () =>
    {
        fetch("/getEvent").then(data =>
        {
            console.log(data)
        })
    }
    const setEvent = () =>
    {
        console.log(events[events.length - 1])
        fetch("/setEvent",
        {
           
            method: "POST", 
            headers: 
            {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRFToken': CSRFToken
            },
            body: JSON.stringify
            (
                {
                    event: (events[events.length - 1])
                }
            )
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
                api.changeView("dayGridMonth")
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
            project: formData.get("proj"),
            task: formData.get("task"),
            description: formData.get("desc")
        }
        setEvents([...events, event])
    }

    const handleDrag = (element, index) => 
    {
        let drag = new Draggable(element,
        {
            eventData: () =>(
            {
                title: events[index].task,
                extendedProps: {},
            })
        })
        console.log(drag)
    }
    useEffect(() => 
    {
        if (events.length > 0) 
        {
            const externalDraggableElements = document.querySelectorAll(`.${styles.externalDraggable}`);
            externalDraggableElements.forEach((element, index) => 
            {
                new Draggable(element, 
                {
                    eventData: 
                    {
                        title: events[index]?.task || "Test Event",
                        extendedProps: 
                        {
                            project: events[index]?.project,
                            description: events[index]?.description,
                        },
                    },
                });
            });        
        }
    }, [events]);

    return (
        <div id={styles.mainWrap}>
            <div id={styles.eventsContainer}>
            <form id={styles.createEvent} onSubmit={e => submitCustomEvent(e)}>
                Create an Event
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
                <button type="submit">Add</button>
            </form>
            
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
                <div className={styles.externalDraggable} draggable={true}>
                    Test Event
                </div>
            </div>

        </div>
        <div id={styles.dataWrap}>
            <button onClick={setEvent}>Save Data</button>
            <button onClick={getEvent}>Load Data</button>
        </div>

        <FullCalendar
            ref={calRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            weekends={false}
        
            headerToolbar =
            {
                {
                    left: "title",
                    right: "prevYear prev customDayButton customTodayButton customMonthButton next nextYear",
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
                    customMonthButton:
                    {
                        text: "Month",
                        click: () => handleHeaderButtonClick("Month")
                    }
                }
            }

            dayHeaderClassNames={styles.calendarHeader}
            viewClassNames={styles.calView}
            slotMinTime="08:00:00"
            slotDuration="00:15:00"
            slotMaxTime="18:15:00"
            dayCellClassNames={styles.monthCells}

            events = { [] }
            editable = { true }
            droppable = { true }
            eventReceive =
            {   
                (info) =>
                {
                    console.log(info)
                }
            }
            dateClick = 
            {
                (info) => 
                {
                    switch(info.view.type)
                    {
                        case "dayGridMonth":
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