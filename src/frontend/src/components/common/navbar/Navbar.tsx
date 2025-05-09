import { NavLink } from 'react-router';
import NavbarLogo from './NavbarLogo';
import { MdOutlineLogin } from 'react-icons/md';

export default function Navbar() {
    const authorUsername = 'lexst64';
    const repoName = 'simple-converter';
    const githubLink = `https://github.com/${authorUsername}/${repoName}`;

    return (
        <nav className="navbar">
            <NavLink to="/" style={{ color: 'white', textDecoration: 'none' }}>
                <NavbarLogo />
            </NavLink>
            <div className="navbar-link-container">
                <NavLink to="/">Home</NavLink>
                <a target="_blank" href={githubLink}>
                    Source code
                </a>
                <NavLink to="/signin">
                    Sign in
                    <MdOutlineLogin />
                </NavLink>
            </div>
        </nav>
    );
}
