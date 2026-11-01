import React from 'react'
import { AppNavbar } from '../../components/componentsIndex'
import { Outlet } from 'react-router-dom'

const AppLayout = () => {
  return (
    <div className="min-h-screen w-full bg-default-bg flex flex-col">
      {/* Top-left concave junction curve between top navbar (h-10) and sidebar (w-12) */}
      <div className="fixed top-10 left-12 w-10 h-10 bg-navbar-bg z-30 pointer-events-none">
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
