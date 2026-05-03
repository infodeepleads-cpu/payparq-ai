'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ListYourLotPanel } from '@/components/ListYourLotPanel';

type MainStep = 'intro' | 1 | 2 | 3 | 'review';
type Step1Sub = 'region' | 'map' | 'name' | 'type' | 'features' | 'vehicleSize' | 'accessControl';
type Step2Sub = 'availability' | 'bookingStart' | 'calendarPreview' | 'bookingWindow' | 'bookingTypes' | 'pricing' | 'description' | 'postBookingInstructions';
type Step3Sub = 'photos' | 'streetView' | 'summary';

export default function ListYourParkingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<MainStep>('intro');
  const [currentSubStep, setCurrentSubStep] = useState<Step1Sub>('region');
  const [currentStep2Sub, setCurrentStep2Sub] = useState<Step2Sub>('availability');
  const [currentStep3Sub, setCurrentStep3Sub] = useState<Step3Sub>('photos');

  const handleBackButton = () => {
    if (currentStep === 'intro') {
      router.back();
    } else if (currentStep === 'review') {
      setCurrentStep2Sub('description');
      setCurrentStep(2);
    } else if (currentStep === 1) {
      if (currentSubStep === 'region') {
        setCurrentStep('intro');
      } else if (currentSubStep === 'map') {
        setCurrentSubStep('region');
      } else if (currentSubStep === 'name') {
        setCurrentSubStep('map');
      } else if (currentSubStep === 'type') {
        setCurrentSubStep('name');
      } else if (currentSubStep === 'features') {
        setCurrentSubStep('type');
      } else if (currentSubStep === 'vehicleSize') {
        setCurrentSubStep('features');
      } else if (currentSubStep === 'accessControl') {
        setCurrentSubStep('vehicleSize');
      }
    } else if (currentStep === 2) {
      if (currentStep2Sub === 'availability') {
        setCurrentSubStep('accessControl');
        setCurrentStep(1);
      } else if (currentStep2Sub === 'bookingStart') {
        setCurrentStep2Sub('availability');
      } else if (currentStep2Sub === 'calendarPreview') {
        setCurrentStep2Sub('bookingStart');
      } else if (currentStep2Sub === 'bookingWindow') {
        setCurrentStep2Sub('calendarPreview');
      } else if (currentStep2Sub === 'bookingTypes') {
        setCurrentStep2Sub('bookingWindow');
      } else if (currentStep2Sub === 'pricing') {
        setCurrentStep2Sub('bookingTypes');
      } else if (currentStep2Sub === 'description') {
        setCurrentStep2Sub('pricing');
      } else if (currentStep2Sub === 'postBookingInstructions') {
        setCurrentStep2Sub('description');
      }
    } else if (currentStep === 3) {
      if (currentStep3Sub === 'summary') {
        setCurrentStep3Sub('streetView');
      } else if (currentStep3Sub === 'streetView') {
        setCurrentStep3Sub('photos');
      } else if (currentStep3Sub === 'photos') {
        setCurrentStep2Sub('postBookingInstructions');
        setCurrentStep(2);
      }
    }
  };

  // Dynamic step labels - restart numbering for each section
  const getStepNumber = () => {
    if (currentStep === 'intro') return '1';
    if (currentStep === 1 && currentSubStep === 'region') return '1';
    if (currentStep === 1 && currentSubStep === 'map') return '2';
    if (currentStep === 1 && currentSubStep === 'name') return '3';
    if (currentStep === 1 && currentSubStep === 'type') return '4';
    if (currentStep === 1 && currentSubStep === 'features') return '5';
    if (currentStep === 1 && currentSubStep === 'vehicleSize') return '6';
    if (currentStep === 1 && currentSubStep === 'accessControl') return '7';
    if (currentStep === 2 && currentStep2Sub === 'availability') return '1';
    if (currentStep === 2 && currentStep2Sub === 'bookingStart') return '2';
    if (currentStep === 2 && currentStep2Sub === 'calendarPreview') return '3';
    if (currentStep === 2 && currentStep2Sub === 'bookingWindow') return '4';
    if (currentStep === 2 && currentStep2Sub === 'bookingTypes') return '5';
    if (currentStep === 2 && currentStep2Sub === 'pricing') return '6';
    if (currentStep === 2 && currentStep2Sub === 'description') return '7';
    if (currentStep === 2 && currentStep2Sub === 'postBookingInstructions') return '8';
    if (currentStep === 3 && currentStep3Sub === 'photos') return '1';
    if (currentStep === 3 && currentStep3Sub === 'streetView') return '2';
    if (currentStep === 3 && currentStep3Sub === 'summary') return '3';
    if (currentStep === 'review') return '1';
    return '1';
  };

  const getSectionLabel = () => {
    if (currentStep === 1) return 'Section 1';
    if (currentStep === 2) return 'Section 2';
    if (currentStep === 3) return 'Section 3';
    return '';
  };

  const stepLabel = `Korak ${getStepNumber()}${getSectionLabel() ? ` - ${getSectionLabel()}` : ''}`;

  const stepName = currentStep === 'intro' ? 'Objavite svoj parking'
    : currentStep === 1 && currentSubStep === 'region' ? 'Odaberite regiju'
    : currentStep === 1 && currentSubStep === 'map' ? 'Označite lokaciju'
    : currentStep === 1 && currentSubStep === 'name' ? 'Nazovite parking'
    : currentStep === 1 && currentSubStep === 'type' ? 'Vrsta parkinga'
    : currentStep === 1 && currentSubStep === 'features' ? 'Mogućnosti'
    : currentStep === 1 && currentSubStep === 'vehicleSize' ? 'Veličina vozila'
    : currentStep === 1 && currentSubStep === 'accessControl' ? 'Kontrola pristupa'
    : currentStep === 2 && currentStep2Sub === 'availability' ? 'Dostupnost'
    : currentStep === 2 && currentStep2Sub === 'bookingStart' ? 'Početak primanja rezervacija'
    : currentStep === 2 && currentStep2Sub === 'calendarPreview' ? 'Pregled kalendara'
    : currentStep === 2 && currentStep2Sub === 'bookingWindow' ? 'Vremenski prozor rezervacija'
    : currentStep === 2 && currentStep2Sub === 'bookingTypes' ? 'Vrste rezervacija'
    : currentStep === 2 && currentStep2Sub === 'pricing' ? 'Model cijene'
    : currentStep === 2 && currentStep2Sub === 'description' ? 'Vaš opis'
    : currentStep === 2 && currentStep2Sub === 'postBookingInstructions' ? 'Upute nakon rezervacije'
    : currentStep === 3 && currentStep3Sub === 'photos' ? 'Fotografije'
    : currentStep === 3 && currentStep3Sub === 'streetView' ? 'Google Street View'
    : currentStep === 3 && currentStep3Sub === 'summary' ? 'Očekivanja'
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
            currentStep2Sub={currentStep2Sub}
            currentStep3Sub={currentStep3Sub}
            onStepChange={(step) => setCurrentStep(step)}
            onSubStepChange={(subStep) => setCurrentSubStep(subStep)}
            onStep2SubChange={(subStep) => setCurrentStep2Sub(subStep)}
            onStep3SubChange={(subStep) => setCurrentStep3Sub(subStep)}
          />
        </div>
      </div>
    </div>
  );
}
