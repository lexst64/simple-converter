import { MdRebaseEdit } from 'react-icons/md';

export default function NavbarLogo() {
    return (
        <div className="logo non-selectable">
            <MdRebaseEdit className="logo-icon" />
            <span className="navbar-logo-name">Simple Converter</span>
        </div>
    );
}
