import { NavLink } from 'react-router'

export default function Navbar() {
    return (
        <nav className='navbar'>
            <NavLink to='/' style={{color: 'white', textDecoration: 'none'}}>Simple Converter</NavLink>
            <div className={'navbar-link-container'}>
                <NavLink to='/' className={isActive => isActive ? 'active' : ''}>
                    Home
                </NavLink>
            </div>
        </nav>
    )
}
