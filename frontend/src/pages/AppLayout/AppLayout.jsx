import React from 'react'
// import LandingNavbar from '../../components/LandingNavbar/jsx'
import { Outlet } from 'react-router-dom'

const AppLayout = () => {
  return (
    <div>
        {/* <LandingNavbar/> */}
        <Outlet/>
    </div>
  )
}

export default AppLayout