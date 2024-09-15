import { useEffect, useState } from "react";
import { AppCalendar } from "./components/AppCalendar";
import { useNavigate } from 'react-router-dom';
import styles from "./App.module.css";
import "./calendarStyles.css"
import "./index.css";

export const App = () =>
{
    const [events, setEvents] = useState([]);
    const [projects, setProjects] = useState([]);
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
            getEvents();
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

    }
    const deleteProject = async(update) =>
    {

    }
    const connectOAuthGoogle = () =>
    {
        window.location.href = "https://127.0.0.1:8000/oauth/connect/google"
    }
    const connectOAuthGithub = () =>
    {
        window.location.href = "https://127.0.0.1:8000/oauth/connect/github"
    }
    const connectOAuthSlack = () =>
    {
        window.location.href = "https://127.0.0.1:8000/oauth/connect/slack"
    }
    const connectOAuthGitlab = () =>
    {
        window.location.href = "https://127.0.0.1:8000/oauth/connect/gitlab"
    }
    const connectOAuthMicrosoft = () =>
    {
        window.location.href = "https://127.0.0.1:8000/oauth/connect/microsoft"
    }

    //wrappers for web and oauth functions so we don't pass down 20 different props
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
    const OAuthFunctions = 
    {
        connectOAuthGoogle,
        connectOAuthGithub,
        connectOAuthSlack,
        connectOAuthGitlab,
        connectOAuthMicrosoft
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
            
            <AppCalendar 
                eventsArray={events} 
                projectsArray={projects}
                webFunctions = {webFunctions}
                OAuthFunctions={OAuthFunctions}
            />
        </div>
    
    );
}