'use client';

type MainStep = 'intro' | 1 | 2 | 3 | 'review';
type Step1Sub = 'region' | 'map' | 'name';

interface ListingHeaderProps {
  currentStep: MainStep;
  currentSubStep?: Step1Sub;
  onBack: () => void;
}

export function ListingHeader({ currentStep, currentSubStep, onBack }: ListingHeaderProps) {
  const getStepProgress = () => {
    if (currentStep === 'intro') return 0;
    if (currentStep === 1) {
      if (currentSubStep === 'region') return 1;
      if (currentSubStep === 'map') return 2;
      if (currentSubStep === 'name') return 3;
    }
    if (currentStep === 2) return 4;
    if (currentStep === 3) return 5;
    if (currentStep === 4) return 6;
    if (currentStep === 5) return 7;
    if (currentStep === 'review') return 7;
    return 0;
  };

  const currentProgress = getStepProgress();

  return (
    <div className="border-b border-gray-200">
      {/* Dynamic 7-segment progress bar */}
      <div className="flex gap-0 h-1">
        {[1, 2, 3, 4, 5, 6, 7].map((step) => (
          <div
            key={step}
            className={`flex-1 transition-all duration-300 ${
              step <= currentProgress ? 'bg-[#5F3DFC]' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Header row: Back button on right */}
      <div className="flex items-center justify-end px-6 py-4">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all duration-200 whitespace-nowrap"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
