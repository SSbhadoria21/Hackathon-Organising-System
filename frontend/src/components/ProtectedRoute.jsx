import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom'

const ProtectedRoute = () => {
  const authStatus = useSelector(state => state.auth.status)

  if (!authStatus) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default ProtectedRoute