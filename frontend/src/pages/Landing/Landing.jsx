import React from 'react'
import './Landing.css'

const Landing = () => {
  return (
    <>
      <div className='text-7xl font-space font-extrabold -tracking-[0.06em] mt-20 heading flex flex-col items-center'>
        <div className='flex'>
          <div>
            The complete home for
          </div>
          <div className='bg-light-green text-dark-green px-2 rounded-full ml-4 py-0.5'>
            Creators
          </div>
        </div>
        <div className='flex mt-3'>
          <div>
            and for
          </div>
          <div className='bg-light-green text-dark-green px-4 rounded-full ml-4'>
            Innovators
          </div>
          <div>.</div>
        </div>
      </div>
    </>
  )
}

export default Landing