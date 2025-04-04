import { NavLink } from 'react-router'
import NavbarLogo from './NavbarLogo'

export default function Navbar() {
    return (
        <nav className='navbar'>
            <NavLink to='/' style={{color: 'white', textDecoration: 'none'}}>
                <NavbarLogo />
            </NavLink>
            <div className='navbar-link-container'>
                <NavLink to='/'>Home</NavLink>
                <NavLink to='/signin'>Sign in<span className="material-symbols-outlined">login</span></NavLink>
            </div>
        </nav>
    )
}
