import React from 'react'
import '../index.css'
import logo from '../assets/logo.png'
import { Button, Input } from '../components/componentsIndex.js'
import { NavLink } from "react-router-dom"
import { useNavigate } from 'react-router-dom'
import { RadioTower } from 'lucide-react';

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
          <div className='w-32 mt-0 mr-1 logo bg-white/50 backdrop-blur-md rounded-full p-2 cursor-pointer' onClick={() => navigate("/")}>
            <img src={logo} alt="brevitas" />
          </div>
        </div>
        <div className='bg-navbar-bg w-12 h-screen pl-2.5 pt-2.5 rounded-br-full absolute top-0 sideBar'>
          <div className='w-7 h-7 rounded-full bg-white profile'>

          </div>

          <div className='mt-20 sidebarIcons'>
            <div className='bg-white w-7 h-7 rounded-full flex justify-center items-center relative group'>
              <RadioTower size={18} className="text-[#9d9d9d] group-hover:text-[#2f7d32] cursor-pointer transition-colors duration-200" onClick={() => navigate("/create-hackathon")} />

              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block whitespace-nowrap bg-[#222] text-white text-xs px-3 py-1.5 rounded-md shadow-lg z-50">
                Create Hackathon
              </div>

            </div>
          </div>
        </div>

        <div className='w-10 h-10 bg-navbar-bg absolute top-10 left-12 bgBox'>
          <div className='rounded-tl-full w-10 h-10 bg-default-bg'>

          </div>
        </div>
      </div>
    </>
  )
}

export default LandingNavbar

