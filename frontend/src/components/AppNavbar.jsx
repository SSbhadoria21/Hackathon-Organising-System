import React, { useState } from 'react'
import '../index.css'
import logo from '../assets/logo.png'
import { Button, Input } from '../components/componentsIndex.js'
import { NavLink } from "react-router-dom"
import { useNavigate } from 'react-router-dom'
import { RadioTower, Pencil, Goal, UserStar, UserRoundGroup, Bell, Quote, CircleUserRound } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux'
import authService from '../backend/auth.js'
import { storeLogout } from '../store/authSlice.js'

const LandingNavbar = () => {

  const navigate = useNavigate()
  const [activityOpen, setActivityOpen] = useState(false)
  const [profileMenu, setProfileMenu] = useState(false)
  const userData = useSelector((state) => state.auth.userData?.data)
  const loginStatus = useSelector((state)=>state.auth.status)
  const dispatch = useDispatch()

  const logoutFunc = async()=>{
    await authService.logoutAccount()
    dispatch(storeLogout())
  }

  return (
    <>
      <div className='relative'>
        <div className='flex gap-2 relative z-20'>
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
        <div className='bg-navbar-bg w-12 h-screen pl-2.5 pt-2.5 rounded-br-full absolute top-0 sideBar z-20'>
          {/* <div className='w-7 h-7 rounded-full bg-white profile flex justify-center items-center' onClick={()=>navigate('/profile')}>
              <CircleUserRound size={20} color="#9d9d9d" strokeWidth={2} />
          </div> */}


          <div className="relative group ProfileIcon">
            {/* Profile Icon */}
            <div
              className="w-7 h-7 rounded-full border-2 border-darker-blue bg-white profile flex justify-center items-center overflow-hidden cursor-pointer"
              onClick={() => navigate('/profile')}
            >
              {userData?.avatar ? (
                <img
                  src={userData.avatar}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <CircleUserRound size={20} color="#9d9d9d" strokeWidth={2} />
              )}
            </div>

            {/* Hover Popup */}
            <div
              className="absolute left-0 top-full mt-0 w-40
    bg-white rounded-xl shadow-lg border border-gray-200
    p-1 z-50
    opacity-0 invisible translate-y-2
    group-hover:opacity-100 group-hover:visible group-hover:translate-y-0
    transition-all duration-200 ease-out font-alef"
            >
              <button
                onClick={() => navigate('/profile')}
                className="w-full text-left px-2 py-1 rounded-lg text-[11px] text-gray-700 hover:bg-gray-100 transition-colors"
              >
                View Profile
              </button>

              <button
                onClick={() => navigate('/edit-profile')}
                className="w-full text-left px-2 py-1 rounded-lg text-[11px] text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Edit Profile
              </button>

              <button
                onClick={logoutFunc}
                className="w-full text-left px-2 py-1 rounded-lg text-[11px] text-red-500 hover:bg-red-50 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          <div className='mt-15 sidebarIcons'>

            {/* create hackathon: */}
            <div className='bg-white w-7 h-7 rounded-full flex justify-center items-center relative group cursor-pointer' onClick={() => navigate("/create-hackathon")}>
              <RadioTower size={18} className="text-icon-gray group-hover:text-darker-blue transition-colors duration-200" onClick={() => navigate("/create-hackathon")} />

              <div className="absolute top-full left-1/2 -translate-x-1 mt-1.5 hidden group-hover:block whitespace-nowrap bg-light-green text-dark-green text-[10px] px-2 py-1 rounded-full shadow-md shadow-black/15 z-50 font-alef">
                Create Hackathon
              </div>

            </div>


            {/* my activities: */}
            <div className='bg-white w-7 h-7 rounded-full flex justify-center items-center relative group mt-4 cursor-pointer' onClick={() => setActivityOpen(!activityOpen)}>
              <Pencil size={18} className="text-icon-gray group-hover:text-darker-blue transition-colors duration-200" />

              <div className="absolute top-full left-1/2 -translate-x-1 mt-1.5 hidden group-hover:block whitespace-nowrap bg-light-green text-dark-green text-[10px] px-2 py-1 rounded-full shadow-md shadow-black/15 z-50 font-alef">
                My Activities
              </div>

              {activityOpen && (
                <div className="absolute left-5 ml-3 top-0 bg-white rounded-2xl shadow-lg p-2 w-45 text-[12px] font-alef text-darker-blue">
                  <h1 className='text-[13px] font-bold'>My Activities</h1>
                  <button className="flex gap-1 w-full text-left px-3 py-1 hover:bg-gray-100 rounded-full" onClick={() => navigate("/")}>
                    <Goal size={15} color="#9d9d9d" />
                    Participations
                  </button>

                  <button className="flex gap-1 w-full text-left px-3 py-1 hover:bg-gray-100 rounded-full" onClick={() => navigate("/")}>
                    <RadioTower size={15} color="#9d9d9d" />
                    Created Hackathons
                  </button>

                  <button className="flex gap-1 w-full text-left px-3 py-1 hover:bg-gray-100 rounded-full" onClick={() => navigate("/")}>
                    <UserStar size={15} color="#9d9d9d" />
                    Accessed Hackathons
                  </button>
                </div>
              )}


            </div>



            {/* teams */}
            <div className='bg-white w-7 h-7 rounded-full flex justify-center items-center relative group mt-4 cursor-pointer' onClick={() => navigate("/my-teams")}>
              <UserRoundGroup size={18} className="text-icon-gray group-hover:text-darker-blue transition-colors duration-200" />

              <div className="absolute top-full left-1/2 -translate-x-1 mt-1.5 hidden group-hover:block whitespace-nowrap bg-light-green text-dark-green text-[10px] px-2 py-1 rounded-full shadow-md shadow-black/15 z-50 font-alef">
                My Teams
              </div>

            </div>



            {/* Reminders */}
            <div className='bg-white w-7 h-7 rounded-full flex justify-center items-center relative group mt-4 cursor-pointer' onClick={() => navigate("/reminders")}>
              <Bell size={18} className="text-icon-gray group-hover:text-darker-blue transition-colors duration-200" />

              <div className="absolute top-full left-1/2 -translate-x-1 mt-1.5 hidden group-hover:block whitespace-nowrap bg-light-green text-dark-green text-[10px] px-2 py-1 rounded-full shadow-md shadow-black/15 z-50 font-alef">
                Reminders
              </div>

            </div>



            {/* achievers */}
            <div className='bg-white w-7 h-7 rounded-full flex justify-center items-center relative group mt-4 cursor-pointer' onClick={() => navigate("/achievers")}>
              <Quote size={18} className="text-icon-gray group-hover:text-darker-blue transition-colors duration-200" />

              <div className="absolute top-full left-1/2 -translate-x-1 mt-1.5 hidden group-hover:block whitespace-nowrap bg-light-green text-dark-green text-[10px] px-2 py-1 rounded-full shadow-md shadow-black/15 z-50 font-alef">
                Achievers Page
              </div>

            </div>


          </div>
        </div>



      </div>
    </>
  )
}

export default LandingNavbar

