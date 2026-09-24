import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '../../components/componentsIndex.js'
import authService from '../../backend/auth.js'
import { useLocation } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'

const EmailVerification = () => {
    const { register, handleSubmit } = useForm()
    const [error, setError] = useState("")
    const location = useLocation();
    const userId = location.state?.userId;
    const navigate = useNavigate()

    const verify = async (data) => {
        setError("")
        try {
            const userData = await authService.verifyEmail({
                userId,
                ...data,
            })
            if (userData) {
                navigate('/login')                
            }

        } catch (error) {
            setError(error.message)
        }
    }

    return (
        <div>
            <h1 className='mt-30'>Verify your email</h1>
            <div className='bg-white mt-30 h-50 w-80 shadow-md shadow-black/40 rounded-2xl ml-135'>
                <form className='flex flex-col' onSubmit={handleSubmit(verify)}>
                    <label htmlFor="otp" className='font-pop text-darker-blue'>OTP</label>
                    <input id='otp' type="text" placeholder='example@mail.com' className='placeholder:text-xs placeholder:italic placeholder:font-space bg-white rounded-full px-3 font-space text-xs py-2 w-70 shadow-md shadow-black/40 focus:outline-none focus:bg-[#f1f6e6]' {...register("otp", { required: true })} />
                    <div className='flex items-center justify-center mt-2'>
                        <Button type='submit' text='Submit' className='font-extrabold' textsize='text-xl' px='px-9' rounded='rounded-full' />
                    </div>
                </form>
            </div>
        </div>
    )
}

export default EmailVerification