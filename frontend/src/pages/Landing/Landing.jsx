import React from 'react'
import './Landing.css'
import laptopLanding from '../../assets/laptopLanding.png'
import dash1Landing from '../../assets/dash1Landing.png'
import dash2Landing from '../../assets/dash2Landing.png'
import { Button } from '../../components/componentsIndex.js'
import firstLanding from '../../assets/firstLanding.jpg'
import secondLanding from '../../assets/secondLanding.jpg'
import thirdLanding from '../../assets/thirdLanding.jpg'
import fourLanding from '../../assets/fourLanding.jpg'
import participant from '../../assets/participantLanding.png'
import organiser from '../../assets/organiserLanding.png'

const Landing = () => {

  const sectionRef = useRef(null);

  // Tracks scroll progress through the whole page (or a specific section)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"], // adjust based on your section boundaries
  });

  // Move image from its initial position to near "AI Assisted Judging"
  const x = useTransform(scrollYProgress, [0, 1], [0, -800]);   // adjust -800 to actual distance
  const y = useTransform(scrollYProgress, [0, 1], [0, 600]);    // adjust to match vertical gap
  const scaleX = useTransform(scrollYProgress, [0, 1], [1, -1]); // flips image only

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





      <div className='mt-90 relative serveCards'>
        <div className='flex justify-center'>
          <h1 className='text-5xl font-bold font-space tracking-tight serveQues'>What do we Serve?</h1>
        </div>




        <div className='flex items-center mt-20 ml-10 w-230 create&manage'>
          <div className='w-99.75 h-66.25 bg-violet-400 leftImage'></div>

          <div className='ml-6 flex flex-col items-center rightTexts'>
            <div className='bg-light-green/70 text-dark-green px-5 py-1 rounded-full text-4xl font-space font-bold '>
              Create $ Manage
            </div>
            <div
              className="font-pop w-95 mt-4 text-center text-[13px] text-gray-800 bg-cover bg-center bg-no-repeat py-7 px-9 rounded-2xl border border-gray-200"
              style={{ backgroundImage: `url(${firstLanding})` }}
            >
              Launch a hackathon in minutes with an easy-to-use interface built for organizers.
              Appoint Managers to supervise participants, track submissions, and customize everything, from rules to evaluation criteria.
              All from one dashboard.
            </div>
          </div>
        </div>




        <div className='flex justify-end mt-45 mr-10 items-center h-auto w-auto aiJudge'>

          <div className='mr-6 flex flex-col items-center'>
            <div className='bg-light-green/70 text-dark-green px-5 py-1 rounded-full text-4xl font-space font-bold '>
              AI Assited Judging
            </div>
            <div
              className="font-pop w-111 mt-4 text-[13px] text-violet-950 text-center bg-cover bg-center bg-no-repeat py-7 px-9 rounded-2xl border border-gray-200"
              style={{ backgroundImage: `url(${secondLanding})` }}
            >
              Appoint judges easily, right from the app. Judges are backed by an AI assistant that browses live links, GitHub repos, and PPTs to do the heavy lifting — cutting hours of manual review down drastically. AI only suggests scores; judges make the final call, backed by a human-vs-AI weightage you control. Plagiarism checks, grammar checks, and custom criteria — all built in.
            </div>
          </div>


          <div className='w-99.75 h-66.25 bg-violet-400 leftImage'></div>

        </div>





        <div className='flex items-center mt-45 ml-10 w-230 teamUp'>
          <div className='w-99.75 h-66.25 bg-violet-400 leftImage'></div>

          <div className='ml-6 flex flex-col items-center rightTexts'>
            <div className='bg-light-green/70 text-dark-green px-5 py-1 rounded-full text-4xl font-space font-bold '>
              Team Up, Instantly
            </div>
            <div
              className="font-pop w-86 mt-4 text-center text-[13px] text-amber-900 bg-cover bg-bottom-right bg-no-repeat py-7 px-9 rounded-2xl border border-gray-200"
              style={{ backgroundImage: `url(${thirdLanding})` }}
            >
              No emails, no chaos. Send an invite, name your team, pick your leader, all inside the app. Build your dream squad once and reuse it for every hackathon that follows. Participation, simplified.
            </div>
          </div>
        </div>





        <div className='flex justify-end mt-45 mr-10 items-center h-auto w-auto getDiscovered'>

          <div className='mr-6 flex flex-col items-center'>
            <div className='bg-light-green/70 text-dark-green px-5 py-1 rounded-full text-4xl font-space font-bold '>
              Get Discovered
            </div>
            <div
              className="font-pop w-92 mt-4 text-[13px] text-cyan-900 text-center bg-cover bg-center bg-no-repeat py-7 px-9 rounded-2xl border border-gray-200"
              style={{ backgroundImage: `url(${fourLanding})` }}
            >
              Your best work deserves the spotlight. Winning and standout projects get featured on our Achievers page — names, projects, and all. It's more than recognition — it's your gateway to being found by other great builders looking for their next teammate. Build something remarkable, and let the platform introduce you to who's next.
            </div>
          </div>


          <div className='w-99.75 h-66.25 bg-violet-400 leftImage'></div>

        </div>

        <div className='mt-200'>
          dfkdjd
        </div>





        {/* 
        ye wala mene kia tha:

        <div className='absolute top-22 right-19 movingImg'>
          <div className='relative'>
            <img src={organiser} alt="to an oraganiser" className='w-60' />
            <div className='absolute top-70 left-4 font-antonio font-bold text-2xl italic bg-[#b7c4ff] text-[#ffe5a1] rounded-full w-fit px-4 py-1'>to an Organiser</div>
          </div>
        </div> */}

          <div ref={sectionRef} className="relative">
      <motion.div
        style={{ x, y }}
        className="absolute top-22 right-19 movingImg"
      >
        <div className="relative">
          <motion.img
            src={organiser}
            alt="to an organiser"
            className="w-60"
            style={{ scaleX }} // flips only the image
          />
          <div className="absolute top-70 left-4 font-antonio font-bold text-2xl italic bg-[#b7c4ff] text-[#ffe5a1] rounded-full w-fit px-4 py-1">
            to an Organiser
          </div>
        </div>
      </motion.div>
    </div>

      </div>
    </>
  )
}

export default Landing