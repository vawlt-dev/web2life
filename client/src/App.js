import { useEffect, useRef, useState } from "react";
import { AppCalendar } from "./components/AppCalendar";
import styles from "./App.module.css";
import "./index.css";
import { SecondaryMenu } from "./components/SecondaryMenu";
import { Footer } from "./components/Footer";
import { Toolbar } from "./components/Toolbar";

import { momentLocalizer, Views } from 'react-big-calendar'
import moment from 'moment'

export const App = () =>
{
    const localizer = momentLocalizer(moment)
    const [CSRFToken, setCSRFToken] = useState(null)
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState([]);
    const [projects, setProjects] = useState([]);
    const [view, setView] = useState(Views.WEEK);
    const [date, setDate] = useState(new Date());
    const [OAuthData, setOAuthData] = useState({});
    const calRef = useRef(null);


    useEffect(() => 
    {
        const fetchGoogleData = async () => 
        {
            try 
            {
                const response = await fetch("https://127.0.0.1:8000/oauth/getGoogleEvents");
                if (!response.ok) throw new Error("Failed to fetch Google data.");
                const data = await response.json();
                setOAuthData(prevState => (
                    {
                        ...prevState,
                        google: data
                    })
                );
            } 
            catch (error) 
            {
                console.error("Error fetching Google data:", error);
            } 
            finally 
            {
                setLoading(false);
            }
        };
        fetchGoogleData();
    }, []);

  /*   useEffect(() => 
    {
        if (!loading) 
        {
            console.log(OAuthData);
        }
    }, [OAuthData, loading]);


    useEffect(() =>
    {
        console.log(events)
    },[events]);    
 */

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
    const getProjects = () =>
    {
        fetch("/getProjects").then( res =>
        {
            if(res.ok)
            {
                return res.json()
            }
        }).then(data =>
        {
            setProjects(data.data);
        })
    }
    const putEvent = async (event) =>
    {
        //append '/' to posts otherwise will reset to a GET request
        console.log(JSON.stringify(event))
        try 
        {
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
            }).then(() =>
            {
                getEvents()
            })
        } 
        catch (err) 
        {
            console.log(err)            
        }
    }
    const putProject = (project) =>
    {
        const data = 
        {
            project: project
        }
        fetch("/addProject/",
        {
            method: "POST",
            headers:
            {
                "X-CSRFToken": CSRFToken
            },
            body: JSON.stringify(data)
        }).then(res =>
        {
            if(res.ok)
            {
                console.log("Successfully added project")
            }
            else
            {
                console.log("Error adding project")
            }
        }).then(() =>
        {
            getProjects();
        })
    }

    const patchEvent = async (originalEvent, newEvent) =>
    {
        const data = 
        {
            originalEvent: originalEvent,
            newEvent: newEvent
        }
        fetch("updateEventTimes/",
        {
            method: "PATCH",
            headers:
            {
                'X-CSRFToken': CSRFToken
            },
            body: JSON.stringify(data)
        }).then(res =>
        {
            if(res.ok)
            {
                console.log("Successfully updated event time")
            }
            else
            {
                console.log("Error updating event times")
            }
        }).then(() =>
        {
            getEvents()
        })
    }
    const patchProject = async (originalProject, newProject) =>
    {

    }
    const deleteEvent = async (update) =>
    {
        const data = { id: update }
        fetch("deleteEvent/",
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
                console.log("Successfully deleted event")
            }
            else
            {
                console.log("Error with deleting event")
            }
            getEvents();
        })
    }
    const deleteProject = async(update) =>
    {
        const data = { title: update }
        fetch("deleteProject/",
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
                console.log("Successfully removed project")
            }
            else
            {
                console.log("Error with removing project")
            }
            getProjects();
        })
    }

    const handleNavigate = (action) =>
    {
        let tempDate = new Date(date);
        console.log(date)
        const main = document.querySelector('main');
        let x = 15;
        switch(action)
        {
            case 'back':
            {
                x *= -1;
                switch(view)
                {
                    case Views.MONTH:
                        tempDate.setMonth(date.getMonth() - 1);
                        break;
                    case Views.WEEK:
                        tempDate.setDate(date.getDate() - 7);
                        break;
                    case Views.DAY:
                        tempDate.setDate(date.getDate() - 1);
                        break;
                    default:
                        break;
                }
                break;
            }
            case 'next':
            {
                switch(view)
                {
                    case Views.MONTH:
                        tempDate.setMonth(date.getMonth() + 1);
                        break;
                    case Views.WEEK:
                        tempDate.setDate(date.getDate() + 7);
                        break;
                    case Views.DAY:
                        tempDate.setDate(date.getDate() + 1);
                        break;
                    default:
                        break;
                }
                break;
            }
            case 'today':
            {
                x = 0;
                tempDate = new Date();
                break;
            }
            default:
            {
                break;
            }
        }
        main.animate(
            [
                {
                    transform: `translateX(${x}px)`,
                },
                {
                    transform: "translateX(0px)",
                }
            ],
            {
                duration: 500,
                easing: "ease"
            }
        )
        main.animate(
            [
                {
                    opacity: 0.5

                },
                {
                    opacity: 1

                }
            ],
            {
                duration: 800,
                easing: "ease"
            }
        )
        setDate(tempDate)
    }

    //wrappers for web and calendar functions so we don't pass down 20 different props
    const webFunctions = 
    {
        getEvents,
        getProjects,
        putEvent,
        putProject,
        patchEvent,
        patchProject,
        deleteEvent,
        deleteProject
    }
    let addEventFromSecondaryMenu;
    const CalendarFunctions = 
    {
        handleNavigate,
        setDate,
        date,
        view,
        setView,
        addEventFromSecondaryMenu,
    }

   

    useEffect(() =>
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
        getProjects();
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
    return (        
        
        <div id={styles.mainWrap}>
            <Toolbar calendarFunctions={CalendarFunctions}/>
            <div id={styles.calendarWrap}>
                <SecondaryMenu localizer={localizer} calendarFunctions={CalendarFunctions}/>
                <AppCalendar 
                    calRef={calRef}
                    events={events} 
                    setEvents = {setEvents}
                    projects={projects}
                    setProjects={setProjects}
                    webFunctions = {webFunctions}
                    calendarFunctions={CalendarFunctions}
                    localizer={localizer}
                />
            </div>
            <Footer/>
        </div>
    
    );
}