'use client';

import { useState, useEffect } from 'react';
import { Trash2, Plus, RefreshCw, Upload, X, AlertCircle } from 'lucide-react';

interface CRMRow {
  id: string;
  company: string;
  contact: string;
  status: string;
  nextAction: string;
  date: string;
  notes: string;
  city: string;
}

const COLUMNS: { key: keyof CRMRow; label: string; width: string }[] = [
  { key: 'city', label: 'City', width: 'w-24' },
  { key: 'company', label: 'Company', width: 'w-40' },
  { key: 'contact', label: 'Contact', width: 'w-36' },
  { key: 'status', label: 'Status', width: 'w-28' },
  { key: 'nextAction', label: 'Next Action', width: 'w-40' },
  { key: 'date', label: 'Date', width: 'w-28' },
  { key: 'notes', label: 'Notes', width: 'w-64' },
];

export function CRMTable() {
  const [rows, setRows] = useState<CRMRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [setupError, setSetupError] = useState('');
  const [editingCell, setEditingCell] = useState<{ id: string; field: keyof CRMRow } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState('');
  const [importCity, setImportCity] = useState('');
  const [importLoading, setImportLoading] = useState(false);

  useEffect(() => {
    fetchCRM();
  }, []);

  const fetchCRM = async () => {
    try {
      setLoading(true);
      setSetupError('');
      const res = await fetch('/api/crm');
      const data = await res.json();
      if (Array.isArray(data)) {
        setRows(data);
      } else if (data?.error) {
        setSetupError(data.error);
        setRows([]);
      } else {
        setRows([]);
      }
    } catch (error) {
      console.error('Error fetching CRM:', error);
      setSetupError('Failed to connect to database');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const saveCRM = async (updatedRows: CRMRow[]) => {
    try {
      setSaving(true);
      const res = await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRows),
      });
      if (!res.ok) {
        const err = await res.json();
        alert('Save failed: ' + (err.error || 'Unknown error'));
      }
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
      city: '',
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

      alert(`Imported ${result.imported} entries for ${importCity}`);
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
      {/* Setup Error */}
      {setupError && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Database error: {setupError}</p>
            <p className="text-xs text-red-700 mt-1">
              You need to create the <code className="bg-red-100 px-1 rounded">crm_entries</code> table in Supabase.
              Go to <strong>Supabase → SQL Editor</strong> and run the SQL from <code>sql/create_crm_table.sql</code>.
            </p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
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
          disabled={saving || loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
        {saving && <span className="text-sm text-gray-600">Saving...</span>}
        <span className="ml-auto text-sm text-gray-500">{rows.length} entries</span>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Import CRM Data</h2>
              <button onClick={() => setShowImportModal(false)} className="text-gray-500 hover:text-gray-700">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Paste Your Data (Tab-separated from Google Sheets)
                </label>
                <p className="text-xs text-gray-600 mb-2">
                  Select all rows in your sheet (Ctrl+A), copy (Ctrl+C), paste here. Columns expected: Company | Contact | Status | Next Action | Date | Notes
                </p>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Paste your tab-separated data here..."
                  className="w-full h-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 font-mono text-sm text-gray-900 bg-white"
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
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
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
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {COLUMNS.map((col) => (
                  <th key={col.key} className={`px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider ${col.width}`}>
                    {col.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider w-16">Del</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  {COLUMNS.map(({ key }) => (
                    <td key={key} className="px-4 py-2">
                      {editingCell?.id === row.id && editingCell.field === key ? (
                        <input
                          autoFocus
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleCellSave(row.id, key, editValue)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCellSave(row.id, key, editValue);
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          className="w-full px-2 py-1 border border-blue-500 rounded text-sm focus:outline-none bg-white text-gray-900"
                        />
                      ) : (
                        <div
                          onClick={() => handleCellClick(row.id, key, row[key])}
                          className="px-2 py-1 cursor-pointer hover:bg-blue-50 rounded text-sm text-gray-900 break-words min-h-[28px]"
                        >
                          {row[key] || <span className="text-gray-400 italic text-xs">click to edit</span>}
                        </div>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => handleDeleteRow(row.id)}
                      className="inline-flex items-center justify-center p-1.5 hover:bg-red-50 text-red-500 rounded transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {rows.length === 0 && !setupError && (
        <div className="text-center py-12 text-gray-500">
          No CRM entries yet. Click <strong>Import Data</strong> to import from your spreadsheet, or <strong>Add Row</strong> to add manually.
        </div>
      )}

      <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-3">
        Click any cell to edit inline. Changes auto-save. Columns: City | Company | Contact | Status | Next Action | Date | Notes
      </div>
    </div>
  );
}
