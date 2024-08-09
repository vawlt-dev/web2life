import styles from "./Header.module.css"
import logo from "../resources/images/logo.png"
import { useEffect, useRef, useState } from "react"
export const Header = () =>
{
    const sliderRef = useRef(null);
    const [lightMode, setLightMode] = useState(localStorage['theme'] === "light");
    useEffect(() => 
    { 
        localStorage.setItem('theme', lightMode);        
        const event = new CustomEvent("themeChange", {detail: lightMode});
        window.dispatchEvent(event);
    },[lightMode])
    return(
        <header>
            <a href="/">
                <img src={logo} alt="webToLife"></img>
            </a>
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