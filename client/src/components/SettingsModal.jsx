import { React, useState, useEffect } from 'react'
import styles from "./SettingsModal.module.css"

export const SettingsModal = ({settingsOpen,
                               openSettings, 
                               preferences, 
                               setPreferences, 
                               colours,
                               setColours}) => 
{
    const [lightMode, setLightMode] = useState(localStorage['theme'] === "true");

    useEffect(() => 
    {
        localStorage.setItem('theme', lightMode);
        window.dispatchEvent(new CustomEvent("themeChange", { detail: lightMode }));
    }, [lightMode]);
    useEffect(() =>
    {
        console.log(preferences)
    }, [preferences])

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

            {
                // needa find a way to set colour other the onchange listener: sends tens of requests with each colour change
            }
            <div id={styles.generalSettingsWrap}>
                <label> General Settings </label>
                <div id={styles.eventColourListWrap}>
                    <label>Event Colours</label>
                    <div>
                        <label>Your Events</label>
                        <input type='color' value={colours.local} 
                        onChange={(e) => 
                        {
                            setColours({...colours, local: e.target.value});
                            setPreferences({"localColour": e.target.value})
                        }}
                        onMouseUp={(e) => setPreferences({ localColour: e.target.value })}
                        />
                    </div>
                    <div>
                        <label>Google Events</label>
                        <input type='color' value={colours.google}
                        onChange={(e) => 
                        {
                            setColours({...colours, google: e.target.value});
                            setPreferences({"googleColour": e.target.value})
                        }}
                        />
                    </div>
                    <div>
                        <label>Microsoft Events</label>
                        <input type='color' value={colours.microsoft}
                        onChange={(e) => 
                        {
                            setColours({...colours, microsoft: e.target.value});
                            setPreferences({"microsoftColour": e.target.value})
                        }}
                        />
                    </div>
                    <div>
                        <label>Github Events</label>
                        <input type='color' value={colours.github}
                        onChange={(e) => 
                        {
                            setColours({...colours, github: e.target.value});
                            setPreferences({"githubColour": e.target.value})
                        }}
                        />
                    </div>
                    <div>
                        <label>GitLab Events</label>
                        <input type='color' value={colours.gitlab}
                        onChange={(e) => 
                        {
                            setColours({...colours, gitlab: e.target.value});
                            setPreferences({"gitlabColour": e.target.value})
                        }}
                        />
                    </div>
                    <div>
                        <label>Slack Events</label>
                        <input type='color' value={colours.slack} onChange={(e) => 
                        {
                            setColours({...colours, slack: e.target.value});
                            setPreferences({"slackColour": e.target.value})
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
                                <input name='githubusername' type='text' placeholder='Your GitHub Username' required defaultValue={preferences.githubusername}/>
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
        </div>
        
    )
}
