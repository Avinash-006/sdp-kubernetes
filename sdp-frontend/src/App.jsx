import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import NavBar from './Pages/NavBar.jsx'
// import './App.css'
import LandingPage from './Pages/LandingPage.jsx'
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <NavBar/>  
    </>
  )
}

export default App
