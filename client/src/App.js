import { useEffect, useRef, useState } from "react";
import { AppCalendar } from "./components/AppCalendar";
import styles from "./App.module.css";
import "./index.css";

export const App = () =>
{
    const calRef = useRef(null);
    const [events, setEvents] = useState([]);
    const [calendarEvents, setCalendarEvents] = useState([]);
    const [CSRFToken, setCSRFToken] = useState(null)

    const getEvents = () =>
    {
        //gets all user events
        fetch("/getEvents").then(res => 
        {
            if(res.ok)
            {
                return res.json()
            }
        })
        .then(data =>
        {
            setEvents(data.data);
           
        })
    }
    useEffect(() =>
    {
        /*
            this iterates over data.data (all of the events) by first destructuring 
            the event into its constituent properties, then, if the event has more than one time,
            it creates a new entry in the (temp) array with that time. if the time.length is 0 it 
            just appends what was originally passed in the destructure. 
            finally, both arrays are joined and returned as one array

            TLDR: this parses the data from the server so that an individual event is made for 
                  each event and its specific event times
        */
        
        setCalendarEvents
        (
            events.reduce((accumulator, event) => 
            {
                const { id, task, description, times } = event;
                const eventTimes = times.length > 0 
                ? times.map(time => (
                {
                    id,
                    title: task,
                    start: time.start,
                    end: time.end,
                    allDay: time.allDay,
                    description,
                })) 
                : 
                [{
                    id,
                    title: task,
                    start: times,
                    end: times,
                    allDay: times,
                    description,
                }];

            return [...accumulator, ...eventTimes];
            },[])
        )

    }, [events]);        

    useEffect(() =>
    {
        /*
            absolutely no idea why, but whenever the events array changes, the events in the 
            calendars internal state either get wiped or duplicated, so half the existing events
            disappear or multiply. 
            
            i think this has to do with the reference to the events array
            pointing to a shallow copy and the events in it somehow don't get transfered over when 
            the state updates??? 

            please manually set the events or the calendar gets confused and violently breaks
        */
        if(calRef.current)
        {
            const cApi = calRef.current.getApi();
            cApi.getEvents().forEach(event =>
            {
                event.remove()
            })
            calendarEvents.forEach(event =>
            {
                cApi.addEvent(
                {
                    id: event.id,
                    title: event.title,
                    start: event.start,
                    end: event.end,
                    allDay: event.allDay    
                })
            })
        }
    },[calendarEvents])

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

        window.addEventListener('themeChange', (e) =>
        {
            if (localStorage.getItem('theme') === "true")
            {
                document.documentElement.style.setProperty('--primaryColor', 'rgb(255, 255, 255)');
                document.documentElement.style.setProperty('--secondaryColor', 'rgb(240, 240, 255)')
                document.documentElement.style.setProperty('--textColor', 'black')
                document.documentElement.style.setProperty('--textColor-invertHover', 'black')
                document.documentElement.style.setProperty('--logoInvert', 'unset')
                document.documentElement.style.setProperty('--borderColor', 'rgba(150, 150, 150, 0.5)')
            }
            else
            {
                document.documentElement.style.setProperty('--primaryColor', 'rgb(35, 45, 60)')
                document.documentElement.style.setProperty('--secondaryColor', 'rgb(40, 50, 60)')
                document.documentElement.style.setProperty('--textColor', 'white')
                document.documentElement.style.setProperty('--textColor-invertHover', 'black')
                document.documentElement.style.setProperty('--logoInvert', 'hue-rotate(190deg) invert()')
                document.documentElement.style.setProperty('--borderColor', 'rgba(128, 128, 128, 0.1)')
                
            }
        })

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
    /* const deleteEvent = (event) =>
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
                'X-CSRFToken': CSRFToken
            },
            body: JSON.stringify(data)
        })
    }
    const removeEventTime = (info) =>
    {
        let data =
        {
            id: info.event.id,
            start: info.event.start,
            end: info.event.end,
            allDay: info.event.allDay
        }
        fetch("/deleteEventTime/", 
        {
            method: "POST",
            headers:
            {
                'X-CSRFToken': CSRFToken
            },
            body: JSON.stringify(data)
        }).then(res =>
        {
            if(res.ok)
            {
                console.log("Event time successfully removed")
                getEvents()
            }
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
    } */

    return (
        <div id={styles.mainWrap}>
            <AppCalendar/>
        </div>
    );
}