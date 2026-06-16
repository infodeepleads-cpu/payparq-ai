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

const COLUMNS: { key: keyof CRMRow; label: string }[] = [
  { key: 'company', label: 'Company' },
  { key: 'contact', label: 'Contact' },
  { key: 'status', label: 'Status' },
  { key: 'nextAction', label: 'Next Action' },
  { key: 'date', label: 'Date' },
  { key: 'notes', label: 'Notes' },
];

export function CRMTable() {
  const [rows, setRows] = useState<CRMRow[]>([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [setupError, setSetupError] = useState('');
  const [editingCell, setEditingCell] = useState<{ id: string; field: keyof CRMRow } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
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
        const uniqueCities = Array.from(new Set(data.map((r: CRMRow) => r.city).filter(Boolean))).sort();
        setCities(uniqueCities as string[]);
        if (uniqueCities.length > 0 && !selectedCity) {
          setSelectedCity(uniqueCities[0] as string);
        }
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
      id: `${selectedCity}-${Date.now()}`,
      company: '',
      contact: '',
      status: '',
      nextAction: '',
      date: '',
      notes: '',
      city: selectedCity,
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportLoading(true);
      const text = await file.text();

      // Parse CSV
      const lines = text.trim().split('\n');
      const csvRows = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV parser - handles quoted fields
        const parts: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            parts.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        parts.push(current.trim());

        // Skip tier headers
        if (!parts[0] || parts[0].toLowerCase().includes('tier') || parts[0].toLowerCase() === 'company') {
          continue;
        }

        const company = parts[0] || '';
        const contact = parts[1] || '';
        const status = parts[2] || '';
        const nextAction = parts[3] || '';
        const date = parts[4] || '';
        const notes = parts[5] || '';

        if (company) {
          csvRows.push({
            company,
            contact,
            status,
            nextAction,
            date,
            notes,
            city: importCity,
          });
        }
      }

      if (csvRows.length === 0) {
        alert('No valid data found in CSV');
        return;
      }

      const res = await fetch('/api/crm/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: csvRows, city: importCity }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      alert(`✅ Imported ${result.imported} entries for ${importCity}`);
      setShowImportModal(false);
      setImportCity('');
      fetchCRM();
    } catch (error) {
      alert(`Error importing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setImportLoading(false);
      e.target.value = '';
    }
  };

  const filteredRows = selectedCity ? rows.filter((r) => r.city === selectedCity) : [];

  const handleDeleteCity = () => {
    if (!selectedCity) return;
    if (!confirm(`Delete all ${filteredRows.length} entries from ${selectedCity}? This cannot be undone.`)) return;

    const updated = rows.filter((r) => r.city !== selectedCity);
    setRows(updated);
    saveCRM(updated);
    setSelectedCity('');
  };

  const handleRenameCity = () => {
    if (!selectedCity) return;
    const newCityName = prompt(`Rename "${selectedCity}" to:`, selectedCity);
    if (!newCityName || newCityName === selectedCity) return;

    const updated = rows.map((r) =>
      r.city === selectedCity ? { ...r, city: newCityName } : r
    );
    setRows(updated);
    saveCRM(updated);
    setSelectedCity(newCityName);
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

      {/* City Selector */}
      <div className="flex items-center gap-3 flex-wrap bg-white p-4 rounded-lg border border-gray-200">
        <label className="text-sm font-semibold text-gray-900">City:</label>
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-gray-900"
        >
          <option value="">Select a city...</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city} ({rows.filter((r) => r.city === city).length})
            </option>
          ))}
        </select>
        {selectedCity && (
          <>
            <span className="text-xs text-gray-600">
              {filteredRows.length} entries
            </span>
            <button
              onClick={handleRenameCity}
              className="px-3 py-1.5 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded font-medium transition-colors"
            >
              Rename
            </button>
            <button
              onClick={handleDeleteCity}
              className="px-3 py-1.5 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded font-medium transition-colors"
            >
              Delete City
            </button>
          </>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleAddRow}
          disabled={saving || !selectedCity}
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
          Import CSV
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
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Import CSV Data</h2>
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
                  placeholder="e.g., Torino, Milano, Roma"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">CSV File</label>
                <p className="text-xs text-gray-600 mb-3">
                  Upload a CSV with columns: Company | Contact | Status | Next Action | Date | Notes
                </p>
                <div className={`block px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  importCity
                    ? 'border-green-300 hover:bg-green-50 bg-green-50'
                    : 'border-gray-300 bg-gray-50 opacity-50'
                }`}>
                  <input
                    type="file"
                    id="csv-upload"
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={importLoading}
                    className="hidden"
                  />
                  <label htmlFor="csv-upload" className="cursor-pointer block">
                    <div className="text-center">
                      <Upload size={20} className={`mx-auto mb-2 ${importCity ? 'text-green-600' : 'text-gray-400'}`} />
                      <p className={`text-sm font-medium ${importCity ? 'text-gray-900' : 'text-gray-500'}`}>
                        {importCity ? 'Click to upload CSV file' : 'Enter city name first'}
                      </p>
                      <p className="text-xs text-gray-600">or drag and drop</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
                {importLoading && <span className="text-sm text-gray-600">Processing...</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {!selectedCity ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600 font-medium">Select a city to view and edit entries</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {COLUMNS.map((col) => (
                      <th key={col.key} className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                        {col.label}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider w-16">Del</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRows.map((row) => (
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

          {filteredRows.length === 0 && !setupError && (
            <div className="text-center py-12 text-gray-500">
              No entries for {selectedCity}. Click <strong>Import CSV</strong> or <strong>Add Row</strong>.
            </div>
          )}

          <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-3">
            Click any cell to edit inline. Changes auto-save. {filteredRows.length} entries in {selectedCity}
          </div>
        </>
      )}
    </div>
  );
}
