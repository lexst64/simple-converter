import Navbar from './components/common/navbar/Navbar'
import { Routes, Route } from 'react-router'
import Home from './components/home/Home'
import OuterContainer from './components/common/OuterContainer'
import StatusBar from './components/common/statusbar/StatusBar'
import StatusProvider from './context/StatusProvider'

export default function App() {
  return (
    <>
      <Navbar />
      <StatusProvider>
        <OuterContainer>
          <Routes>
            <Route index element={<Home />} />
          </Routes>
          <StatusBar />
        </OuterContainer>
      </StatusProvider>
    </>
  )
}
