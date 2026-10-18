import React, { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import authService from './backend/auth.js'
import { useDispatch } from 'react-redux'
import { storeLogin, storeLogout } from './store/authSlice'

const App = () => {
  const [loading, setLoading] = useState(true)
  const dispatch = useDispatch()

  useEffect(() => {
    if (!localStorage.getItem('hasSession')) {
      setLoading(false)
      return
    }

    authService.getCurrentUser()
      .then((userData) => {
        if (userData) {
          dispatch(storeLogin(userData))
        }
        else {
          dispatch(storeLogout())
        }
      })
      .catch(() => {
        dispatch(storeLogout())
      })
      .finally(() => setLoading(false))
  }, [dispatch])


  return !loading ? (
    <div>
      <Outlet />
    </div>
  ) : null
}

export default App