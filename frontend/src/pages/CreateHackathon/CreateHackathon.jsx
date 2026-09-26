import React from 'react'
import { Input } from '../../components/componentsIndex.js'
import { useForm } from 'react-hook-form'

const CreateHackathon = () => {
  const { register, handleSubmit } = useForm()

  return (
    <div className=''>
      <div className='mt-30 ml-30 font-space'>
        <h1 className='text-2xl'>Start Creating a New Hackathon</h1>
        <h1>Fill out the form and save as draft anytime!</h1>
      </div>
      <div className='bg-light-green rounded-3xl ml-40 mt-15 h-100 w-200 px-5 py-10'>

        <form className=''>
          <div className='flex w-150 justify-between'>
            <label htmlFor="eventName" className='font-pop'>Event Name</label>
            <Input placeholder='Unovation Hackathon...' id='eventName' className='w-100'></Input>
          </div>

          <div className='flex w-150 justify-between mt-10'>
            <label htmlFor="theme" className='font-pop'>Theme</label>
            <Input placeholder='Software innovation...' id='theme' className='w-100'></Input>
          </div>

          <div className='flex w-150 justify-between mt-10'>
            <label htmlFor="description" className='font-pop'>Description</label>
            <Input placeholder='A crazy event to unviel your powers...' id='description' className='w-100'></Input>
          </div>

          <div className='flex w-150 justify-between mt-10'>
            <label htmlFor="organiser" className='font-pop'>Organizing Body</label>
            <Input placeholder='Type your organisation name' id='organiser' className='w-100'></Input>
          </div>

          <div className='flex w-150 justify-between mt-10'>
            <label htmlFor="shortdesc" className='font-pop'>Short Description</label>
            <Input placeholder='Type a catchy tagline' id='shortdesc' className='w-100'></Input>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateHackathon