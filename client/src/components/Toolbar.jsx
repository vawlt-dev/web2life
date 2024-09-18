import { Views } from "react-big-calendar";
import styles from "./Toolbar.module.css";
import { useCallback, useEffect, useRef, useState } from "react";
import logo from "../resources/images/logo.png";
import googleLogo from "../resources/images/google.png"
import microsoftLogo from "../resources/images/microsoft.png"
import githubLogo from "../resources/images/github.png"
import slackLogo from "../resources/images/slack.png"
import gitlabLogo from "../resources/images/gitlab.png"

const DropDownButton = (props) => 
{
    return (
        <li className={styles.dropDownItem}>
        <button onClick={props.callback}>{props.text}</button>
        </li>
    );
};

export const Toolbar = ({OAuthFunctions, calendarFunctions}) => {
    const sliderRef = useRef(null);
    const [lightMode, setLightMode] = useState(localStorage['theme'] === "true");
    const [dropDownActive, setDropDownActive] = useState(false);
    const dropDownRef = useRef(null);

    const handleNonDropdownClick = useCallback((e) => 
    {
        if (dropDownRef.current && !dropDownRef.current.contains(e.target)) 
        {
            setDropDownActive(false);
        }
    }, []);

    useEffect(() => 
    {
        if (dropDownActive) 
        {
            window.addEventListener("click", handleNonDropdownClick);
        } 
        else 
        {
            window.removeEventListener("click", handleNonDropdownClick);
        }
        
        return () => 
        {
            window.removeEventListener("click", handleNonDropdownClick);
        };
    }, [dropDownActive, handleNonDropdownClick]);

    useEffect(() => 
    {
        localStorage.setItem('theme', lightMode);
        window.dispatchEvent(new CustomEvent("themeChange", { detail: lightMode }));
    }, [lightMode]);

    const back = () => 
    {
        console.log(calendarFunctions.view)
        calendarFunctions.handleNavigate('back')
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
           <div id={styles.hamburgerMenu} onClick={() =>
            {
                let menu = document.getElementById(`${styles.hamburgerMenuDropdown}`);
                menu.classList.contains(`${styles.active}`) ? menu.classList.remove(`${styles.active}`) : menu.classList.add(`${styles.active}`)
                
            }}>
                <svg viewBox="0 0 32 32" height={32} width={32}>
                    <rect x={1} y={1} width={30} height={30} fill="transparent" stroke="white" strokeWidth={1.25}rx={5.5} ></rect>
                    <line x1={6} x2={26} stroke="white" strokeWidth={1.25} y1={10} y2={10} strokeLinecap="round"></line>
                    <line x1={6} x2={26} stroke="white" strokeWidth={1.25} y1={16} y2={16} strokeLinecap="round"></line>
                    <line x1={6} x2={26} stroke="white" strokeWidth={1.25} y1={22} y2={22} strokeLinecap="round"></line>
                </svg>
            </div>

            <div id={styles.toolbarLeftButtonWrap}>
                <button onClick={goToToday}>Today</button>
                <button onClick={back}>Back</button>
                <button onClick={next}>Next</button>
            </div>

            <div id={styles.date}>
                <span>{calendarFunctions.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric'})}</span>
            </div>

            <div
                id={styles.dropDownWrapper}
                ref={dropDownRef}
                onClick={() => setDropDownActive(!dropDownActive)}
            >
                <button id={styles.dropDownButton}>
                    <div>
                        {calendarFunctions.view.toString().charAt(0).toUpperCase() +
                        calendarFunctions.view.toString().substr(1).toLowerCase()} 
                    </div>
                    <div>
                        <svg width={20} height={10} className={dropDownActive ? styles.active : ""}>
                            <polygon
                                points="5 1,15 1, 10 9"
                                fill="transparent"
                                stroke={lightMode ? "black" : "white"}
                                strokeWidth={2}
                                radius={2}
                            />
                        </svg>
                    </div>
                </button>
            
                <div
                    id={styles.dropDownMenu}
                    className={dropDownActive ? styles.active : ""}
                >
                    <DropDownButton callback={() => changeView(Views.DAY)} text={"Day"} />
                    <DropDownButton callback={() => changeView(Views.WEEK)} text={"Week"} />
                    <DropDownButton callback={() => changeView(Views.MONTH)} text={"Month"} />
                </div>
            </div>

            {/*  */}

            
            
            <div id={styles.hamburgerMenuDropdown}>
                <span id={styles.OAuthGrid}>
                    <button onClick={OAuthFunctions.connectOAuthGoogle}>
                        <img src={googleLogo} alt=""/>
                    </button>
                    <button onClick={OAuthFunctions.connectOAuthMicrosoft}>
                        <img src={microsoftLogo} alt=""/> 
                    </button>
                    <button onClick={OAuthFunctions.connectOAuthGithub}>
                        <img src={githubLogo} alt=""/>
                    </button>
                    <button onClick={OAuthFunctions.connectOAuthSlack}>
                        <img src={slackLogo} alt="" />
                    </button>
                    <button onClick={OAuthFunctions.connectOAuthGitlab}>
                        <img src={gitlabLogo} alt="" />
                    </button>
                </span>
                <div id={styles.themeSlider} onClick={() => setLightMode(!lightMode)}>
                    <div ref={sliderRef} id={styles.slider} className={lightMode ? "" : styles.active}>
                        {lightMode ? "🔆" : "🌙"}
                    </div>
                </div>
            </div>
            <div>
                <img src={logo} alt="" />
            </div>
        </header>
    );
};
