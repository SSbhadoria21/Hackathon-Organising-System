import React, { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import authService from './backend/auth.js'
import { useDispatch } from 'react-redux'
import { storeLogin, storeLogout } from './store/authSlice'

const App = () => {
  const [loading, setLoading] = useState(true)
  const disptach = useDispatch()

  useEffect(() => {
    authService.getCurrentUser()
      .then((userData) => {
        if (userData) {
          disptach(storeLogin(userData))
        }
        else {
          disptach(storeLogout())
        }
      })
      .catch(() => {
        dispatch(storeLogout())
      })
      .finally(() => setLoading(false))
  }, [disptach])


  return !loading ? (
    <div>
      <Outlet />
    </div>
  ) : null
}

export default App