import React from 'react'
import { AppNavbar } from '../../components/componentsIndex'
import { Outlet } from 'react-router-dom'

const AppLayout = () => {
  return (
    <div className="min-h-screen w-full bg-default-bg flex flex-col">

      <div className="absolute top-10 left-12 w-10 h-10 bg-navbar-bg z-0 pointer-events-none">
        <div className="w-10 h-10 rounded-tl-full bg-default-bg" />
      </div>

      <div className="fixed top-0 z-100 w-full">
        <AppNavbar />
      </div>

      <main className="relative z-0 flex-1">
        <Outlet />
      </main>

    </div>
  )
}

export default AppLayout