import styles from "./Header.module.css"
import logo from "../resources/images/logo.png"
import { useRef, useState } from "react"
export const Header = () =>
{
    const sliderRef = useRef(null);
    const [darkMode, setDarkMode] = useState(false);
    return(
        <header>
            <a href="/">
                <img src={logo} alt="webToLife"></img>
            </a>
            <div id={styles.themeSlider} onClick={() => setDarkMode(!darkMode)}>
                <div ref={sliderRef} id={styles.slider}/>
            </div>
        </header>

    )
}