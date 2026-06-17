'use client';

import { useState } from 'react';
import { X, Send } from 'lucide-react';

interface CRMRow {
  id: string;
  email: string;
  contact: string;
}

interface SendSequenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRows: CRMRow[];
}

export function SendSequenceModal({ isOpen, onClose, selectedRows }: SendSequenceModalProps) {
  const [language, setLanguage] = useState<'hr' | 'en' | 'de' | 'it' | 'fr'>('en');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  const languages = [
    { code: 'hr', name: 'Croatian (Hrvatski)' },
    { code: 'en', name: 'English' },
    { code: 'de', name: 'German (Deutsch)' },
    { code: 'it', name: 'Italian (Italiano)' },
    { code: 'fr', name: 'French (Français)' },
  ];

  async function handleSendSequence() {
    if (selectedRows.length === 0) {
      setMessage('❌ No recipients selected');
      return;
    }

    setSending(true);
    setMessage('Sending...');

    try {
      const response = await fetch('/api/sequences/start-parking-sequence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails: selectedRows.map(row => ({
            email: row.email,
            name: row.contact
          })),
          language: language
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send sequence');
      }

      setMessage(`✅ Enrolled ${data.enrolled} leads in parking sequence (${language.toUpperCase()})`);
      setTimeout(() => {
        onClose();
        setMessage('');
        setSending(false);
      }, 2000);
    } catch (error) {
      setMessage(`❌ ${error instanceof Error ? error.message : 'Error'}`);
      setSending(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Send size={20} className="text-blue-600" />
            Send Email Sequence
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Recipients summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-900">
              📧 {selectedRows.length} recipient{selectedRows.length !== 1 ? 's' : ''} selected
            </p>
            <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
              {selectedRows.map((row, i) => (
                <p key={i} className="text-xs text-gray-600 truncate">
                  {row.contact} ({row.email})
                </p>
              ))}
            </div>
          </div>

          {/* Language selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Email Language
            </label>
            <div className="space-y-2">
              {languages.map(lang => (
                <label
                  key={lang.code}
                  className="flex items-center gap-3 p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="radio"
                    name="language"
                    value={lang.code}
                    checked={language === lang.code}
                    onChange={(e) => setLanguage(e.target.value as any)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-900">{lang.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sequence info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-700 mb-2">📋 Sequence Details:</p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• 4 emails total</li>
              <li>• 2-day spacing between emails</li>
              <li>• Skips weekends (sends Monday)</li>
              <li>• Auto-pauses on reply</li>
              <li>• Tracked in analytics</li>
            </ul>
          </div>

          {/* Status message */}
          {message && (
            <div className={`p-3 rounded-lg text-sm font-medium ${
              message.includes('✅')
                ? 'bg-green-50 text-green-700 border border-green-200'
                : message.includes('❌')
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {message}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={sending}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSendSequence}
              disabled={sending || selectedRows.length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Send size={16} />
              {sending ? 'Sending...' : 'Send Sequence'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
