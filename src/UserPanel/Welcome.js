import './Welcome.css'
import logo from './assets/logo.png'
import { Link } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'
const Welcome = () => {
    return (
        <div className='welcome-page'>
            <ThemeToggle />
            <div className="welcome-container">
                <div className="welcome-text">Welcome to</div>
                <div className="welcome-title"><img src={logo} alt=" Cafe" /></div>
                <div className="welcome-slogan">Where every bite feels right</div>
                <div className="welcome-cta">
                    <Link to="/categories" className="cta-button" role='button'>Explore Menu</Link>
                </div>
            </div>
        </div>
    )
}

export default Welcome