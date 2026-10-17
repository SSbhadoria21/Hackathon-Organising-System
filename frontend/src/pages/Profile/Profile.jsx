import React, { useEffect, useState } from "react";
import authService from "../../backend/auth";
import {
  CircleUserRound,
  Trophy,
  Users,
  FileEdit,
  Calendar,
  Mail,
  ShieldCheck,
  Pencil,
} from "lucide-react";
import {useNavigate} from "react-router-dom"

const Profile = () => {
  const [profileData, setProfileData] = useState(null);
  const navigate = useNavigate()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authService.getFullProfile();
        setProfileData(response.data);
      } catch (error) {
        console.error(
          "Failed to fetch profile:",
          error.response?.data || error.message
        );
      }
    };

    fetchProfile();
  }, []);

  if (!profileData) {
    return (
      <div className="pt-20 pl-20 text-gray-500 font-space">
        Loading profile...
      </div>
    );
  }

  const joinedDate = new Date(profileData.createdAt).toLocaleDateString(
    "en-IN",
    {
      month: "long",
      year: "numeric",
    }
  );

  return (
    <div className="pt-16 pl-20 pr-10 pb-10 font-space">
      <h1 className="text-5xl font-bold text-black mb-8">Me</h1>

      <div className="grid grid-cols-12 gap-8">

        {/* LEFT */}
        <div className="col-span-8">

          {/* Header */}
          <div className="flex items-center gap-6">

            <div className="w-44 h-44 rounded-full border-[3px] border-darker-blue overflow-hidden bg-white shadow-lg">
              {profileData.avatar ? (
                <img
                  src={profileData.avatar}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex justify-center items-center w-full h-full">
                  <CircleUserRound size={80} color="#9d9d9d" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <h2 className="text-6xl font-medium text-darker-blue leading-none">
                {profileData.fullName}
              </h2>

              <p className="text-2xl text-black mt-2">
                @{profileData.username}
              </p>

              <p className="text-lg text-gray-600 mt-4 max-w-xl">
                {profileData.bio}
              </p>

              <button className="mt-5 px-5 py-2 rounded-full bg-darker-blue text-white flex items-center gap-2 hover:opacity-90 transition">
                <Pencil size={16} onClick={()=>navigate("/edit-profile")}/>
                Edit Profile
              </button>
            </div>
          </div>

          {/* About */}
          <div className="mt-10 bg-white/50 rounded-3xl p-6 border border-white/40 shadow-sm">
            <h3 className="text-2xl font-semibold mb-4">About</h3>

            <p className="text-gray-700 leading-8 text-justify">
              {profileData.about}
            </p>
          </div>

          {/* Skills */}
          <div className="mt-8 bg-white/50 rounded-3xl p-6 border border-white/40 shadow-sm">
            <h3 className="text-2xl font-semibold mb-5">Skills</h3>

            <div className="flex flex-wrap gap-3">
              {profileData.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-4 py-2 rounded-full bg-navbar-bg text-darker-blue font-medium border border-white/40"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="col-span-4 space-y-6">

          {/* Stats */}
          <div className="bg-white/60 rounded-3xl p-6 border border-white/40 shadow-sm">
            <h3 className="text-xl font-semibold mb-5">Overview</h3>

            <div className="space-y-4">

              <div className="flex items-center justify-between bg-white rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <Trophy className="text-darker-blue" />
                  <span>Organized</span>
                </div>

                <span className="font-bold text-xl">
                  {profileData.stats.hackathonsOrganized}
                </span>
              </div>

              <div className="flex items-center justify-between bg-white rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <Users className="text-darker-blue" />
                  <span>Teams Joined</span>
                </div>

                <span className="font-bold text-xl">
                  {profileData.stats.teamsJoined}
                </span>
              </div>

              <div className="flex items-center justify-between bg-white rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <FileEdit className="text-darker-blue" />
                  <span>Drafts</span>
                </div>

                <span className="font-bold text-xl">
                  {profileData.stats.activeDrafts}
                </span>
              </div>
            </div>
          </div>

          {/* Account */}
          <div className="bg-white/60 rounded-3xl p-6 border border-white/40 shadow-sm">
            <h3 className="text-xl font-semibold mb-5">Account</h3>

            <div className="space-y-5 text-gray-700">

              <div className="flex items-start gap-3">
                <Mail className="text-darker-blue mt-1" size={18} />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="break-all">{profileData.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ShieldCheck className="text-darker-blue mt-1" size={18} />
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <p>{profileData.role}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="text-darker-blue mt-1" size={18} />
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p>{joinedDate}</p>
                </div>
              </div>

              {profileData.isEmailVerified && (
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-green-100 text-green-700 font-medium">
                  <ShieldCheck size={16} />
                  Verified
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-darker-blue to-[#3A4D8F] text-white rounded-3xl p-6 shadow-lg">
            <h3 className="text-xl font-semibold">Ready for your next hackathon?</h3>

            <p className="text-sm text-white/80 mt-2">
              Create your own event or join a team and start building.
            </p>

            <div className="mt-5 flex flex-col gap-3">
              <button className="bg-white text-darker-blue py-2 rounded-full font-semibold hover:bg-gray-100 transition">
                Create Hackathon
              </button>

              <button className="border border-white/30 py-2 rounded-full hover:bg-white/10 transition">
                Browse Events
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;

// import React, { useEffect, useState } from 'react'
// import authService from '../../backend/auth'
// import { CircleUserRound } from 'lucide-react';


// const Profile = () => {
//   const [profileData, setProfileData] = useState(null)

//   useEffect(() => {
//     const fetchProfile = async () => {
//       try {
//         const response = await authService.getFullProfile()
//         setProfileData(response.data)
//         console.log(response.data)
//       } catch (error) {
//         console.error(
//           'Failed to fetch profile:',
//           error.response?.data || error.message
//         )
//       }
//     }

//     fetchProfile()
//   }, [])

//   return (
//     <div className="pt-14 pl-20">
//       <div className="text-black text-4xl font-space font-bold">
//         Me
//       </div>

//       <div className='flex items-center'>

//         <div className="bg-white rounded-full h-40 w-40 mt-5">


//           <div
//             className="w-40 h-40 rounded-full border-3 border-darker-blue bg-white profile flex justify-center items-center overflow-hidden"
//           >
//             {profileData?.avatar ? (
//               <img
//                 src={profileData.avatar}
//                 alt="Profile"
//                 className="w-full h-full object-cover"
//               />
//             ) : (
//               <CircleUserRound size={20} color="#9d9d9d" strokeWidth={2} />
//             )}
//           </div>
//         </div>


//         <div className='font-space ml-5'>
//           {profileData && (
//             <p className='text-5xl font-medium text-darker-blue'>{profileData.fullName}</p>
//           )}
//           {profileData && (
//             <p className='text-xl text-black'>@{profileData.username}</p>
//           )}
//           {profileData && (
//             <p className='text-lg mt-2 text-gray-700'>{profileData.bio}</p>
//           )}
//         </div>


//       </div>

//       <div className='flex flex-col'>

//         <div className='mt-10 w-170 ml-10'>
//           <h1 className='font-space text-2xl font-medium'>About</h1>
//           {profileData && (
//             <p className='text-xl text-gray-800 font-pop text-[15px] leading-6 text-justify'>{profileData.about}</p>
//           )}
//         </div>

//         <div>
//           <h1>Skills</h1>

//         </div>
//       </div>

//     </div>
//   )
// }

// export default Profile
