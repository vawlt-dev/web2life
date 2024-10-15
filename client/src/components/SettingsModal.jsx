import { React, useState, useEffect, useRef } from 'react'
import styles from "./SettingsModal.module.css"
import info from '../resources/images/info.svg'
export const SettingsModal = ({settingsOpen,
                               openSettings, 
                               preferences, 
                               setPreferences, 
                               colours,
                               setColours}) => 
{
    const [lightMode, setLightMode] = useState(localStorage['theme'] === "true");

    const [fromTime, setFromTime] = useState("12:30");
    const [toTime, setToTime] = useState("13:00");

    const breakLabelRef = useRef(null);
    const breakWrapRef = useRef(null);
    useEffect(() => 
    {
        localStorage.setItem('theme', lightMode);
        window.dispatchEvent(new CustomEvent("themeChange", { detail: lightMode }));
    }, [lightMode]);
    
    const debounce = (callback, delay) =>
    {
        let timer;
        return function(...args)
        {
            if(timer)
            {
                clearTimeout(timer);
            }
            timer = setTimeout(() => {
                callback.apply(this, args);
            }, delay);
        }
    }
    const debouncedSetPreferences = useRef(
        debounce((key, color) => 
        {
            setColours(prevColours => ({...prevColours, [key]: color}));
            setPreferences({ [`${key}Colour`]: color });
        }, 500)
    ).current;
    useEffect(() => 
    {
        return () => 
        {
            if (debouncedSetPreferences.cancel) 
            {
                debouncedSetPreferences.cancel();
            }
        };
    }, [debouncedSetPreferences]);

    return (
        
        <div id={styles.settingsModal} className={settingsOpen ? styles.active : null}>
            <div id={styles.topWrap}>
                <button onClick={() => {openSettings(false)}} >
                    <svg viewBox='0 0 512 512'>
                        <path d='M512 332.66H268.5v92.31c-.68 15.47-5.77 26.46-15.43 32.82-25.79 17.2-52.31-5.26-69.24-22.6L14.33 261.6c-19.11-17.28-19.11-41.93 0-59.21L188.71 24.42c16.06-16.39 40.56-34.09 64.36-18.21 9.66 6.35 14.75 17.34 15.43 32.81v92.31H512v201.33z1'/>
                    </svg>
                </button>
                <label>Settings</label>
            </div>

            <div id={styles.generalSettingsWrap}>
                <label> General Settings </label>
                <div id={styles.eventColourListWrap}>
                    <label>Event Colours</label>
                    <div>
                        <label>Your Events</label>
                        <input type='color' value={colours.local} 
                        onChange={(e) => 
                        {
                            debouncedSetPreferences("local", e.target.value)
                        }}
                        />
                    </div>
                    <div>
                        <label>Google Events</label>
                        <input type='color' value={colours.google}
                        onChange={(e) => 
                        {
                            debouncedSetPreferences("google", e.target.value)
                        }}
                        />
                    </div>
                    <div>
                        <label>Microsoft Events</label>
                        <input type='color' value={colours.microsoft}
                        onChange={(e) => 
                        {
                            debouncedSetPreferences("microsoft", e.target.value)
                        }}
                        />
                    </div>
                    <div>
                        <label>Github Events</label>
                        <input type='color' value={colours.github}
                        onChange={(e) => 
                        {
                            debouncedSetPreferences("github", e.target.value)
                        }}
                        />
                    </div>
                    <div>
                        <label>GitLab Events</label>
                        <input type='color' value={colours.gitlab}
                        onChange={(e) => 
                        {
                            debouncedSetPreferences("gitlab", e.target.value)
                        }}
                        />
                    </div>
                    <div>
                        <label>Slack Events</label>
                        <input type='color' value={colours.slack} onChange={(e) => 
                        {
                            debouncedSetPreferences("slack", e.target.value)
                        }}
                        />
                        
                    </div>
                </div>
                <div>
                    <div id={styles.themeWrapper}> 
                    <label>Theme</label>
                        <div id={styles.themeSlider} onClick={() => setLightMode(!lightMode)}>
                            <div id={styles.slider} className={lightMode ? "" : styles.active}>
                                {lightMode ? "🔆" : "🌙"}
                            </div>
                        </div> 
                    </div>
                </div>
            </div>

            <div id={styles.oauthSettingsWrap}>
                <label>OAuth Settings</label>
                
                <div id={styles.githubSettings}>
                    <label>GitHub Settings</label>
                    <div>
                        <form onSubmit={(e) =>
                        {
                            e.preventDefault();
                            setPreferences({"githubusername":e.target.elements.githubusername.value})
                        }}>
                            <label>Username</label>
                            <div>
                                <input name='githubusername' type='text' placeholder='Your GitHub Username' required value={preferences.githubusername}/>
                                <button>Save</button>
                            </div>
                        </form>
                    </div>
                    <div>
                        <form onSubmit={(e) =>
                        {
                            e.preventDefault()
                            setPreferences({"githubrepos": [e.target.elements.githubrepo.value]})
                        }}>
                            <label>Repositories</label>
                            <div>
                                <input type='text' placeholder='Repository Name (user/repo)' name='githubrepo' required/>
                                <button>
                                    Add
                                </button>
                            </div>
                        </form>
                    </div>
                    {
                        preferences.githubrepos && (
                            <div className={styles.repoWrap}>
                                {
                                    preferences.githubrepos.map((repo) => 
                                    (
                                        <div className={styles.repoEntry}>
                                            <label>{repo}</label>
                                            <button onClick={() => setPreferences({"removeGithub": repo})}>Remove</button>
                                        </div>
                                    ))
                                }
                            </div>
                        )
                    }
                </div>
                
                <div id={styles.gitlabSettings}>
                    <label>Gitlab Settings</label>
                    <div>
                        <form onSubmit={(e) =>
                        {
                            e.preventDefault();
                            setPreferences({"gitlabusername":e.target.elements.gitlabusername.value})
                        }}>
                            <label>Username</label>
                            <div>
                                <input name='gitlabusername' type='text' placeholder='Your Gitlab Username' required defaultValue={preferences.gitlabusername}/>
                                <button>Save</button>
                            </div>
                        </form>
                    </div>
                    <div>
                        <form onSubmit={(e) =>
                        {
                            e.preventDefault()
                            setPreferences({"gitlabrepos": [e.target.elements.gitlabrepo.value]})
                        }}>
                            <label>Repositories</label>
                            <div>
                                <input type='text' placeholder='Project ID' name='gitlabrepo' required/>
                                <button>
                                    Add
                                </button>
                            </div>
                        </form>
                    </div>
                    {
                        preferences.gitlabrepos && (
                            <div className={styles.repoWrap}>
                                {
                                    preferences.gitlabrepos.map((repo) => 
                                    (
                                        <div className={styles.repoEntry}>
                                            <label>{repo}</label>
                                            <button onClick={() => setPreferences({"removeGitlab": repo})}>Remove</button>
                                        </div>
                                    ))
                                }
                            </div>
                        )
                    }
                </div>
            </div>            
            <div id={styles.statisticSettingsWrap}>
                <label>Time Statistic Settings</label>
                <div id={styles.statisticSettings}>
                    <div id={styles.breakLabelWrap}>
                        <label>
                            Break Times 
                        </label>
                        <div id={styles.tooltip}>
                            <img alt='' src={info} onMouseOver={() =>
                            {
                                if(breakLabelRef)
                                {
                                    breakLabelRef.current.classList.add(styles.active);
                                }
                            }}
                            onMouseLeave={() =>
                            {
                                if(breakLabelRef)
                                {
                                    breakLabelRef.current.classList.remove(styles.active)
                                }
                            }}/>
                            <label ref={breakLabelRef}>
                                Hours outside of these times will be counted towards your final time statistics
                            </label>
                        </div>
                    </div>

                    <div id={styles.breakWrap} ref={breakWrapRef}>
                        <div id={styles.break}>
                            <form onSubmit=
                            {
                                (e) => 
                                {
                                    e.preventDefault()
                                    console.log(fromTime, toTime)
                                    setPreferences(
                                    {
                                        "break":
                                        {
                                            from: fromTime, 
                                            to: toTime
                                        }
                                    })
                                    
                                }
                            }>
                                <div>
                                    <label>From</label>
                                    <input type='time' value={fromTime} name='from' onChange={(e) => setFromTime(e.target.value)}
                                        onBlur={() =>
                                        {
                                            if(toTime < fromTime)
                                            {
                                                setToTime(fromTime);
                                            }
                                        }}/>
                                    <label>To</label>
                                    <input type='time' value={toTime} name='to' onChange={(e) => setToTime(e.target.value)}
                                        onBlur={() =>
                                        {
                                            if(toTime < fromTime)
                                            {
                                                setToTime(fromTime);
                                            }
                                        }}/>
                                </div>
                                <div id={styles.addButtonWrap}>
                                    <button>Save Break Time</button>
                                </div>
                            </form>
                        </div>
                    </div>

                </div>            
            </div>
        </div>
        
    )
}
