'use client';
import { useState, useEffect } from 'react';
import { Copy, Save, RefreshCw, Plus, Trash2 } from 'lucide-react';

interface Sequence {
  id: string;
  name: string;
  description: string;
  emails: Array<{
    number: number;
    subject: string;
    delay_days: number;
    trigger: string;
  }>;
}

const EMPTY_SEQUENCE: Sequence = {
  id: '',
  name: 'New Sequence',
  description: '',
  emails: [
    { number: 1, subject: '', delay_days: 0, trigger: 'always' },
    { number: 2, subject: '', delay_days: 3, trigger: 'opened' },
  ],
};

export function SequencesEditor() {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [jsonText, setJsonText] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSequences();
  }, []);

  const fetchSequences = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/sequences');
      const data = await res.json();
      setSequences(Array.isArray(data) ? data : []);
      setJsonText(JSON.stringify(Array.isArray(data) ? data : [], null, 2));
    } catch (error) {
      console.error('Error fetching sequences:', error);
      setSequences([]);
      setJsonText(JSON.stringify([], null, 2));
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmpty = () => {
    const newSeq: Sequence = {
      ...EMPTY_SEQUENCE,
      id: `seq-${Date.now()}`,
    };
    const updated = [...sequences, newSeq];
    setSequences(updated);
    setJsonText(JSON.stringify(updated, null, 2));
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonText);
    setMessage('✅ Copied to clipboard!');
    setTimeout(() => setMessage(''), 2000);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setJsonText(text);
      const parsed = JSON.parse(text);
      setSequences(Array.isArray(parsed) ? parsed : []);
      setMessage('✅ Pasted and parsed!');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      setMessage('❌ Invalid JSON');
      setTimeout(() => setMessage(''), 2000);
    }
  };

  const handleSave = async () => {
    try {
      const parsed = JSON.parse(jsonText);
      const res = await fetch('/api/sequences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });

      if (!res.ok) throw new Error('Save failed');

      setSequences(parsed);
      setMessage('✅ Sequences saved!');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      setMessage('❌ Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleJsonChange = (newText: string) => {
    setJsonText(newText);
    try {
      const parsed = JSON.parse(newText);
      setSequences(Array.isArray(parsed) ? parsed : []);
    } catch {
      // Invalid JSON, don't update sequences
    }
  };

  const handleDelete = (id: string) => {
    const updated = sequences.filter(s => s.id !== id);
    setSequences(updated);
    setJsonText(JSON.stringify(updated, null, 2));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-600">Loading sequences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Sequences Manager</h2>
        <p className="text-gray-600 text-sm">Edit sequences in JSON format. Copy, paste, and save.</p>
      </div>

      {/* Current Sequences Preview */}
      {sequences.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Saved Sequences ({sequences.length})</h3>
          <div className="space-y-3">
            {sequences.map((seq) => (
              <div key={seq.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">{seq.name}</h4>
                    <p className="text-xs text-gray-600">{seq.description}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(seq.id)}
                    className="p-1 hover:bg-red-50 text-red-500 rounded transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  {seq.emails.map((email) => (
                    <div key={email.number} className="flex gap-2">
                      <span className="font-mono">Email {email.number}:</span>
                      <span className="line-clamp-1">{email.subject}</span>
                      <span className="text-gray-500">({email.delay_days}d, {email.trigger})</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* JSON Editor */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">JSON Editor</h3>
          <div className="flex items-center gap-2">
            {message && (
              <span className="text-sm text-gray-600">{message}</span>
            )}
          </div>
        </div>

        <textarea
          value={jsonText}
          onChange={(e) => handleJsonChange(e.target.value)}
          className="w-full h-96 px-4 py-3 font-mono text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 bg-white resize-none"
          placeholder="Paste sequences JSON here..."
        />

        {/* Buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleAddEmpty}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-medium transition-colors"
          >
            <Plus size={16} />
            Add Empty
          </button>

          <button
            onClick={handleCopyJson}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-medium transition-colors"
          >
            <Copy size={16} />
            Copy
          </button>

          <button
            onClick={handlePaste}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-medium transition-colors"
          >
            <RefreshCw size={16} />
            Paste
          </button>

          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Save size={16} />
            Save Sequences
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
        <p className="font-semibold mb-2">How to use:</p>
        <ol className="list-decimal list-inside space-y-1 text-xs">
          <li>Click "Add Empty" to create a new sequence template</li>
          <li>Edit the JSON directly in the textarea</li>
          <li>Or paste your sequences JSON from elsewhere</li>
          <li>Click "Save Sequences" to store them</li>
          <li>Saved sequences appear above</li>
        </ol>
      </div>
    </div>
  );
}
