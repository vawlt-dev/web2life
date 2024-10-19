import { Views } from "react-big-calendar";
import styles from "./Toolbar.module.css";
import { useEffect, useRef, useState } from "react";
import logo from "../resources/images/logo.png";
import googleLogo from "../resources/images/google.png";
import microsoftLogo from "../resources/images/microsoft.png";
import githubLogo from "../resources/images/github.png";
import slackLogo from "../resources/images/slack.png";
import gitlabLogo from "../resources/images/gitlab.png";


export const Toolbar = ({ calendarFunctions, templates }) => 
{
    const oauthDropdownRef = useRef(null);
    const templatesDropdownRef = useRef(null);
    const hoursDropdownRef = useRef(null);

    const saveTemplateModalRef = useRef(null);
    const loadTemplateModalRef = useRef(null);
    const selectTemplateRef = useRef(null);
    
    const toggleDropdown = (dropdown) => 
    {
        if (dropdown === "oauth") 
        {
            if (oauthDropdownRef.current) 
            {
                oauthDropdownRef.current.classList.toggle(styles.active);
            }
            if (templatesDropdownRef.current) 
            {
                templatesDropdownRef.current.classList.remove(styles.active);
            }
            if(hoursDropdownRef.current)
            {
                hoursDropdownRef.current.classList.remove(styles.active)
            }
        } 
        else if (dropdown === "templates") 
        {
            if (templatesDropdownRef.current) 
            {
                templatesDropdownRef.current.classList.toggle(styles.active);
            }
            if (oauthDropdownRef.current) 
            {
                oauthDropdownRef.current.classList.remove(styles.active);
            }
            if(hoursDropdownRef.current)
            {
                hoursDropdownRef.current.classList.remove(styles.active)
            }
        }
        else
        {
            if(oauthDropdownRef.current)
            {
                oauthDropdownRef.current.classList.remove(styles.active);
            }
            if (templatesDropdownRef.current) 
            {
                templatesDropdownRef.current.classList.remove(styles.active);
            }
            if(hoursDropdownRef.current)
            {
                hoursDropdownRef.current.classList.toggle(styles.active)
            }
        }
    };

    useEffect(() => {
        const l = (e) => {
            if (
                oauthDropdownRef.current &&
                !oauthDropdownRef.current.contains(e.target)
            ) {
                oauthDropdownRef.current.classList.remove(styles.active);
            }
            if (
                templatesDropdownRef.current &&
                !templatesDropdownRef.current.contains(e.target)
            ) {
                templatesDropdownRef.current.classList.remove(styles.active);
            }
            if (
                hoursDropdownRef.current &&
                !hoursDropdownRef.current.contains(e.target)
            ) {
                hoursDropdownRef.current.classList.remove(styles.active);
            }

        };
        window.addEventListener("click", l);

        return () => {
            window.removeEventListener("click", l);
        };
    }, []);

    const back = () => 
    {
        calendarFunctions.handleNavigate("back");
    };

    const next = () => 
    {
        calendarFunctions.handleNavigate("next");
    };

    const goToToday = () => 
    {
        calendarFunctions.handleNavigate("today");
    };

    const changeView = (view) => 
    {
        calendarFunctions.setView(view);
    };

    return (
        <header>
            
            <div id={styles.menuWrap}>
                <svg 
                        id={styles.settingsSVG} 
                        width={30} 
                        height={30} 
                        viewBox="0 0 1024 1024"
                        onClick={() =>
                    {
                        
                        document.getElementById(styles.settingsSVG).animate
                        (
                            [
                                {
                                    transform: "rotate(0deg)"
                                },
                                {
                                    transform: "rotate(180deg)"
                                },
                                {
                                    transform: "rotate(0deg)"
                                }
                            ],
                            {
                                duration: 500,
                                easing: "linear"
                            }
                        ).finished.then(() =>
                        {
                            calendarFunctions.openSettings(true)
                        })
                                        
                    }}>
                        <path d="M512 661.994667q61.994667 0 106.005333-44.010667t44.010667-106.005333-44.010667-106.005333-106.005333-44.010667-106.005333 44.010667-44.010667
                                106.005333 44.010667 106.005333 106.005333 44.010667zM829.994667 554.005333l90.005333 69.994667q13.994667 10.005333 4.010667 28.010667l-85.994667
                                148.010667q-8 13.994667-26.005333 8l-106.005333-42.005333q-42.005333 29.994667-72 42.005333l-16 112q-4.010667 18.005333-20.010667 18.005333l-172.010667
                                0q-16 0-20.010667-18.005333l-16-112q-37.994667-16-72-42.005333l-106.005333 42.005333q-18.005333 5.994667-26.005333-8l-85.994667-148.010667q-10.005333-18.005333
                                4.010667-28.010667l90.005333-69.994667q-2.005333-13.994667-2.005333-42.005333t2.005333-42.005333l-90.005333-69.994667q-13.994667-10.005333-4.010667-28.010667l85.994667-148.010667q8-13.994667
                                26.005333-8l106.005333 42.005333q42.005333-29.994667 72-42.005333l16-112q4.010667-18.005333 20.010667-18.005333l172.010667 0q16 0 20.010667 18.005333l16 112q37.994667 16 72
                                42.005333l106.005333-42.005333q18.005333-5.994667 26.005333 8l85.994667 148.010667q10.005333 18.005333-4.010667 28.010667l-90.005333 69.994667q2.005333 13.994667 2.005333 42.005333t-2.005333 42.005333z"
                        />
                </svg>

                <div id={styles.leftMenuWrap}>
                    <button onClick={(e) =>
                    {
                        e.stopPropagation();
                        toggleDropdown("oauth")
                    }}>Accounts</button>
                    <button onClick={(e) =>
                    {
                        e.stopPropagation();
                        toggleDropdown("templates")
                    }}>Templates</button>
                    <button onClick={(e) =>
                    {
                        e.stopPropagation();
                        toggleDropdown("hours")
                    }}>Hours</button>
                </div>
                <div id={styles.navigationWrap}>
                    <button onClick={goToToday}>Today</button>
                    <button onClick={back}>Back</button>
                    <button onClick={next}>Next</button>
                </div>
            </div>


            <div id={styles.date}>
                <span>
                    {calendarFunctions.date.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                    })}
                </span>
            </div>
            <div id={styles.viewsWrapper}>
                <button style={calendarFunctions.view !== Views.DAY ? {borderColor: "transparent"} : null} 
                    onClick={() => changeView(Views.DAY)}>
                    Day
                </button>
                <button style={calendarFunctions.view !== Views.WEEK ? {borderColor: "transparent"} : null}
                    onClick={() => changeView(Views.WEEK)}>
                    Week
                </button>                    
                <button style={calendarFunctions.view !== Views.MONTH ? {borderColor: "transparent"} : null} 
                    onClick={() => changeView(Views.MONTH)}>
                    Month
                </button>
            </div>

            <div id={styles.OAuthGrid} ref={oauthDropdownRef}>
                <button onClick={() => (window.location.href = "https://127.0.0.1:8000/connect-source/google_calendar")}>
                    <img src={googleLogo} alt="Google" />
                    <label>Continue with Google</label>
                </button>
                <button onClick={() => (window.location.href = "https://127.0.0.1:8000/connect-source/outlook")}>
                    <img src={microsoftLogo} alt="Microsoft" />
                    <label>Continue with Microsoft</label>
                </button>
                <button onClick={() => (window.location.href = "https://127.0.0.1:8000/connect-source/github")}>
                    <img src={githubLogo} alt="GitHub" />
                    <label>Continue with GitHub</label>
                </button>
                <button onClick={() => (window.location.href = "https://127.0.0.1:8000/oauth/connect/slack")}>
                    <img src={slackLogo} alt="Slack" />
                    <label>Continue with Slack</label>
                </button>
                <button onClick={() => (window.location.href = "https://127.0.0.1:8000/connect-source/gitlab")}>
                    <img src={gitlabLogo} alt="Gitlab" />
                    <label>Continue with Gitlab</label>
                </button>
            </div>

            <div id={styles.templatesGrid} ref={templatesDropdownRef}>
                <button onClick={() =>
                {
                    saveTemplateModalRef.current.classList.add(styles.active);
                    templatesDropdownRef.current.classList.remove(styles.active)
                }}>
                    <label>Save as Template</label>
                </button>
                <button onClick={() =>
                {
                    loadTemplateModalRef.current.classList.add(styles.active)
                    templatesDropdownRef.current.classList.remove(styles.active)
                }}>
                    <label>Load Template</label>
                </button>
            </div>
            
            <div id={styles.hoursGrid} ref={hoursDropdownRef}>
                <label>
                    Total Hours for
                    {
                        calendarFunctions.view === Views.WEEK ? 
                        " Week" : 
                        calendarFunctions.view === Views.DAY ? 
                        " Day": " Month"
                    }:
                </label>
                <label>
                    {
                        `${calendarFunctions.hours} ` ? `${calendarFunctions.hours} ` : "0 "
                    }
                    {" "}
                    Hour
                    {
                        (calendarFunctions.hours === 0 || calendarFunctions.hours > 1) ? "s" : null
                    }
                </label>
                <button></button>
            </div>

            <div id={styles.saveTemplateModal} ref={saveTemplateModalRef} onClick={(e) => 
            {
                if(e.target === saveTemplateModalRef.current)
                {
                    saveTemplateModalRef.current.classList.remove(styles.active)
                }
            }
            }>
                <form onSubmit={ (e) => 
                {
                    e.preventDefault();
                    calendarFunctions.saveTemplate(e.target.templateName.value)
                    saveTemplateModalRef.current.classList.remove(styles.active);
                }}>
                    <div>
                        <label>Template Name</label>
                        <input type="text" name="templateName" required/>
                    </div>
                    <div>
                        <button type='button' onClick={() =>
                        {
                            saveTemplateModalRef.current.classList.remove(styles.active)
                        }}
                        >Cancel</button>
                        <button>Accept</button>
                    </div>
                </form>
            </div>

            <div id={styles.loadTemplateModal} ref={loadTemplateModalRef}>
                <div>
                    {
                        templates && templates.length > 0 ?
                        <select ref={selectTemplateRef}>
                            {
                                templates.map((template, index) =>(
                                    <option key={index} value={template.id}>{template.title}</option>
                                ))
                            }
                        </select>
                        :
                        <>No Templates yet</>
                    }
                    <div>
                        <button onClick={() => loadTemplateModalRef.current.classList.remove(styles.active)}>Cancel</button>
                        <button onClick={(e) =>
                        {
                            e.preventDefault();
                            calendarFunctions.loadTemplate(selectTemplateRef.current.value)
                        }}>Load Template</button>
                    </div>
                </div>
            </div>

           

            <div>
                <img src={logo} alt="" />
            </div>

        </header>
    );
};