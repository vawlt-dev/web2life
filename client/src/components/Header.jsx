import "./Header.module.css"
import logo from "../resources/images/logo.png"
export const Header = () =>
{
    return(
        <header>
            <a href="/">
                <img src={logo} alt="webToLife"></img>
            </a>
        </header>

    )
}