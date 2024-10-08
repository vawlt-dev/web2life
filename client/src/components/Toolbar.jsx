import { Views } from "react-big-calendar";
import styles from "./Toolbar.module.css";
import { useRef, useState } from "react";
import logo from "../resources/images/logo.png";
import googleLogo from "../resources/images/google.png";
import microsoftLogo from "../resources/images/microsoft.png";
import githubLogo from "../resources/images/github.png";
import slackLogo from "../resources/images/slack.png";
import gitlabLogo from "../resources/images/gitlab.png";

const DropDownButton = (props) => {
    return (
        <li className={styles.dropDownItem}>
            <button onClick={props.callback}>{props.text}</button>
        </li>
    );
};

export const Toolbar = ({ calendarFunctions }) => 
{
    const [hamburgerMenuActive, setHamburgerMenuActive] = useState(false);
    const [dropDownActive, setDropDownActive] = useState(false);
    const dropDownRef = useRef(null);
    const hamburgerMenuRef = useRef(null);

    const addDropdownListener = (ref, setActive) => 
    {
        const handleNonMenuClick = (e) => 
        {
            if (ref.current && !ref.current.contains(e.target)) {
                ref.current.classList.remove(styles.active);
                setActive(false);
                window.removeEventListener("click", handleNonMenuClick);
            }
        };
        setTimeout(() => 
        {
            window.addEventListener("click", handleNonMenuClick);
        }, 0);
    };

    const toggleMenu = (ref, setActive, active, otherSetActive) => 
    {
        if (active) 
        {
            if (ref.current) 
            {
                ref.current.classList.remove(styles.active);
            }
            setActive(false);
        } 
        else 
        {
            otherSetActive(false);
            if (ref.current) 
            {
                ref.current.classList.add(styles.active);
            }
            setActive(true);
            addDropdownListener(ref, setActive);
        }
    };

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
            <div
                id={styles.hamburgerMenu}
                onClick={(e) => {
                    e.stopPropagation();
                    toggleMenu(
                        hamburgerMenuRef,
                        setHamburgerMenuActive,
                        hamburgerMenuActive,
                        setDropDownActive
                    );
                }}
            >
                <svg viewBox="0 0 32 32" height={32} width={32}>
                    <rect
                        x={1}
                        y={1}
                        width={30}
                        height={30}
                        fill="transparent"
                        stroke="white"
                        strokeWidth={1.25}
                        rx={5}
                    ></rect>
                    <line
                        x1={6}
                        x2={26}
                        stroke="white"
                        strokeWidth={1.25}
                        y1={10}
                        y2={10}
                        strokeLinecap="round"
                    ></line>
                    <line
                        x1={6}
                        x2={26}
                        stroke="white"
                        strokeWidth={1.25}
                        y1={16}
                        y2={16}
                        strokeLinecap="round"
                    ></line>
                    <line
                        x1={6}
                        x2={26}
                        stroke="white"
                        strokeWidth={1.25}
                        y1={22}
                        y2={22}
                        strokeLinecap="round"
                    ></line>
                </svg>
            </div>

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

            <div id={styles.toolbarLeftButtonWrap}>
                <button onClick={goToToday}>Today</button>
                <button onClick={back}>Back</button>
                <button onClick={next}>Next</button>
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

            <div
                id={styles.dropDownWrapper}
                onClick={(e) => {
                    toggleMenu(
                        dropDownRef,
                        setDropDownActive,
                        dropDownActive,
                        setHamburgerMenuActive
                    );
                }}
            >
                <button id={styles.dropDownButton}>
                    <div>
                        {calendarFunctions.view
                            .toString()
                            .charAt(0)
                            .toUpperCase() +
                            calendarFunctions.view
                                .toString()
                                .substr(1)
                                .toLowerCase()}
                    </div>
                    <div>
                        <svg
                            width={20}
                            height={10}
                            className={dropDownActive ? styles.active : ""}
                        >
                            <polygon
                                points="5 1,15 1, 10 9"
                                fill="transparent"
                                strokeWidth={2}
                                radius={2}
                            />
                        </svg>
                    </div>
                </button>

                <div
                    id={styles.dropDownMenu}
                    ref={dropDownRef}
                    onClick={(e) => e.stopPropagation()}
                >
                    <DropDownButton
                        callback={() => changeView(Views.DAY)}
                        text={"Day"}
                    />
                    <DropDownButton
                        callback={() => changeView(Views.WEEK)}
                        text={"Week"}
                    />
                    <DropDownButton
                        callback={() => changeView(Views.MONTH)}
                        text={"Month"}
                    />
                </div>
            </div>

            <div ref={hamburgerMenuRef} id={styles.hamburgerMenuDropdown}>
                <span id={styles.OAuthGrid}>
                    <label>Connect with OAuth</label>
                    <button onClick={() => (window.location.href = "https://127.0.0.1:8000/oauth/connect/google")}>
                        <img src={googleLogo} alt="Google" />
                    </button>
                    <button onClick={() => (window.location.href = "https://127.0.0.1:8000/oauth/connect/microsoft")}>
                        <img src={microsoftLogo} alt="Microsoft" />
                    </button>
                    <button onClick={() => (window.location.href = "https://127.0.0.1:8000/connect-source/github")}>
                        <img src={githubLogo} alt="GitHub" />
                    </button>
                    <button onClick={() => (window.location.href = "https://127.0.0.1:8000/oauth/connect/slack")}>
                        <img src={slackLogo} alt="Slack" />
                    </button>
                    <button onClick={() => (window.location.href = "https://127.0.0.1:8000/oauth/connect/gitlab")}>
                        <img src={gitlabLogo} alt="Gitlab" />
                    </button>
                </span>
            </div>

            <div>
                <img src={logo} alt="" />
            </div>
        </header>
    );
};