import { Views } from "react-big-calendar"
import styles from "./Toolbar.module.css"
import { useCallback, useEffect, useRef, useState } from "react"
import logo from "../resources/images/logo.png"

const DropDownButton = (props) =>
{
    return(
        <li className={styles.dropDownItem}>
            <button onClick={props.callback}>{props.text}</button>
        </li>
    )
}

export const Toolbar = (toolbar) =>
{
    const sliderRef = useRef(null);
    const [lightMode, setLightMode] = useState(localStorage['theme'] === "light")
    const [dropDownActive, setDropDownActive] = useState(false);

    const handleNonDropdownClick = useCallback((e) =>
    {
        if(e.target.id !== styles.dropDownMenu &&
            e.which !== 3 &&
            e.target.tagName !== "BUTTON")
        {
            setDropDownActive(false);
        }
    }, [])

    useEffect(() =>
    {
        if(dropDownActive)
        {
            window.addEventListener("mousedown", handleNonDropdownClick)
        }
        else
        {
            window.removeEventListener("mousedown", handleNonDropdownClick)
        }
        return () => document.removeEventListener("mousedown", handleNonDropdownClick)
    }, [dropDownActive, handleNonDropdownClick])

    useEffect(() =>
    {
        localStorage.setItem('theme', lightMode);
        window.dispatchEvent(new CustomEvent("themeChange", {detail: lightMode}))
    }, [lightMode])
    
    const back = () =>
    {
        toolbar.onNavigate('PREV')
    }
    const next = () =>
    {
        toolbar.onNavigate("NEXT")
    }
    const goToToday = () =>
    {
        toolbar.onNavigate("TODAY")
    }
    const changeView = (view) =>
    {
        toolbar.onView(view)    
    }
    
    
    return(
        <header>
            <div>
                <img src={logo} alt=""/>
            </div>
           
            <div>
                <button onClick={goToToday}>Today</button>
                <button onClick={back}>Back</button>
                <button onClick={next}>Next</button>
            </div>
            
            <div id={styles.date}>
                <span>{toolbar.label}</span>
            </div>
            

            <div id={styles.dropDownWrapper}>
                <button id={styles.dropDownButton} onClick={() => setDropDownActive(!dropDownActive)}>
                <div>{(toolbar.view.toString().charAt(0).toUpperCase() + toolbar.view.toString().substr(1).toLowerCase())}</div>
                <div>
                
                    <svg width={20} height={20} >
                        <polygon points="1 5,19 5, 10 17" fill="transparent" stroke={lightMode ? "black" : "white"} strokeWidth={2} radius={2}/>
                        
                    </svg>

                </div>

                </button>
                <div id={styles.dropDownMenu} className={dropDownActive ? styles.active : ""}>
                    <DropDownButton callback={() => changeView(Views.DAY)} text={"Day"}/>
                    <DropDownButton callback={() => changeView(Views.WEEK)} text={"Week"}/>
                    <DropDownButton callback={() => changeView(Views.MONTH)} text={"Month"}/>
                </div>
            </div>

            <div id={styles.addEventButtonWrap}>
                <button>+</button>
            </div>

            <div id={styles.themeSlider} onClick={() => setLightMode(!lightMode)}>
                <div ref={sliderRef} id={styles.slider} className={lightMode ? "" : styles.active}>
                    {
                        lightMode ? 
                        (
                            "🔆"
                        ) 
                        :
                        (
                            "🌙"
                        )
                        
                    }
                </div>
            </div>
        </header>
    )
}