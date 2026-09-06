import React from 'react'
import LandingNavbar from '../../components/LandingNavbar.jsx'
import { Outlet } from 'react-router-dom'

const LandingLayout = () => {
  return (
    <div>
        <LandingNavbar/>
        <Outlet/>
    </div>
  )
}

export default LandingLayout