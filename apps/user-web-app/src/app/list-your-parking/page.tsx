'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ListYourLotPanel } from '@/components/ListYourLotPanel';

type MainStep = 'intro' | 1 | 2 | 3 | 'review';
type Step1Sub = 'region' | 'map' | 'name';

export default function ListYourParkingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<MainStep>('intro');
  const [currentSubStep, setCurrentSubStep] = useState<Step1Sub>('region');

  const handleBackButton = () => {
    if (currentStep === 'intro') {
      router.back();
    } else if (currentStep === 1) {
      if (currentSubStep === 'region') {
        setCurrentStep('intro');
      } else if (currentSubStep === 'map') {
        setCurrentSubStep('region');
      } else if (currentSubStep === 'name') {
        setCurrentSubStep('map');
      }
    } else if (currentStep === 2) {
      setCurrentSubStep('name');
      setCurrentStep(1);
    } else if (currentStep === 3) {
      setCurrentStep(2);
    }
  };

  // Dynamic step labels in Croatian (1a→1, 1b→2, 1c→3, 2→4, 3→5)
  const getStepNumber = () => {
    if (currentStep === 'intro') return '1';
    if (currentStep === 1 && currentSubStep === 'region') return '1';
    if (currentStep === 1 && currentSubStep === 'map') return '2';
    if (currentStep === 1 && currentSubStep === 'name') return '3';
    if (currentStep === 2) return '4';
    if (currentStep === 3) return '5';
    return '1';
  };

  const stepLabel = `Korak ${getStepNumber()}`;

  const stepName = currentStep === 'intro' ? 'Objavite svoj parking'
    : currentStep === 1 && currentSubStep === 'region' ? 'Odaberite regiju'
    : currentStep === 1 && currentSubStep === 'map' ? 'Označite lokaciju'
    : currentStep === 1 && currentSubStep === 'name' ? 'Nazovite parking'
    : currentStep === 2 ? 'Pripremite se za vozače'
    : currentStep === 3 ? 'Dodajte slike'
    : 'Pregled';

  return (
    <div className="min-h-screen bg-white flex flex-col w-screen m-0 p-0">
      {/* Header - Black with home logo and title */}
      <div className="bg-black w-screen">
        <div className="py-4 flex items-center gap-6 px-6">
          {/* Left: Logo + payparq text (clickable to home) */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-3 text-white hover:opacity-80 transition-opacity flex-shrink-0"
          >
            {/* Same logo as home/footer */}
            <div className="w-8 h-8 rounded-full bg-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.45)] flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#020617] to-[#020617] flex items-center justify-center border border-white/40">
                <span className="text-sm font-semibold tracking-tight leading-none text-white">
                  P
                </span>
              </div>
            </div>
            <span className="font-bold text-lg">payparq</span>
          </button>

          {/* Vertical divider (clickable to home) */}
          <button
            onClick={() => router.push('/')}
            className="w-px h-8 bg-white/30 hover:bg-white/60 transition-colors flex-shrink-0"
          />

          {/* Center: Dynamic step label + Title */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">
              <span className="text-white/60">{stepLabel}:</span> {stepName}
            </h1>
          </div>

          {/* Right: Back arrow */}
          <button
            onClick={handleBackButton}
            className="text-gray-400 hover:text-gray-200 text-2xl flex-shrink-0 -ml-[38px]"
          >
            ←
          </button>
        </div>

        {/* Violet progress status bar */}
        <div className="h-1 bg-gradient-to-r from-[#5F3DFC] to-[#5F3DFC]/40" />
      </div>

      {/* Full-screen content */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-6xl mx-auto h-full">
          <ListYourLotPanel
            isFullScreen={true}
            currentStep={currentStep}
            currentSubStep={currentSubStep}
            onStepChange={setCurrentStep}
            onSubStepChange={setCurrentSubStep}
          />
        </div>
      </div>
    </div>
  );
}
