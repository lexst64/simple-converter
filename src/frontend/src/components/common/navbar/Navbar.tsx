import { NavLink } from 'react-router';
import NavbarLogo from './NavbarLogo';
import { MdOutlineLogin } from 'react-icons/md';
import styled from 'styled-components';

const NavbarWrapper = styled.nav`
    display: flex;
    position: sticky;
    top: 0;
    z-index: 1;
    height: 50px;
    width: 100%;
    background-color: var(--primary-color);
    padding: 5px 15px;
    box-sizing: border-box;
    align-items: center;
    justify-content: space-between;
`;

const LinkContainer = styled.div`
    display: flex;
    gap: 10px;
    height: 100%;

    & a {
        display: flex;
        padding: 0 5px;
        gap: 2px;
        align-items: center;
        color: #ffffff;
        text-decoration: none;
        opacity: 0.85;
    }

    & a:hover {
        opacity: 1;
    }

    & a.active {
        font-weight: 500;
        opacity: 1;
    }
`;

const NavLinkLogo = styled(NavLink)`
    text-decoration: none;
`;

export default function Navbar() {
    const authorUsername = 'lexst64';
    const repoName = 'simple-converter';
    const githubLink = `https://github.com/${authorUsername}/${repoName}`;

    return (
        <NavbarWrapper>
            <NavLinkLogo to="/">
                <NavbarLogo />
            </NavLinkLogo>
            <LinkContainer>
                <NavLink to="/">Home</NavLink>
                <a target="_blank" href={githubLink}>
                    Source code
                </a>
                <NavLink to="/signin">
                    Sign in
                    <MdOutlineLogin />
                </NavLink>
            </LinkContainer>
        </NavbarWrapper>
    );
}
