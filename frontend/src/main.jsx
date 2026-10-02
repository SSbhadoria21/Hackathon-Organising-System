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
  Login,
  EmailVerification,
  CreateHackathon,
  Developers,
  MyTeams,
  Reminders,
  Achievers
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
            path: "/verify-email",
            element: <EmailVerification/>
          },
          {
            path: "/login",
            element: <Login/>
          },
          {
            path: "/developers",
            element:<Developers/>
          }
        ]
      },
      {
        element: <AppLayout />,
        children:[
          {
            path: "/home",
            element: <Home/>
          },
          {
            path: "/create-hackathon",
            element: <CreateHackathon/>
          },
          {
            path: "/my-teams",
            element: <MyTeams/>
          },
          {
            path: "/reminders",
            element: <Reminders/>
          },
          {
            path: "/achievers",
            element: <Achievers/>
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
