import React from 'react'
import '../index.css'
import logo from '../assets/logo.png'
import { Button } from '../components/componentsIndex.js'
import { NavLink } from "react-router-dom"

const LandingNavbar = () => {
  return (
    <>
      <div className='flex justify-between gap-2'>
        <div className='flex justify-around w-7xl h-10 rounded-b-full bg-navbar-bg navbar'>
          <Button text='Signup/Login' className='mt-2.5'/>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `relative group text-[12px] mt-2.5 ${isActive ? 'underline' : 'text-darker-blue'
              }`
            }
          >
            Home
            <span className="absolute left-0 bottom-0 h-0.5 w-full bg-dark-blue scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100" />
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `relative group text-[12px] mt-2.5 ${isActive ? 'underline' : 'text-darker-blue'
              }`
            }
          >
            About
            <span className="absolute left-0 bottom-0 h-0.5 w-full bg-dark-blue scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100" />
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `relative group text-[12px] mt-2.5 ${isActive ? 'underline' : 'text-darker-blue'
              }`
            }
          >
            Developer
            <span className="absolute left-0 bottom-0 h-0.5 w-full bg-dark-blue scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100" />
          </NavLink>
        </div>
        <div className='w-32 mt-0 mr-1 logo bg-white/50 backdrop-blur-md rounded-full p-2'>
          <img src={logo} alt="brevitas" />
        </div>
      </div>
    </>
  )
}

export default LandingNavbar