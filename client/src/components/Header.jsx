import styles from "./Header.module.css"
import logo from "../resources/images/logo.png"
import { useEffect, useRef, useState } from "react"
export const Header = () =>
{
    const sliderRef = useRef(null);
    const [darkMode, setDarkMode] = useState(true);
    useEffect(() => 
    { 
        darkMode ? localStorage['theme'] = "dark" : localStorage['theme'] = "light"
    },[darkMode])
    return(
        <header>
            <a href="/">
                <img src={logo} alt="webToLife"></img>
            </a>
            <div id={styles.themeSlider} onClick={() => setDarkMode(!darkMode)}>
                <div ref={sliderRef} id={styles.slider} className={darkMode ? "" : styles.active}>
                    {
                        darkMode ? 
                        (
                            "🌙"
                        ) 
                        :
                        (
                            "🔆"
                        )
                        
                    }
                </div>
            </div>
        </header>
    )
}