import React from 'react';

export default function ReviewManagementPage() {
  return (
    <div className="h-screen bg-white overflow-y-auto overflow-x-hidden">
      <div className="max-w-3xl w-full mx-auto px-1 md:px-0 pt-4 pb-32 overflow-x-hidden">
        <div className="flex items-center border-b border-gray-100 mb-6 pb-2">
          <span className="text-xs font-semibold tracking-tight text-black uppercase">Ultra-Brief Instruction Manual: Reviews & Trust</span>
        </div>
        
        <div className="space-y-6">
          <ul className="list-disc pl-5 space-y-4 text-sm text-gray-800 leading-relaxed">
            <li>
              <span className="font-bold">Check reviews daily.</span> Act fast—fresh issues grow quickly.
            </li>
            <li>
              <span className="font-bold">Remove suspicious items immediately.</span> No debate: fake, unclear, or risky = gone.
            </li>
            <li>
              <span className="font-bold">Respond clean & calm.</span> Short, polite, solution-focused.
            </li>
            <li>
              <span className="font-bold">One moment of surprise.</span> Add on the terrain an unexpected positive landmark.
            </li>
            <li>
              <span className="font-bold">Cleanliness matters.</span> Visual order, tidy space, clear language.
            </li>
            <li>
              <span className="font-bold">Smile matters.</span> Tone {'>'} words. Friendly always wins.
            </li>
          </ul>

          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm font-bold text-black">
              Rule: <span className="font-normal">Speed, clarity, and trust beat perfection.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
