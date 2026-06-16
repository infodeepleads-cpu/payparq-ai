'use client';

import { useState, useEffect } from 'react';
import { Trash2, Plus, RefreshCw, Upload, X } from 'lucide-react';

interface CRMRow {
  id: string;
  company: string;
  contact: string;
  status: string;
  nextAction: string;
  date: string;
  notes: string;
}

export function CRMTable() {
  const [rows, setRows] = useState<CRMRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingCell, setEditingCell] = useState<{ id: string; field: keyof CRMRow } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState('');
  const [importCity, setImportCity] = useState('');
  const [importLoading, setImportLoading] = useState(false);

  // Fetch data
  useEffect(() => {
    fetchCRM();
  }, []);

  const fetchCRM = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/crm');
      const data = await res.json();
      if (Array.isArray(data)) {
        setRows(data);
      } else {
        console.error('CRM API error:', data?.error || 'Unknown error');
        setRows([]);
      }
    } catch (error) {
      console.error('Error fetching CRM:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const saveCRM = async (updatedRows: CRMRow[]) => {
    try {
      setSaving(true);
      await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRows),
      });
    } catch (error) {
      console.error('Error saving CRM:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCellClick = (id: string, field: keyof CRMRow, value: string) => {
    setEditingCell({ id, field });
    setEditValue(value);
  };

  const handleCellSave = (id: string, field: keyof CRMRow, value: string) => {
    const updated = rows.map((row) =>
      row.id === id ? { ...row, [field]: value } : row
    );
    setRows(updated);
    saveCRM(updated);
    setEditingCell(null);
  };

  const handleAddRow = () => {
    const newRow: CRMRow = {
      id: Date.now().toString(),
      company: '',
      contact: '',
      status: '',
      nextAction: '',
      date: '',
      notes: '',
    };
    const updated = [...rows, newRow];
    setRows(updated);
    saveCRM(updated);
  };

  const handleDeleteRow = (id: string) => {
    if (confirm('Delete this row?')) {
      const updated = rows.filter((row) => row.id !== id);
      setRows(updated);
      saveCRM(updated);
    }
  };

  const handleImport = async () => {
    if (!importData.trim() || !importCity.trim()) {
      alert('Please enter both city name and data');
      return;
    }

    try {
      setImportLoading(true);
      const res = await fetch('/api/crm/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawData: importData, city: importCity }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      alert(`✅ Imported ${result.imported} entries for ${importCity}`);
      setImportData('');
      setImportCity('');
      setShowImportModal(false);
      fetchCRM();
    } catch (error) {
      alert(`Error importing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setImportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading CRM data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleAddRow}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          <Plus size={16} />
          Add Row
        </button>
        <button
          onClick={() => setShowImportModal(true)}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          <Upload size={16} />
          Import Data
        </button>
        <button
          onClick={fetchCRM}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
        {saving && <span className="text-sm text-gray-600">Saving...</span>}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Import CRM Data</h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">City Name</label>
                <input
                  type="text"
                  value={importCity}
                  onChange={(e) => setImportCity(e.target.value)}
                  placeholder="e.g., Milano, Roma, Venezia"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Paste Your Data (Tab-separated)</label>
                <p className="text-xs text-gray-600 mb-2">Copy from your spreadsheet and paste here. Columns: Company | Contact | Status | Next Action | Date | Notes</p>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Paste your tab-separated data here..."
                  className="w-full h-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 font-mono text-sm"
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={importLoading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {importLoading ? 'Importing...' : 'Import'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Company</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Next Action</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Notes</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  {['company', 'contact', 'status', 'nextAction', 'date', 'notes'].map((field) => (
                    <td key={field} className="px-4 py-3">
                      {editingCell?.id === row.id && editingCell.field === field ? (
                        <input
                          autoFocus
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleCellSave(row.id, field as keyof CRMRow, editValue)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCellSave(row.id, field as keyof CRMRow, editValue);
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          className="w-full px-2 py-1 border border-blue-500 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      ) : (
                        <div
                          onClick={() => handleCellClick(row.id, field as keyof CRMRow, row[field as keyof CRMRow])}
                          className="px-2 py-1 cursor-pointer hover:bg-blue-50 rounded text-sm text-gray-900 break-words"
                        >
                          {row[field as keyof CRMRow] || '-'}
                        </div>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDeleteRow(row.id)}
                      className="inline-flex items-center justify-center p-2 hover:bg-red-50 text-red-600 rounded transition-colors"
                      title="Delete row"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {rows.length === 0 && (
        <div className="text-center py-12 text-gray-600">
          No CRM entries yet. Click "Add Row" to get started.
        </div>
      )}

      <div className="text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
        💡 Click any cell to edit. Changes save automatically. Total rows: {rows.length}
      </div>
    </div>
  );
}
