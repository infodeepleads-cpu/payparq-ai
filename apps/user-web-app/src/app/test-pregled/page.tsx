'use client';

import { useState } from 'react';
import { ListYourLotPanel } from '@/components/ListYourLotPanel';

export default function TestPregled() {
  const [step, setStep] = useState<'intro' | 1 | 2 | 3 | 'review'>('intro');
  const [subStep, setSubStep] = useState<'region' | 'map' | 'name' | 'type' | 'features' | 'addOns' | 'vehicleSize' | 'accessControl'>('region');

  return (
    <div className="w-full h-screen">
      <ListYourLotPanel
        isFullScreen={true}
        currentStep={step}
        currentSubStep={subStep}
        onStepChange={setStep}
        onSubStepChange={setSubStep}
      />
    </div>
  );
}
