import React, { useState, useEffect, useRef } from 'react'
import '../index.css'
import logo from '../assets/logo.png'
import { Button, Input } from '../components/componentsIndex.js'
import { NavLink } from "react-router-dom"
import { useNavigate } from 'react-router-dom'
import { RadioTower, Pencil, Goal, UserStar, UserRoundGroup, Bell, Quote, CircleUserRound, Check, X, CheckCircle2 } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux'
import authService from '../backend/auth.js'
import notificationService from '../backend/notification.js'
import { storeLogout } from '../store/authSlice.js'

const LandingNavbar = () => {

  const navigate = useNavigate()
  const [activityOpen, setActivityOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [recentNotifications, setRecentNotifications] = useState([])
  const notifRef = useRef(null)

  const userData = useSelector((state) => state.auth.userData?.data)
  const loginStatus = useSelector((state)=>state.auth.status)
  const dispatch = useDispatch()

  const logoutFunc = async()=>{
    await authService.logoutAccount()
    dispatch(storeLogout())
  }

  useEffect(() => {
    let cancelled = false;

    const fetchNotifs = async () => {
      try {
        const res = await notificationService.getNotifications({ limit: 5 });
        const data = res?.data || res;
        if (!cancelled && data) {
          setUnreadCount(data.unreadCount || 0);
          setRecentNotifications(data.notifications || []);
        }
      } catch {
        // Not signed in or network unavailable
      }
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Close flyout on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    };

    if (notificationOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationOpen]);

  const handleQuickRespond = async (e, notifId, action) => {
    e.stopPropagation();
    try {
      await notificationService.respondToInvite(notifId, action);
      setRecentNotifications((prev) =>
        prev.map((n) =>
          n._id === notifId
            ? { ...n, actionStatus: action === "ACCEPT" ? "ACCEPTED" : "DECLINED", read: true }
            : n
        )
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error("Quick respond error:", err);
    }
  };

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



            {/* Reminders & Notifications */}
            <div
              ref={notifRef}
              className='bg-white w-7 h-7 rounded-full flex justify-center items-center relative group mt-4 cursor-pointer'
              onClick={() => setNotificationOpen(!notificationOpen)}
            >
              <Bell size={18} className="text-icon-gray group-hover:text-darker-blue transition-colors duration-200" />

              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-xs pointer-events-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}

              {!notificationOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1 mt-1.5 hidden group-hover:block whitespace-nowrap bg-light-green text-dark-green text-[10px] px-2 py-1 rounded-full shadow-md shadow-black/15 z-50 font-alef pointer-events-none">
                  Reminders & Notifications {unreadCount > 0 && `(${unreadCount})`}
                </div>
              )}

              {/* Quick Flyout Notifications Menu */}
              {notificationOpen && (
                <div
                  className="absolute left-6 ml-3 top-0 bg-white rounded-2xl shadow-xl border border-gray-200 p-3 w-80 text-[12px] font-alef text-darker-blue z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[13px]">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="bg-darker-blue text-white text-[10px] font-semibold px-2 py-0.2 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setNotificationOpen(false);
                        navigate("/reminders");
                      }}
                      className="text-[11px] text-dark-blue font-semibold hover:underline cursor-pointer"
                    >
                      View All
                    </button>
                  </div>

                  {recentNotifications.length === 0 ? (
                    <div className="py-6 text-center text-gray-400 text-xs">
                      No notifications yet
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {recentNotifications.slice(0, 4).map((notif) => {
                        const isJudgeInvite = notif.type === "JUDGE_INVITE";
                        const isPending = notif.actionStatus === "PENDING";
                        const isAccepted = notif.actionStatus === "ACCEPTED";
                        const isDeclined = notif.actionStatus === "DECLINED";

                        return (
                          <div
                            key={notif._id}
                            className={`p-2.5 rounded-xl border transition ${
                              !notif.read
                                ? "bg-default-bg/80 border-darker-blue/20"
                                : "bg-gray-50/60 border-gray-100"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <span className="font-semibold text-xs text-darker-blue truncate">
                                {notif.title}
                              </span>
                              {!notif.read && (
                                <span className="w-1.5 h-1.5 rounded-full bg-darker-blue shrink-0 mt-1" />
                              )}
                            </div>

                            <p className="text-[11px] text-gray-600 line-clamp-2 leading-tight">
                              {notif.message}
                            </p>

                            {/* Inline Quick Action for Judge Invites */}
                            {isJudgeInvite && (
                              <div className="mt-2 pt-1 border-t border-gray-200/60 flex items-center justify-between">
                                {isPending ? (
                                  <div className="flex items-center gap-1.5 w-full">
                                    <button
                                      type="button"
                                      onClick={(e) => handleQuickRespond(e, notif._id, "ACCEPT")}
                                      className="flex-1 flex items-center justify-center gap-1 py-1 rounded-full bg-darker-blue text-white text-[10px] font-semibold hover:bg-dark-blue transition cursor-pointer"
                                    >
                                      <Check size={11} /> Accept
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => handleQuickRespond(e, notif._id, "DECLINE")}
                                      className="flex-1 flex items-center justify-center gap-1 py-1 rounded-full border border-gray-300 text-gray-700 text-[10px] font-semibold hover:bg-gray-100 transition cursor-pointer"
                                    >
                                      <X size={11} /> Decline
                                    </button>
                                  </div>
                                ) : isAccepted ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-dark-green font-semibold">
                                    <CheckCircle2 size={12} /> Accepted
                                  </span>
                                ) : isDeclined ? (
                                  <span className="text-[10px] text-gray-400 font-medium">
                                    Declined
                                  </span>
                                ) : null}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-2.5 pt-2 border-t border-gray-100 text-center">
                    <button
                      onClick={() => {
                        setNotificationOpen(false);
                        navigate("/reminders");
                      }}
                      className="w-full py-1.5 rounded-xl bg-navbar-bg/40 hover:bg-navbar-bg/70 text-darker-blue text-xs font-semibold transition cursor-pointer"
                    >
                      Open Full Notifications Hub →
                    </button>
                  </div>
                </div>
              )}
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

