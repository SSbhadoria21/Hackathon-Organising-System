import React from 'react'
import '../index.css'
import logo from '../assets/logo.png'
import { Button, Input } from '../components/componentsIndex.js'
import { NavLink } from "react-router-dom"
import { useNavigate } from 'react-router-dom'

const LandingNavbar = () => {

  const navigate = useNavigate()

  return (
    <>
      <div className='relative'>
        <div className='flex gap-2'>
          <div className='flex justify-start pl-30 gap-5 w-7xl h-10 rounded-br-full bg-navbar-bg navbar'>
            <Button text='+ Create Hackathon' className='mt-2.5' onClick={() => navigate('/create-hackathon')} rounded='rounded-full' px='px-8' />

            <input type="search" placeholder='search hackathons...' className='font-alef text-[12px] bg-white h-4.5 pl-10 pr-15 mt-2.5 rounded-full' />

            <NavLink
              to="/home"
              className={({ isActive }) =>
                `relative group text-[12px] mt-2.5 ${isActive ? 'text-dark-green font-extrabold' : 'text-darker-blue'
                }`
              }
            >
              Home
              <span className="absolute left-0 bottom-0 h-0.5 w-full bg-dark-blue scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100" />
            </NavLink>

          </div>
          <div className='w-32 mt-0 mr-1 logo bg-white/50 backdrop-blur-md rounded-full p-2'>
            <img src={logo} alt="brevitas" />
          </div>
        </div>
        <div className='bg-navbar-bg w-10 h-screen rounded-br-full absolute top-0'>

        </div>

        <div>
          
        </div>
      </div>
    </>
  )
}

export default LandingNavbar

