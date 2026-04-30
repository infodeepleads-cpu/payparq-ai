'use client';

type MainStep = 'intro' | 1 | 2 | 3 | 'review';
type Step1Sub = 'region' | 'map' | 'name';

interface ListingHeaderProps {
  currentStep: MainStep;
  currentSubStep?: Step1Sub;
  onBack: () => void;
}

export function ListingHeader({ currentStep, currentSubStep, onBack }: ListingHeaderProps) {
  const stepNumber = currentStep === 'intro' || currentStep === 'review' ? 5 : currentStep;

  return (
    <div>
      {/* Top: Logo + Back Button */}
      <div className="flex items-center justify-between py-3 px-6 border-b border-gray-200">
        <span className="text-sm font-bold text-gray-900">payparq</span>
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all duration-200"
        >
          ← Back
        </button>
      </div>

      {/* Progress Bar: 5 steps */}
      <div className="flex gap-1.5 px-6 py-4 bg-white border-b border-gray-100">
        {[1, 2, 3, 4, 5].map((step) => (
          <div
            key={step}
            className={`flex-1 h-2 rounded-full transition-all duration-300 ${
              step <= (stepNumber as number)
                ? 'bg-[#5F3DFC]'
                : 'bg-gray-200 border border-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
