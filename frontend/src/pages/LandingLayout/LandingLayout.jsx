import React from 'react'
import LandingNavbar from '../../components/LandingNavbar.jsx'
import { Outlet } from 'react-router-dom'

const LandingLayout = () => {
  return (
    <div>
      <div className='fixed top-0 z-100'>

        <LandingNavbar/>
      </div>
        <Outlet/>
    </div>
  )
}

export default LandingLayout