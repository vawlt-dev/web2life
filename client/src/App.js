import { useEffect, useRef, useState } from "react";
import { AppCalendar } from "./components/AppCalendar";
import styles from "./App.module.css";
import "./index.css";
import { SecondaryMenu } from "./components/SecondaryMenu";
import { Footer } from "./components/Footer";
import { Toolbar } from "./components/Toolbar";

import { momentLocalizer, Views } from 'react-big-calendar'
import moment from 'moment'
import { SettingsModal } from "./components/SettingsModal";

export const App = () =>
{
    moment.updateLocale('en',
    {
        week:
        {
            dow: 1,
        }
    })
    const localizer = momentLocalizer(moment)
    const [breakTime, setBreakTime] = useState(null);    
    const [CSRFToken, setCSRFToken] = useState(null)
    const [initialLoad, setInitialLoad] = useState(true);
    const [progress, setProgress] = useState(
    {
        loading: true,
        percent: 0,
    });

    const [colours, setColours] = useState
    (
        {
            local: "#274da5",
            google: "#2775a5",
            microsoft: "#27a596",
            github:"#42368b",
            gitlab:"#e34124",
            slack: "#481449"
        }
    ) 

    const [events, setEvents] = useState([]);
    const [templates, setTemplates] = useState(null)
    const [activeEvents, setActiveEvents] = useState
    (
        {
            localEvents: true,
            importedEvents: true,
            googleEvents: true,
            microsoftEvents: true,
            githubEvents: true,
            slackEvents: true,
            gitlabEvents: true,
        }
    )
    const [projects, setProjects] = useState([]);
    const [userPreferences, setUserPreferences] = useState({});
    const [settingsOpen, openSettings] = useState(false);
    const [view, setView] = useState(Views.WEEK);
    const [date, setDate] = useState(new Date());
    const [hours, setHours] = useState(0);
    const calRef = useRef(null);

    const filteredEvents = events.filter(event => 
    {
        if (event.resourceId === 'localEvents') 
        {
            return activeEvents.localEvents;
        } 
        else if (event.resourceId === 'importedEvents') 
        {
            switch (event.source) 
            {
                case 'google':
                    return activeEvents.googleEvents;
                case 'microsoft':
                    return activeEvents.microsoftEvents;
                case 'github':
                    return activeEvents.githubEvents;
                case 'slack':
                    return activeEvents.slackEvents;
                case 'gitlab':
                    return activeEvents.gitlabEvents;
                default:
                    return true;
            }
        }
        return true;
    });
    ////////////
    // EVENTS //
    ////////////
    const getEvents = async () => 
    {
        try {
            setProgress({ loading: true, percent: 0 });

            const results = await Promise.allSettled([
                fetch("/getEvents").then((res) => (res.ok ? res.json() : [])),
                fetch("https://127.0.0.1:8000/oauth/getGoogleCalendarEvents").then((res) => (res.ok ? res.json() : [])),
                fetch("https://127.0.0.1:8000/oauth/getGmailMessages").then((res) => (res.ok ? res.json() : [])),
                fetch("https://127.0.0.1:8000/oauth/getOutlookMessages").then((res) => (res.ok ? res.json() : [])),
                fetch("https://127.0.0.1:8000/oauth/getMicrosoftCalendarEvents").then((res) => (res.ok ? res.json() : [])),
                fetch("https://127.0.0.1:8000/import-events/github").then((res) => (res.ok ? res.json() : [])),
                fetch("https://127.0.0.1:8000/import-events/gitlab").then((res) => (res.ok ? res.json() : [])),
                fetch("https://127.0.0.1:8000/oauth/getSlackEvents").then((res) => (res.ok ? res.json() : [])),
            ]);

            setProgress({ loading: true, percent: 50 });

            const localEvents = results[0].status === "fulfilled" ? results[0].value?.data || [] : [];
            const googleCalendarEvents = results[1].status === "fulfilled" ? results[1].value?.data || [] : [];
            const gmailNotifications = results[2].status === "fulfilled" ? results[2].value?.data || [] : [];
            const outlookNotifications = results[3].status === "fulfilled" ? results[3].value?.data || [] : [];
            const microsoftCalendarEvents = results[4].status === "fulfilled" ? results[4].value?.data || [] : [];
            const githubNotifications = results[5].status === "fulfilled" ? results[5].value?.data || [] : [];
            const gitlabNotifications = results[6].status === "fulfilled" ? results[6].value?.data || [] : [];
            const slackNotifications = results[7].status === "fulfilled" ? results[7].value?.data || [] : [];

            const normalizeEventDates = (event) => ({
                ...event,
                start: event.start instanceof Date ? event.start : new Date(event.start),
                end: event.end instanceof Date ? event.end : new Date(event.end),
            });
            
            setEvents([
                ...localEvents.map((event) => normalizeEventDates({
                    ...event,
                    resourceId: "localEvents",
                })),
                ...googleCalendarEvents.map((event) => normalizeEventDates({
                    ...event,
                    start: new Date(event.start),
                    end: new Date(event.end),
                    resourceId: "importedEvents",
                    source: "google",
                })),
                ...microsoftCalendarEvents.map((event) => normalizeEventDates({
                    ...event,
                    start: new Date(event.start_time),
                    end: new Date(event.end_time),
                    resourceId: "importedEvents",
                    source: "microsoft",
                })),
                ...outlookNotifications.map((event) => normalizeEventDates({
                    ...event,
                    title: "Outlook Notification",
                    start: new Date(event.start),
                    end: new Date(event.end),
                    resourceId: "importedEvents",
                    source: "microsoft",
                })),
                ...gitlabNotifications.map((event) => normalizeEventDates({
                    ...event,
                    title: "Gitlab Notification",
                    start: new Date(event.start),
                    end: new Date(event.end),
                    resourceId: "importedEvents",
                    source: "gitlab",
                })),
                ...slackNotifications.map((event) => normalizeEventDates({
                    ...event,
                    title: "Slack Notification",
                    start: new Date(Math.floor(parseFloat(event.time)) * 1000),
                    end: new Date(Math.floor(parseFloat(event.time)) * 1000 + 3600000),
                    resourceId: "importedEvents",
                    source: "slack",
                })),
                ...githubNotifications.map((event) => normalizeEventDates({
                    ...event,
                    title: "Github Notification",
                    start: new Date(event.start),
                    end: new Date(event.end),
                    resourceId: "importedEvents",
                    source: "github",
                })),
                ...gmailNotifications.map((event) => normalizeEventDates({
                    ...event,
                    //title: "Google Notification",
                    //start: new Date(notification.date),
                    //end: new Date(new Date(notification.date).getTime() + 3600000),
                    resourceId: "importedEvents",
                    source: "google",
                })),
            ]);

            setProgress({ loading: false, percent: 100 });
            setInitialLoad(false);
        } 
        catch (e) 
        {
            console.log(e);
        }
    };

    useEffect(() => 
    {
        //hour calculations
        if (events.length === 0) return;

        let start, end;

        switch (view) 
        {
            case Views.WEEK:
                start = new Date(date);
                start.setDate(start.getDate() - start.getDay() + 1);
                start.setHours(0, 0, 0, 0);

                end = new Date(start);
                end.setDate(start.getDate() + 6);
                end.setHours(23, 59, 59, 999);
                break;

            case Views.DAY:
                start = new Date(date);
                start.setHours(0, 0, 0, 0);

                end = new Date(date);
                end.setHours(23, 59, 59, 999);
                break;

            case Views.MONTH:
                start = new Date(date.getFullYear(), date.getMonth(), 1);
                start.setHours(0, 0, 0, 0);

                end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                end.setHours(23, 59, 59, 999);
                break;

            default:
                return;
        }

        const filteredEvents = events.filter((event) => 
        {
            const eventStart = new Date(event.start);
            return eventStart >= start && eventStart <= end;
        });

        if (filteredEvents.length === 0) 
        {
            setHours(0);
            return;
        }

        const sorted = filteredEvents
            .map((event) => ({
                start: new Date(event.start),
                end: new Date(event.end),
            }))
            .sort((a, b) => a.start - b.start);

        const merged = [];
        let current = sorted[0];

        for (let i = 1; i < sorted.length; i++) 
        {
            const event = sorted[i];

            if (event.start <= current.end) 
            {
                current.end = new Date(Math.max(current.end, event.end));
            } 
            else 
            {
                merged.push(current);
                current = event;
            }
        }
        merged.push(current);

        const totalMinutes = merged.reduce((total, range) => 
        {
            const durationMinutes = (range.end - range.start) / (1000 * 60);
            return total + durationMinutes;
        }, 0);

        setHours((totalMinutes / 60).toFixed(2));
    }, [events, view, date]);


    const putEvent = async (event) =>
    {
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

    const patchEvent = async (originalEvent, newEvent) => 
    {
        const data = 
        {
            originalEvent: originalEvent,
            newEvent: newEvent,
        };

        try 
        {
            const response = await fetch("patchEvent/", 
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": CSRFToken,
                },
                body: JSON.stringify(data),
            });

            if (response.ok) 
            {
                console.log("Successfully updated event time");
            }
            else 
            {
                console.error("Error updating event times, status:", response.status, response.statusText);
                const errorText = await response.text();
                console.error("Server response:", errorText);
            }
        } 
        catch (err) 
        {
            console.error("Network error or request failed:", err);
        } 
        finally 
        {
            getEvents();
        }
    };

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

    //////////////
    // PROJECTS //
    //////////////
    
  
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

    /////////////////
    // PREFERENCES //
    /////////////////

    const getPreferences = async () => 
    {
        try 
        {
            const res = await fetch("/getPreferences");
            if (res.ok) 
            {
                await res.json().then(data =>
                {
                    setUserPreferences(
                    {
                        ...data,
                        githubrepos: data.githubrepos || [],
                        gitlabrepos: data.gitlabrepos || [],
                    })

                    if (
                        data.localColour ||
                        data.googleColour ||
                        data.microsoftColour ||
                        data.githubColour ||
                        data.gitlabColour ||
                        data.slackColour
                    ) 
                    {
                        setColours({
                            local: data.localColour || "#274da5",
                            google: data.googleColour || "#2775a5",
                            microsoft: data.microsoftColour || "#27a596",
                            github: data.githubColour || "#42368b",
                            gitlab: data.gitlabColour || "#e34124",
                            slack: data.slackColour || "#481449",
                        });
                    }
                    if(data.break)
                    {
                        setBreakTime({
                            start: data.break.from,
                            end: data.break.to
                        })
                    }
                });
            }
        } 
        catch (err)
        {
            console.error("Failed to fetch preferences:", err);
        }
    };
    
    const setPreferences = async (data) => 
    {
        console.log(data)
        try 
        {
            const token = await getCSRFToken();
            await fetch("/setPreferences/", 
            {
                method: 'POST',
                headers: 
                {
                    'X-CSRFToken': token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            }).then(res =>
            {
                if (res.ok) 
                {
                    getPreferences();
                } 
            })
            
        } 
        catch (err) 
        {
            console.error("Error setting preferences:", err);
        }
    };

    ///////////////
    // TEMPLATES //
    ///////////////
    const saveTemplate = async (name) =>
    {
        const data =
        {
            view: view,
            date: date,
            name: name
        }
        await fetch("/setTemplate/",
        {
            method: "POST",
            headers:
            {
                'X-CSRFToken': CSRFToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }).then(res =>
        {
            if(res.ok)
            {
                console.log("Successfully saved template")
            }
            else
            {
                console.log("Error saving template")
            }
        })
    }
    const loadTemplate = async (template) =>
    {
        await fetch("/loadTemplate/",
        {
            method: "POST",
            headers: 
            {
                "Content-Type": 'application/json',
                "X-CSRFToken": CSRFToken
            },
            body: JSON.stringify(template)
        }).then(res =>
        {
            if(res.ok)
            {
                res.json().then(data =>
                {
                    setEvents(data.data);
                    console.log("Loaded template successfully")
                })
            }
            else
            {
                console.log("Error loading template")
            }
        })
    }
    
    const getTemplates = async () =>
    {
        await fetch("/getTemplates").then(res =>
        {
            if(res.ok)
            {
                res.json().then(data =>
                {
                    setTemplates(data.data);
                })

            }
            else
            {
                console.log("Error getting templates")
            }
        })
    }
    useEffect(() =>
    {
        console.log(templates)
    }, [templates])
    const handleNavigate = (action) =>
    {
        let tempDate = new Date(date);
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

    //wrapper objects so we don't pass down 20 different props 
    const webFunctions = 
    {
        getEvents,
        getProjects,
        putEvent,
        putProject,
        patchEvent,
        deleteEvent,
        deleteProject
    }
    let addEventFromSecondaryMenu;
    const calendarFunctions = 
    {
        handleNavigate,
        setDate,
        date,
        view,
        hours,
        setView,
        addEventFromSecondaryMenu,
        openSettings,
        saveTemplate,
        loadTemplate,
    }
    const filteringFunctions = 
    {
        activeEvents,
        setActiveEvents,
    }
    const getCSRFToken = async () => 
    {
        try 
        {
            const response = await fetch("/getCsrfToken/", 
            {
                method: 'GET'
            });

            if (response.ok) 
            {
                const data = await response.json();
                if (data['csrf-token']) {
                    setCSRFToken(data['csrf-token']);
                    return data['csrf-token'];
                } 
                else 
                {
                    throw new Error("CSRF token not found in response");
                }
            } 
            else 
            {
                throw new Error("Failed to fetch CSRF token");
            }
        }
        catch (error) 
        {
            console.error("Error fetching CSRF token:", error);
        }
    };
    //ON PAGE LOAD FUNCTION
    useEffect(() =>
    {
        getCSRFToken();
        getEvents();
        getTemplates();
        getProjects();  
        getPreferences();
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

    // Main render
    return (        
        
        <div id={styles.mainWrap}>
            
            <SettingsModal 
                settingsOpen={settingsOpen} 
                openSettings={openSettings} 
                setPreferences={setPreferences}
                preferences={userPreferences}
                colours={colours}
                setColours={setColours}
            />

            <Toolbar calendarFunctions={calendarFunctions} templates={templates}/>
            <div id={styles.calendarWrap}>
                <SecondaryMenu 
                    localizer={localizer} 
                    calendarFunctions={calendarFunctions} 
                    filteringFunctions={filteringFunctions}
                    colours={colours}
                />
                
                <AppCalendar 
                    calRef={calRef}
                    events={filteredEvents} 
                    setEvents = {setEvents}
                    projects={projects}
                    setProjects={setProjects}
                    webFunctions = {webFunctions}
                    calendarFunctions={calendarFunctions}
                    colours={colours}
                    localizer={localizer}
                />
            </div>
            <Footer/>
        </div>
    
    );
}