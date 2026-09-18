import React, { useRef, useState, useEffect } from 'react'
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
import participantFlipped from '../../assets/participantLandingFlipped.png'
import organiser from '../../assets/organiserLanding.png'
import organiserFlipped from '../../assets/organiserLandingFlipped.png'
import { motion, useInView, useMotionValue, useTransform } from 'motion/react'
import comingSoon from '../../assets/comingSoon.png'
import cloudsLanding from '../../assets/cloudsLanding.png'
import logo from '../../assets/logo.png'


const Landing = () => {
  // const [isParticipant, setIsParticipant] = useState(false)
  const [imgPhase, setImgPhase] = useState("organiser");

  const manageRef = useRef(null)
  const manageInView = useInView(manageRef, {
    amount: 0.5
  })

  const aiJudgeRef = useRef(null)
  const aiJudgeInView = useInView(aiJudgeRef, {
    amount: 0.5
  })

  const teamRef = useRef(null)
  const teamInView = useInView(teamRef, {
    amount: 0.5
  })

  const discoveredRef = useRef(null)
  const discoveredInView = useInView(discoveredRef, {
    amount: 0.5
  })

  let currentSection = "create"

  if (discoveredInView) {
    currentSection = "getDiscovered"
  } else if (teamInView) {
    currentSection = "teamUp"
  } else if (aiJudgeInView) {
    currentSection = "aiJudge"
  }

  useEffect(() => {
    const targetPhase =
      currentSection === "create" || currentSection === "aiJudge"
        ? "organiser"
        : "participant";

    if (targetPhase !== imgPhase) {
      // swap mid-flip (half of the 1.2s transition), when the face is hidden
      const timer = setTimeout(() => setImgPhase(targetPhase), 600);
      return () => clearTimeout(timer);
    }
  }, [currentSection]);




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




        <div ref={manageRef} className='flex items-center mt-20 ml-10 w-230 create&manage'>
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




        <div ref={aiJudgeRef} className='flex justify-end mt-45 mr-10 items-center h-auto w-auto aiJudge'>

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





        <div ref={teamRef} className='flex items-center mt-45 ml-10 w-230 teamUp'>
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





        <div ref={discoveredRef} className='flex justify-end mt-45 mr-10 items-center h-auto w-auto getDiscovered'>

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






        {/* moving image: */}

        {/* <motion.div
          className='absolute top-22 right-19 movingImg'
          animate={
            aiJudgeInView
              ? {
                x: -1060,
                y: 430,
              }
              : {
                x: 0,
                y: 0,
              }
          }
          transition={{
            duration: 1.6,
            ease: easeInOut
          }}
        >
          <div className='relative'>
            <motion.img
              src={organiser}
              alt="to an oraganiser"
              className='w-60'
              animate={{
                rotateY: aiJudgeInView ? 180 : 0
              }}
              transition={{
                duration: 1.6,
                ease: "easeInOut"
              }}
              style={{
                transformStyle: "preserve-3d"
              }}
            />
            <motion.div
              className='absolute top-70 left-4 font-antonio font-bold text-2xl italic bg-[#b7c4ff] text-[#ffe5a1] rounded-full w-fit px-4 py-1'
              animate={{
                marginLeft: aiJudgeInView ? 30 : 0
              }}
            >to an Organiser</motion.div>
          </div>
        </motion.div> */}


        {/* from gpt: */}
        <div
          className="absolute top-22 right-19 movingImg"
          style={{ perspective: 1000 }}
        >
          <motion.div
            className="relative w-60"
            animate={
              currentSection === "create"
                ? {
                  x: 0,
                  y: 0,
                }
                : currentSection === "aiJudge"
                  ? {
                    x: -1060,
                    y: 430,
                  }
                  : currentSection === "teamUp"
                    ? {
                      x: 0,
                      y: 880,
                    }
                    : {
                      x: -1060,
                      y: 1350,
                    }
            }
            transition={{
              duration: 1.2,
              ease: "easeInOut",
            }}
          >




            {/* IMAGE */}
            <motion.div
              className="relative w-60 h-auto"
              animate={{
                rotateY:
                  currentSection === "create"
                    ? 0
                    : currentSection === "aiJudge"
                      ? 180
                      : currentSection === "teamUp"
                        ? 360
                        : 540,
              }}
              transition={{
                duration: 1.2,
                ease: "easeInOut",
              }}
              style={{
                transformStyle: "preserve-3d",
              }}
            >
              {/* FRONT FACE — visible at rotateY 0 / 360 */}
              {/* FRONT FACE */}
              <img
                src={imgPhase === "organiser" ? organiser : participant}
                alt="front"
                className="w-60"
                style={{ backfaceVisibility: "hidden" }}
              />

              {/* BACK FACE */}
              <img
                src={imgPhase === "organiser" ? organiserFlipped : participantFlipped}
                alt="back"
                className="absolute top-0 left-0 w-60"
                style={{
                  transform: "rotateY(180deg)",
                  backfaceVisibility: "hidden",
                }}
              />
            </motion.div>





            {/* LABEL */}
            <motion.div
              className="absolute font-antonio font-bold text-2xl italic bg-[#b7c4ff] text-[#ffe5a1] rounded-full w-fit px-4 py-1"
              animate={{
                opacity:
                  currentSection === "teamUp" ||
                    currentSection === "getDiscovered"
                    ? 1
                    : 1,
                color:
                  currentSection === "teamUp" || currentSection === "getDiscovered"
                    ? "#b7c4ff"
                    : "#ffe5a1",
                backgroundColor:
                  currentSection === "teamUp" || currentSection === "getDiscovered"
                    ? "#ffe5a1"
                    : "#b7c4ff",
                left:
                  currentSection === "create"
                    ? 12
                    : currentSection === "aiJudge"
                      ? 46
                      : currentSection === "teamUp"
                        ? 31
                        : 46,
                top:
                  currentSection === "create"
                    ? 280
                    : currentSection === "aiJudge"
                      ? 280
                      : currentSection === "teamUp"
                        ? 220
                        : 220,
              }}
            >
              {currentSection === "create" ||
                currentSection === "aiJudge"
                ? "to an Organiser"
                : "to a Participant"}
            </motion.div>

          </motion.div>
        </div>








        {/* serve cards div ends here. */}
      </div>







      <div className='mt-50 pt-15 h-screen rounded-t-[80px] exploreNow'>
        <div className='flex justify-center'>
          <h1 className='text-5xl font-bold font-space tracking-tight exploreHeading'>Explore Now...</h1>
        </div>

        <div className='flex mt-50 justify-center'>
          <img src={comingSoon} alt="" className='w-100' />
        </div>
      </div>



      <div className='relative footerSection'>

        <div className='z-1000 flex flex-col items-center'>
          <p className='font-pop mt-39 text-[13px] text-center w-160 leading-6.5'>Whether you're building the next big hackathon or the next big idea, Brevitas is where it happens. <br />Create with ease, judge with AI by your side, team up in seconds, and get discovered for the work you're proud of. The platform is ready — all that's missing is you.
            <br />Sign up today and be part of what's next.
          </p>

          <div className='flex items-center justify-center mt-9'>
            <Button text='Get Started!' className='font-extrabold' textsize='text-xl' px='px-9' />
          </div>
        </div>


        <div className='relative bg-[#f1f3f8] mt-50 w-auto h-54 mx-6.25 mb-6.25 rounded-2xl partial-border text-center text-sm text-darker-blue font-alef'><p className='absolute bottom-20 left-150 footerText'>Email Phone Developers</p></div>


        {/* <div className='absolute z-0 flex justify-center top-0 w-full'>
          <img src={cloudsLanding} alt="" className='w-full'/>
        </div> */}
        <div className='absolute z-0 flex justify-center top-111 w-150 left-105'>
          <img src={logo} alt="" className='w-full'/>
        </div>
      </div>



      {/* <div className='mt-200'>
        dfkdjd
      </div> */}

    </>
  )
}

export default Landing