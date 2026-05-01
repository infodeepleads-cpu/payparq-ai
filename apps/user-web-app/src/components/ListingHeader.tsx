'use client';

type MainStep = 'intro' | 1 | 2 | 3 | 'review';
type Step1Sub = 'region' | 'map' | 'name' | 'type' | 'features' | 'vehicleSize' | 'accessControl';
type Step2Sub = 'availability' | 'bookingStart' | 'calendarPreview' | 'bookingWindow' | 'bookingTypes' | 'pricing' | 'description' | 'postBookingInstructions';
type Step3Sub = 'photos' | 'streetView' | 'summary';

interface ListingHeaderProps {
  currentStep: MainStep;
  currentSubStep?: Step1Sub;
  currentStep2Sub?: Step2Sub;
  currentStep3Sub?: Step3Sub;
  onBack: () => void;
}

export function ListingHeader({ currentStep, currentSubStep, currentStep2Sub, currentStep3Sub, onBack }: ListingHeaderProps) {
  const getStepProgress = () => {
    if (currentStep === 'intro') return 0;
    if (currentStep === 1) {
      if (currentSubStep === 'region') return 1;
      if (currentSubStep === 'map') return 2;
      if (currentSubStep === 'name') return 3;
      if (currentSubStep === 'type') return 4;
      if (currentSubStep === 'features') return 5;
      if (currentSubStep === 'vehicleSize') return 6;
      if (currentSubStep === 'accessControl') return 7;
    }
    if (currentStep === 2) {
      if (currentStep2Sub === 'availability') return 8;
      if (currentStep2Sub === 'bookingStart') return 9;
      if (currentStep2Sub === 'calendarPreview') return 10;
      if (currentStep2Sub === 'bookingWindow') return 11;
      if (currentStep2Sub === 'bookingTypes') return 12;
      if (currentStep2Sub === 'pricing') return 13;
      if (currentStep2Sub === 'description') return 14;
      if (currentStep2Sub === 'postBookingInstructions') return 15;
    }
    if (currentStep === 3) {
      if (currentStep3Sub === 'photos') return 16;
      if (currentStep3Sub === 'streetView') return 17;
      if (currentStep3Sub === 'summary') return 18;
    }
    if (currentStep === 'review') return 19;
    return 0;
  };

  const currentProgress = getStepProgress();

  return (
    <div className="border-b border-gray-200">
      {/* Dynamic progress bar: 7 for Section 1, 7 for Section 2, 1 for Section 3, 1 for review */}
      <div className="flex gap-0 h-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map((step) => (
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
