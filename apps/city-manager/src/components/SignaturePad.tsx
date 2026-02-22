import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignaturePadProps {
  onChange: (signature: string | null) => void;
  initialSignature?: string | null;
}

const CANVAS_PROPS = {
  className: 'signature-canvas w-full h-40 cursor-crosshair block',
  style: { width: '100%', height: '160px' } 
};

function SignaturePad({ onChange, initialSignature }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const clear = () => {
    sigCanvas.current?.clear();
    setIsEmpty(true);
    onChange(null);
  };

  const save = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const dataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
      setIsEmpty(false);
      onChange(dataUrl);
    }
  };

  return (
    <div className="w-full mt-4 mb-6">
      <label className="block text-xs font-bold uppercase mb-2 text-gray-700">
        Potpis City Managera
      </label>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-white transition-colors relative overflow-hidden touch-none">
        <SignatureCanvas 
          ref={sigCanvas}
          penColor="black"
          canvasProps={CANVAS_PROPS}
          onEnd={save}
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-400 text-xs uppercase tracking-wider">
            Sign Here
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-center mt-2">
        <button 
          type="button" 
          onClick={clear}
          className="text-xs text-black hover:text-gray-700 font-medium px-2 py-1 rounded hover:bg-gray-100 transition-colors"
        >
          Clear Signature
        </button>
        
        {!isEmpty && (
          <span className="text-xs text-green-600 font-bold flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            Signed
          </span>
        )}
      </div>

      {initialSignature && isEmpty && (
         <div className="mt-3 p-3 border border-gray-200 rounded-lg bg-white">
           <p className="text-[10px] text-gray-400 mb-2 uppercase font-bold">Saved Signature:</p>
           <img src={initialSignature} alt="Saved Signature" className="h-12 object-contain" />
         </div>
      )}
    </div>
  );
}

export default React.memo(SignaturePad);
