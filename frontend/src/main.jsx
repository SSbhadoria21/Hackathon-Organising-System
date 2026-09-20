import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import {
  LandingLayout,
  Landing,
  Home,
  AppLayout,
  Signup,
  Login
} from './pages/pagesIndex.js'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        element: <LandingLayout/>,
        children:[
          {
            path: "/",
            element: <Landing/>
          },
          {
            path: "/signup",
            element: <Signup/>
          },
          {
            path: "/login",
            element: <Login/>
          }
        ]
      },
      {
        element: <AppLayout />,
        children:[
          {
            path: "/home",
            element: <Home/>
          }
        ]
      }
    ]
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
