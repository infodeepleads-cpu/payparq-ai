'use client';

type MainStep = 'intro' | 1 | 2 | 3 | 'review';
type Step1Sub = 'region' | 'map' | 'name';

interface ListingHeaderProps {
  currentStep: MainStep;
  currentSubStep?: Step1Sub;
  onBack: () => void;
}

export function ListingHeader({ currentStep, currentSubStep, onBack }: ListingHeaderProps) {
  const stepNumber = currentStep === 'intro' || currentStep === 'review' ? null : currentStep;

  const getStepLabel = () => {
    if (currentStep === 'intro') return null;
    if (currentStep === 'review') return null;
    if (currentStep === 1) return `Step 1${currentSubStep ? currentSubStep.toUpperCase() === 'REGION' ? 'a' : currentSubStep.toUpperCase() === 'MAP' ? 'b' : 'c' : ''}`;
    return `Step ${currentStep}`;
  };

  return (
    <div className="flex items-center justify-between gap-8 py-4 px-6 border-b border-gray-200">
      {/* Left: Logo + Status Bar */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-bold text-gray-900">payparq</span>
          <div className="flex gap-1">
            <div className="h-1 w-6 rounded-full bg-[#5F3DFC]" />
            <div className="h-1 w-6 rounded-full bg-black" />
          </div>
        </div>
      </div>

      {/* Center: Step Indicators */}
      <div className="flex items-center gap-8">
        {[1, 2, 3].map((step) => (
          <button
            key={step}
            type="button"
            disabled={step === stepNumber}
            className={`transition-all duration-200 ${
              step === stepNumber
                ? 'font-bold text-[#5F3DFC] border-b-2 border-[#5F3DFC]'
                : step < (stepNumber as number)
                ? 'font-semibold text-green-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Step {step}
          </button>
        ))}
      </div>

      {/* Right: Back Button */}
      <button
        onClick={onBack}
        className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all duration-200"
      >
        ← Back
      </button>
    </div>
  );
}
