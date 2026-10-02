import React from 'react'
import { AppNavbar } from '../../components/componentsIndex'
import { Outlet } from 'react-router-dom'

const AppLayout = () => {
  return (
    <div className="min-h-screen w-full bg-default-bg flex flex-col">

      <div className="fixed top-0 z-100 w-full">
        <AppNavbar />
      </div>

      <main className="flex-1">
        <Outlet />
      </main>

    </div>
  )
}

export default AppLayout