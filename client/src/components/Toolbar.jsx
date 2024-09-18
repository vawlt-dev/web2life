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
            
            <div id={styles.hamburgerMenuDropdown}>
                <span id={styles.OAuthGrid}>
                    <label>Connect with OAuth</label>
                    <button onClick={OAuthFunctions.connectOAuthGoogle}>
                        <img src={googleLogo} alt="Google"/>
                    </button>
                    <button onClick={OAuthFunctions.connectOAuthMicrosoft}>
                        <img src={microsoftLogo} alt="Microsoft"/> 
                    </button>
                    <button onClick={OAuthFunctions.connectOAuthGithub}>
                        <img src={githubLogo} alt="GitHub"/>
                    </button>
                    <button onClick={OAuthFunctions.connectOAuthSlack}>
                        <img src={slackLogo} alt="Slack"/>
                    </button>
                    <button onClick={OAuthFunctions.connectOAuthGitlab}>
                        <img src={gitlabLogo} alt="Gitlab"/>
                    </button>
                </span>
                <div id={styles.settingsWrap}>
                    <button onClick={() =>
                    {
                        let svg = document.getElementById(`${styles.settingsSVG}`);

                        svg.animate(
                            [
                                {
                                    transform: "rotate(0deg)"
                                },
                                { 
                                    transform: "rotate(360deg)"
                                }
                            ],
                            {
                                duration: 650,
                                easing: "ease"
                            }
                        )
                    }}>
                        Settings
                        <svg width={30} height={28} id={styles.settingsSVG}>
                            <path d="M24.55515,10.765600000000001c-0.44204999999999994-1.23255-1.1111-2.3865-1.9825500000000003-3.3991999999999996l2.09825-3.6662L18.426849999999998,0.1266l-2.09825,3.6662    
                                c-1.31535-0.23885-2.6486-0.23090000000000002-3.93515,0.01225L10.2692,0.15675L4.05175,3.77855l2.12425,3.6483c-0.4197,0.49450000000000005-0.80525,1.0286-1.14035,1.614    
                                c-0.33415,0.58385-0.59945,1.1868-0.8141,1.8006499999999999L0.0,10.8577l0.02645,7.195449999999999l4.2225-0.0159c0.44109999999999994,1.234,1.1097,2.38555,1.9818000000000002,3.39895    
                                l-2.09825,3.6659999999999995l6.2439,3.5736499999999998l2.09825-3.6662c1.3146,0.2384,2.6477,0.2324,3.9335999999999998-0.0132l2.12505,3.64895l6.21745-3.6216999999999997l-2.12435-3.6465000000000005    
                                c0.4197-0.49660000000000004,0.8069000000000001-1.03165,1.1410500000000001-1.61555c0.33504999999999996-0.58535,0.59945-1.18895,0.8149-1.80215l4.220000000000001-0.01515l-0.02645-7.195449999999999L24.55515,10.765600000000001z     
                                M20.68665,17.99835c-1.9867000000000001,3.4713000000000003-6.41145,4.674799999999999-9.88275,2.6881s-4.67475-6.411499999999999-2.68805-9.88275    
                                c1.9867000000000001-3.47125,6.41145-4.67475,9.8827-2.68805C21.46985,10.10235,22.6734,14.527099999999999,20.68665,17.99835z
                            "/>
                        </svg>
                    </button>
                </div>
               {/*  <div id={styles.themeSlider} onClick={() => setLightMode(!lightMode)}>
                    <div ref={sliderRef} id={styles.slider} className={lightMode ? "" : styles.active}>
                        {lightMode ? "🔆" : "🌙"}
                    </div>
                </div> */}
            </div>
            <div>
                <img src={logo} alt="" />
            </div>
        </header>
    );
};
