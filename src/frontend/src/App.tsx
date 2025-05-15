import Navbar from './components/common/navbar/Navbar';
import { Outlet, useNavigation } from 'react-router';
import OuterContainer from './components/common/OuterContainer';
import StatusBar from './components/common/statusbar/StatusBar';
import StatusProvider from './context/StatusProvider';
import { IconContext } from 'react-icons';
import { CSSProperties } from 'react';
import CircularLoader from './components/common/CircularLoader';

export default function App() {
    const navigation = useNavigation();
    const isNavigating = Boolean(navigation.location);

    const iconStyle: CSSProperties = {
        verticalAlign: 'middle',
        color: 'var(--icon-color)',
    };

    return (
        <>
            <Navbar />
            <IconContext.Provider value={{ style: iconStyle, size: '1.5em' }}>
                <StatusProvider>
                    <OuterContainer>
                        {isNavigating ? <CircularLoader /> : <Outlet />}
                        <StatusBar />
                    </OuterContainer>
                </StatusProvider>
            </IconContext.Provider>
        </>
    );
}
