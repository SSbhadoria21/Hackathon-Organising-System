import React from "react";
import { Check } from "lucide-react";

export const STEPS = [
  "Basic Details",
  "Timeline",
  "Rules & Guidelines",
  "Rounds",
  "Prizes & Sponsors",
  "Payments",
  "Judges",
  "Review & Publish",
];

const FormStepper = ({ currentStep, setCurrentStep, stepProgress = {} }) => {
  const isStepCompleted = (index) => {
    switch (index) {
      case 0:
        return Boolean(stepProgress.basicDetails);
      case 1:
        return Boolean(stepProgress.timeline);
      case 2:
        return Boolean(stepProgress.rulesEligibility);
      case 3:
        return Boolean(stepProgress.rounds);
      case 4:
        return Boolean(stepProgress.prizesSponsors);
      case 5:
        return Boolean(stepProgress.payments);
      case 6:
        return Boolean(stepProgress.judges);
      default:
        return false;
    }
  };

  return (
    <div className="w-full">
      {/* Progress information */}
      <div className="mb-4 flex items-center justify-between font-space">
        <div>
          <h2 className="text-xl font-semibold">{STEPS[currentStep]}</h2>
        </div>

        <p className="text-sm text-gray-500">
          Step {currentStep + 1} / {STEPS.length}
        </p>
      </div>

      {/* Stepper Bar */}
      <div className="relative flex items-start justify-between">
        {/* Background line */}
        <div className="absolute left-0 right-0 top-3 h-0.5 bg-gray-200" />

        {/* Completed line */}
        <div
          className="absolute left-0 top-3 h-0.5 bg-black transition-all duration-300"
          style={{
            width: `${(currentStep / (STEPS.length - 1)) * 100}%`,
          }}
        />

        {STEPS.map((step, index) => {
          const completed = isStepCompleted(index) || index < currentStep;
          const current = index === currentStep;

          return (
            <button
              key={step}
              type="button"
              onClick={() => setCurrentStep(index)}
              className="relative z-10 flex flex-col items-center group cursor-pointer focus:outline-none"
              title={`Jump to ${step}`}
            >
              {/* Circle */}
              <div
                className={`
                  flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all duration-300
                  ${
                    completed && !current
                      ? "border-black bg-black text-white"
                      : current
                      ? "border-black bg-white text-black ring-4 ring-black/10"
                      : "border-gray-300 bg-white text-gray-400 group-hover:border-gray-500 group-hover:text-gray-700"
                  }
                `}
              >
                {completed && !current ? <Check size={14} /> : index + 1}
              </div>

              {/* Label */}
              <span
                className={`
                  mt-2 hidden text-xs font-space sm:block max-w-[80px] text-center leading-tight truncate
                  ${
                    current
                      ? "font-semibold text-black"
                      : completed
                      ? "text-gray-700"
                      : "text-gray-400 group-hover:text-gray-600"
                  }
                `}
              >
                {step}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FormStepper;
