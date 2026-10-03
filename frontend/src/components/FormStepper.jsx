import React from 'react'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'

const steps = [
  'Basic Details',
  'Timeline',
  'Rules',
  'Prizes',
  'Team',
  'Judging',
  'Review'
]

const FormStepper = ({ currentStep, setCurrentStep }) => {

  const goNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  return (
    <div className="w-full">

      {/* Progress information */}
      <div className="flex items-center justify-between mb-4 font-space">
        <div>
          <h2 className="text-xl font-semibold">
            {steps[currentStep]}
          </h2>
        </div>

        <p className="text-sm text-gray-500">
          Step {currentStep + 1} / {steps.length}
        </p>
      </div>


      {/* Timeline */}
      <div className="relative flex items-start justify-between">

        {/* Background line */}
        <div className="absolute top-3 left-0 right-0 h-0.5 bg-gray-200" />

        {/* Completed line */}
        <div
          className="absolute top-3 left-0 h-0.5 bg-black transition-all duration-300"
          style={{
            width: `${(currentStep / (steps.length - 1)) * 100}%`
          }}
        />


        {steps.map((step, index) => {

          const completed = index < currentStep
          const current = index === currentStep

          return (
            <div
              key={step}
              className="relative z-10 flex flex-col items-center"
            >

              {/* Circle */}
              <div
                className={`
                  w-6 h-6 rounded-full flex items-center justify-center
                  border-2 transition-all duration-300
                  ${completed
                    ? 'bg-black border-black text-white'
                    : current
                      ? 'bg-white border-black text-black ring-4 ring-black/10'
                      : 'bg-white border-gray-300 text-gray-400'
                  }
                `}
              >
                {completed ? (
                  <Check size={15} />
                ) : (
                  index + 1
                )}
              </div>

              {/* Label */}
              <span
                className={`
                  mt-3 text-xs whitespace-nowrap font-space
                  ${current
                    ? 'font-semibold text-black'
                    : completed
                      ? 'text-gray-700'
                      : 'text-gray-400'
                  }
                `}
              >
                {step}
              </span>

            </div>
          )
        })}

      </div>


      {/* Navigation */}
      <div className="flex justify-between mt-6">

        <button
          onClick={goBack}
          disabled={currentStep === 0}
          className="
            flex items-center gap-2
            px-3 py-1
            rounded-full
            border border-gray-200
            disabled:opacity-30
            disabled:cursor-not-allowed
            hover:bg-gray-50
            transition
            text-[11px]
            font-alef
          "
        >
          <ChevronLeft size={18} />
          Back
        </button>


        <button
          onClick={goNext}
          disabled={currentStep === steps.length - 1}
          className="
            flex items-center gap-2
            px-3 py-1
            rounded-full
            bg-black text-white
            disabled:opacity-30
            disabled:cursor-not-allowed
            hover:bg-gray-800
            transition
            text-[11px]
            font-alef
          "
        >
          {currentStep === steps.length - 1 ? 'Submit' : 'Next'}
          <ChevronRight size={18} />
        </button>

      </div>

    </div>
  )
}

export default FormStepper