import React, {useState} from 'react'
import { Input, FormStepper, BasicDetails, TimeLine, Rules, Rounds, PrizesSponsors, Payments, Judges } from '../../components/componentsIndex.js'
import { useForm } from 'react-hook-form'

const CreateHackathon = () => {
  const { register, handleSubmit } = useForm()
  const [currentStep, setCurrentStep] = useState(0)

  return (
    <div className='p-15 pl-20'>
      <div className='font-space'>
        <h1 className='text-2xl'>Start Creating a New Hackathon</h1>
        <h1 className='text-sm text-gray-600'>Start filling out the form and save as draft anytime!</h1>
      </div>
      

<div className="min-h-screen p-8">

      <div className="max-w-5xl mx-auto">

        <FormStepper
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
        />

        <div className="mt-10">

          {currentStep === 0 && (
            <BasicDetails />
          )}

          {currentStep === 1 && (
            <TimeLine />
          )}

          {currentStep === 2 && (
            <Rules />
          )}

          {currentStep === 3 && (
            <Rounds />
          )}

          {currentStep === 4 && (
            <PrizesSponsors />
          )}

          {currentStep === 5 && (
            <Payments />
          )}

          {currentStep === 6 && (
            <Judges />
          )}

        </div>

      </div>

    </div>



    </div>
  )
}

export default CreateHackathon



{/* <div className='bg-light-green rounded-3xl ml-40 mt-15 h-100 w-200 px-5 py-10'>

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
      </div> */}