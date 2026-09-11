import React from 'react'
import './Landing.css'
import laptopLanding from '../../assets/laptopLanding.png'
import dash1Landing from '../../assets/dash1Landing.png'
import dash2Landing from '../../assets/dash2Landing.png'
import { Button } from '../../components/componentsIndex.js'
import firstLanding from '../../assets/firstLanding.jpg'
import secondLanding from '../../assets/secondLanding.jpg'

const Landing = () => {
  return (
    <>
      <div className='relative section1'>

        <div className='relative z-10 textsAndParas'>

          <div className='text-7xl font-space font-extrabold tracking-[-0.06em] mt-30 flex flex-col items-center cursor-default select-none heading'>

            <div className='flex'>
              <div>
                The complete home for
              </div>
              <div className='bg-light-green text-dark-green pl-2 pr-3 rounded-full ml-4 py-0.5'>
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

            <div className='text-sm font-pop tracking-normal font-normal w-117.5 select-none leading-7 mt-10 text-center'>Brevitas brings organizing, participating, and discovering together in one place. Create and evaluate hackathons with AI assistance built in. Form teams instantly, reuse them anytime, and find great teammates through the Achievers page — where standout winners and top projects get showcased.</div>
            <div className='text-base font-pop tracking-normal mt-5'>Build. Team up. Get discovered.</div>

          </div>

          <div className='flex items-center justify-center mt-8'>
            <Button text='Get Started!' className='font-extrabold' textsize='text-xl' px='px-9' />
          </div>

        </div>

        <div className='absolute flex items-start restPage top-15 w-full justify-between -z-10 select-none'>
          <img src={laptopLanding} alt="image" className='w-135 -ml-29 mt-6' />
          <div className='overflow-hidden w-110 mt-6 -mr-15'>
            <img src={dash1Landing} alt="image" />
            <img src={dash2Landing} alt="image" />
          </div>
        </div>

      </div>





      <div className='mt-90 serveCards'>
        <div className='flex justify-center'>
          <h1 className='text-5xl font-bold font-space tracking-tight serveQues'>What do we Serve?</h1>
        </div>

        <div className='flex mt-20 ml-10 w-230 create&manage'>
          <div className='w-97 aspect-3/2 bg-violet-400 leftImage'>

          </div>
          <div className='ml-6 flex flex-col items-center rightTexts'>
            <div className='bg-light-green/70 text-dark-green px-5 py-1 rounded-full text-4xl font-space font-bold '>
              Create $ Manage
            </div>
            <div
              className="font-pop w-110 mt-4 text-center bg-cover bg-center bg-no-repeat py-6 px-8 rounded-2xl border border-gray-200"
              style={{ backgroundImage: `url(${firstLanding})` }}
            >
              Launch a hackathon in minutes with an easy-to-use interface built for organizers.
              Appoint Managers to supervise participants, track submissions, and customize everything, from rules to evaluation criteria.
              All from one dashboard.
            </div>
          </div>
        </div>




        <div className='flex mt-45 mr-10 w-330 aiJudge'>
          <div className='ml-6 flex flex-col items-center rightTexts'>
            <div className='bg-light-green/70 text-dark-green px-5 py-1 rounded-full text-4xl font-space font-bold '>
              AI Assited Judging
            </div>
            <div
              className="font-pop w-170 mt-4 text-center bg-cover bg-center bg-no-repeat py-6 px-8 rounded-2xl border border-gray-200"
              style={{ backgroundImage: `url(${secondLanding})` }}
            >
              Appoint judges easily, right from the app. Judges are backed by an AI assistant that browses live links, GitHub repos, and PPTs to do the heavy lifting — cutting hours of manual review down drastically. AI only suggests scores; judges make the final call, backed by a human-vs-AI weightage you control. Plagiarism checks, grammar checks, and custom criteria — all built in.
            </div>
          </div>
          <div className='w-97 aspect-3/2 bg-violet-400 leftImage'>

          </div>
        </div>

        <div className='mt-200'>
          dfkdjd
        </div>
      </div>
    </>
  )
}

export default Landing