import Navbar from './components/common/navbar/Navbar';
import { Routes, Route } from 'react-router';
import Home from './components/home/Home';
import OuterContainer from './components/common/OuterContainer';
import StatusBar from './components/common/statusbar/StatusBar';
import StatusProvider from './context/StatusProvider';
import { IconContext } from 'react-icons';
import { CSSProperties } from 'react';

export default function App() {
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
                        <Routes>
                            <Route index element={<Home />} />
                        </Routes>
                        <StatusBar />
                    </OuterContainer>
                </StatusProvider>
            </IconContext.Provider>
        </>
    );
}
