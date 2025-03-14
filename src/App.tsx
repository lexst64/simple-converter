import Navbar from './components/common/Navbar'
import { Routes, Route } from 'react-router'
import Home from './components/home/Home'
import ContentContainer from './components/common/ContentContainer'

export default function App() {
  return (
    <>
      <Navbar />
      <ContentContainer>
        <Routes>
          <Route index element={<Home />} />
        </Routes>
      </ContentContainer>
    </>
  )
}
