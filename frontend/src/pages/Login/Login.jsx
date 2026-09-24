import React from 'react'
import signupPeople from '../../assets/loginPeople.png'
import './Login.css';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import { useForm } from 'react-hook-form';
import authService from '../../backend/auth';

const Login = () => {
    const {register, handleSubmit} = useForm()
    const navigate = useNavigate()
    const [error, setError] = useState("")
    
    const submitFunc = async(data)=>{
        try {
            const userData = await authService.loginAccount(data)
            if(userData){
                
            }
        } catch (error) {
            setError(error.message)
        }
    }

    return (
        <>
            {/* <div className='relative'
                style={{
                    backgroundImage: `url(${signupBg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    height: '100vh' // Ensures the container has height to display the image
                }}>


                <div className='absolute top-30 left-130 h-130 w-110 bg-white/10 backdrop-blur-md rounded-4xl border border-white/20 shadow-xl'>

                </div>
            </div> */}
            <div className='relative'>
                {/* <div className='absolute top-30 left-130 h-130 w-110 bg-blue-700/10 backdrop-blur-xs rounded-4xl border border-white/20 shadow-xl'></div> */}

                <div className='absolute top-70 right-10 w-110 h-auto'>
                    <img src={signupPeople} alt="" className='w-110 h-auto floating-image' />
                </div>

                <div className='mt-25 ml-10 w-fit'>
                    <h1 className='text-[70px] font-black font-pop italic'>Welcome back!  <span className='text-2xl'>Log in here.</span> </h1>
                    <div className='flex ml-2'>
                        <h1 className='text-[15px] font-space italic'>Don't have an account?</h1>
                        <Link className='ml-2 hover:underline font-alef text-darker-blue' to={'/signup'}>Signup</Link>
                    </div>
                </div>

                <div className='absolute top-45 left-140'>
                    <form onSubmit={handleSubmit(submitFunc)} className='flex flex-col items-center gap-10'>
                        {/* <div className='flex flex-col'>
                            <label htmlFor="email" className='font-pop text-darker-blue'>Email</label>
                            <input id='email' type="text" placeholder='example@mail.com' className='placeholder:text-xs placeholder:italic placeholder:font-space bg-white rounded-full px-3 font-space text-xs py-2 w-70 shadow-md shadow-black/40 focus:outline-none focus:bg-[#f1f6e6]' />
                        </div> */}
                        
                        <div className='flex flex-col'>
                            <label htmlFor="username" className='font-pop text-darker-blue'>Username</label>
                            <input id='username' type="text" placeholder='username' className='placeholder:text-xs placeholder:italic placeholder:font-space bg-white rounded-full px-3 font-space text-xs py-2 w-70 shadow-md shadow-black/40 focus:outline-none focus:bg-[#f1f6e6]' {...register("indentifier", {required: true})}/>
                        </div>

                        <div className='flex flex-col'>
                            <label htmlFor="password" className='font-pop text-darker-blue'>Password</label>
                            <input id='password' type="password" placeholder='password' className='placeholder:text-xs placeholder:italic placeholder:font-space bg-white rounded-full px-3 font-space text-xs py-2 w-70 shadow-md shadow-black/40 focus:outline-none focus:bg-[#f1f6e6]' {...register("password", {required: true})}/>
                        </div>

                        <div className='flex items-center justify-center mt-2'>
                            <Button type='submit' text='Submit' className='font-extrabold' textsize='text-xl' px='px-9' rounded='rounded-full'/>
                        </div>
                    </form>
                </div>


            </div>
        </>
    )
}

export default Login