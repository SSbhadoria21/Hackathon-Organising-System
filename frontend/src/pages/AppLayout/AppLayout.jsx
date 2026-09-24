import React from 'react'
import { AppNavbar } from '../../components/componentsIndex'
import { Outlet } from 'react-router-dom'

const AppLayout = () => {
  return (
    <div>
      <div className='fixed top-0 z-100'>

        <AppNavbar/>
      </div>
        <Outlet/>
    </div>
  )
}

export default AppLayout