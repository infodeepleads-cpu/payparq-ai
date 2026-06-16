'use client';

import { useState, useEffect } from 'react';
import { Trash2, Plus, RefreshCw, Upload, X, AlertCircle, Mail } from 'lucide-react';

interface CRMRow {
  id: string;
  company: string;
  contact: string;
  name: string;
  email: string;
  status: string;
  nextAction: string;
  date: string;
  notes: string;
  city: string;
}

const COLUMNS: { key: keyof CRMRow; label: string }[] = [
  { key: 'company', label: 'Company' },
  { key: 'contact', label: 'Contact' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'status', label: 'Status' },
  { key: 'nextAction', label: 'Next Action' },
  { key: 'date', label: 'Date' },
  { key: 'notes', label: 'Notes' },
];

type TemplateLanguage = 'serbian' | 'italian' | 'german' | 'spanish' | 'english';

interface EmailTemplate {
  subject: string;
  body: (name: string) => string;
  disclaimers: Record<TemplateLanguage, string>;
}

const TEMPLATES: Record<string, EmailTemplate> = {
  parking: {
    subject: 'Parking Space Inquiry',
    body: (name: string) =>
      `<p><b>Poštovani ${name},</b></p>\n\n<p>Da li imate višak praznog parking mjesta?</p>\n\n<p>Mi smo digitalna parking trgovina, oglašavamo prazna mjesta u Vašim terminima po Vašim cijenama, maržu (service fee) plaća kupac.</p>\n\n<p>Zainteresirani?</p>\n\n<hr style="border:none;border-top:1px solid #e0e0e0;margin:16px 0;" />\n<p><b>Karlo Žamić, mag.oec.</b><br />\nManaging Partner, payparq<br />\npayparq.com<br />\n+385915963139</p>`,
    disclaimers: {
      serbian: `IZJAVA O ODRICANJU ODGOVORNOSTI: Sadržaj ove poruke i eventualno priloženih datoteka je povjerljiv i namijenjen je samo osobama ili subjektima koji su navedeni u adresi. Ukoliko ste primili ovu poruku greškom, molimo Vas, obavijestite pošiljatelja, a poruku i sve njene privitke odmah, bez čitanja, trajno uklonite s računala. Bilo kakvo prenošenje, kopiranje ili distribucija informacija sadržanih u poruci trećim osobama je zabranjeno i može biti zakonski kažnjivo. Sadržaj, stavovi i mišljenja izneseni u poruci su autorovi i ne predstavljaju nužno stavove PayParq Grupe. PayParq Group ne prihvaća nikakvu odgovornost za eventualnu štetu nastalu primitkom ove poruke i priloga sadržanih u poruci.`,
      italian: `DISCLAIMER: Il contenuto di questa email e eventuali allegati è riservato e destinato esclusivamente alle persone o entità indicate come destinatari. Se hai ricevuto questo messaggio per errore, ti preghiamo di notificarlo al mittente e di eliminare permanentemente il messaggio e tutti gli allegati dal tuo computer senza leggerli. Qualsiasi divulgazione, copia o distribuzione delle informazioni contenute in questo messaggio a terzi è proibita e potrebbe essere illegale. Le opinioni espresse in questo messaggio sono solo quelle dell'autore e non rappresentano necessariamente le opinioni di PayParq Group. PayParq Group non assume alcuna responsabilità per eventuali danni causati da questo messaggio.`,
      german: `HAFTUNGSAUSSCHLUSS: Der Inhalt dieser E-Mail und eventueller Anhänge ist vertraulich und ausschließlich für die Personen oder Entitäten bestimmt, die als Empfänger aufgeführt sind. Sollten Sie diese Nachricht versehentlich erhalten haben, bitten wir Sie, den Absender zu benachrichtigen und die Nachricht sowie alle Anhänge sofort und ohne sie zu lesen dauerhaft von Ihrem Computer zu löschen. Jede Weitergabe, Vervielfältigung oder Verteilung von Informationen aus dieser Nachricht an Dritte ist untersagt und kann rechtswidrig sein. Die in dieser Nachricht geäußerten Meinungen sind nur die des Autors und stellen nicht unbedingt die Ansichten von PayParq Group dar. PayPayParq Group übernimmt keine Haftung für Schäden, die durch diese Nachricht entstehen.`,
      spanish: `DESCARGO DE RESPONSABILIDAD: El contenido de este correo electrónico y los anexos adjuntos es confidencial y está destinado únicamente a las personas o entidades indicadas como destinatarios. Si ha recibido este mensaje por error, le pedimos que notifique al remitente y elimine permanentemente el mensaje y todos los anexos de su computadora sin leerlos. Está prohibida la divulgación, copia o distribución de cualquier información contenida en este mensaje a terceros y puede ser ilegal. Las opiniones expresadas en este mensaje son solo las del autor y no representan necesariamente las opiniones de PayParq Group. PayParq Group no asume ninguna responsabilidad por los daños causados por este mensaje.`,
      english: `DISCLAIMER: The contents of this email as well as any files attached to it are confidential and intended solely for individuals or entities to which they are addressed. If you have received this email message in error, please notify the sender and permanently remove the message and all attached files from your computer without reading them. Any disclosure, copying or distribution of all or part of information contained herein to third parties is prohibited and may be unlawful. Please note that any views or opinions presented in this message are solely those of the author and do not necessarily represent the views and opinions of PayParq Group. PayParq Group accepts no liability for any potential damage caused by this message and files attached to it.`,
    },
  },
  'parking-bilingual': {
    subject: 'Parking Space Inquiry',
    body: (name: string) =>
      `<p><b>Poštovani ${name},</b></p>\n\n<p>Da li imate višak praznog parking mjesta?</p>\n\n<p>Mi smo digitalna parking trgovina, oglašavamo prazna mjesta u Vašim terminima po Vašim cijenama, maržu (service fee) plaća kupac.</p>\n\n<p>Zainteresirani?</p>\n\n<hr style="border:none;border-top:1px solid #e0e0e0;margin:16px 0;" />\n<p><b>Karlo Žamić, mag.oec.</b><br />\nManaging Partner, payparq<br />\npayparq.com<br />\n+385915963139</p>`,
    disclaimers: {
      serbian: `<p style="color: #666;">IZJAVA O ODRICANJU ODGOVORNOSTI: Sadržaj ove poruke i eventualno priloženih datoteka je povjerljiv i namijenjen je samo osobama ili subjektima koji su navedeni u adresi. Ukoliko ste primili ovu poruku greškom, molimo Vas, obavijestite pošiljatelja, a poruku i sve njene privitke odmah, bez čitanja, trajno uklonite s računala. Bilo kakvo prenošenje, kopiranje ili distribucija informacija sadržanih u poruci trećim osobama je zabranjeno i može biti zakonski kažnjivo. Sadržaj, stavovi i mišljenja izneseni u poruci su autorovi i ne predstavljaju nužno stavove PayParq Grupe. PayParq Group ne prihvaća nikakvu odgovornost za eventualnu štetu nastalu primitkom ove poruke i priloga sadržanih u poruci.</p><p style="color: #666;">DISCLAIMER: The contents of this email as well as any files attached to it are confidential and intended solely for individuals or entities to which they are addressed. If you have received this email message in error, please notify the sender and permanently remove the message and all attached files from your computer without reading them. Any disclosure, copying or distribution of all or part of information contained herein to third parties is prohibited and may be unlawful. Please note that any views or opinions presented in this message are solely those of the author and do not necessarily represent the views and opinions of PayParq Group. PayParq Group accepts no liability for any potential damage caused by this message.</p>`,
      italian: `<p style="color: #666;">DISCLAIMER: Il contenuto di questa email e eventuali allegati è riservato e destinato esclusivamente alle persone o entità indicate come destinatari. Se hai ricevuto questo messaggio per errore, ti preghiamo di notificarlo al mittente e di eliminare permanentemente il messaggio e tutti gli allegati dal tuo computer senza leggerli. Qualsiasi divulgazione, copia o distribuzione delle informazioni contenute in questo messaggio a terzi è proibita e potrebbe essere illegale. Le opinioni espresse in questo messaggio sono solo quelle dell'autore e non rappresentano necessariamente le opinioni di PayParq Group. PayParq Group non assume alcuna responsabilità per eventuali danni causati da questo messaggio.</p><p style="color: #666;">DISCLAIMER: The contents of this email as well as any files attached to it are confidential and intended solely for individuals or entities to which they are addressed. If you have received this email message in error, please notify the sender and permanently remove the message and all attached files from your computer without reading them. Any disclosure, copying or distribution of all or part of information contained herein to third parties is prohibited and may be unlawful. Please note that any views or opinions presented in this message are solely those of the author and do not necessarily represent the views and opinions of PayParq Group. PayParq Group accepts no liability for any potential damage caused by this message.</p>`,
      german: `<p style="color: #666;">HAFTUNGSAUSSCHLUSS: Der Inhalt dieser E-Mail und eventueller Anhänge ist vertraulich und ausschließlich für die Personen oder Entitäten bestimmt, die als Empfänger aufgeführt sind. Sollten Sie diese Nachricht versehentlich erhalten haben, bitten wir Sie, den Absender zu benachrichtigen und die Nachricht sowie alle Anhänge sofort und ohne sie zu lesen dauerhaft von Ihrem Computer zu löschen. Jede Weitergabe, Vervielfältigung oder Verteilung von Informationen aus dieser Nachricht an Dritte ist untersagt und kann rechtswidrig sein. Die in dieser Nachricht geäußerten Meinungen sind nur die des Autors und stellen nicht unbedingt die Ansichten von PayParq Group dar. PayParq Group übernimmt keine Haftung für Schäden, die durch diese Nachricht entstehen.</p><p style="color: #666;">DISCLAIMER: The contents of this email as well as any files attached to it are confidential and intended solely for individuals or entities to which they are addressed. If you have received this email message in error, please notify the sender and permanently remove the message and all attached files from your computer without reading them. Any disclosure, copying or distribution of all or part of information contained herein to third parties is prohibited and may be unlawful. Please note that any views or opinions presented in this message are solely those of the author and do not necessarily represent the views and opinions of PayParq Group. PayParq Group accepts no liability for any potential damage caused by this message.</p>`,
      spanish: `<p style="color: #666;">DESCARGO DE RESPONSABILIDAD: El contenido de este correo electrónico y los anexos adjuntos es confidencial y está destinado únicamente a las personas o entidades indicadas como destinatarios. Si ha recibido este mensaje por error, le pedimos que notifique al remitente y elimine permanentemente el mensaje y todos los anexos de su computadora sin leerlos. Está prohibida la divulgación, copia o distribución de cualquier información contenida en este mensaje a terceros y puede ser ilegal. Las opiniones expresadas en este mensaje son solo las del autor y no representan necesariamente las opiniones de PayParq Group. PayParq Group no asume ninguna responsabilidad por los daños causados por este mensaje.</p><p style="color: #666;">DISCLAIMER: The contents of this email as well as any files attached to it are confidential and intended solely for individuals or entities to which they are addressed. If you have received this email message in error, please notify the sender and permanently remove the message and all attached files from your computer without reading them. Any disclosure, copying or distribution of all or part of information contained herein to third parties is prohibited and may be unlawful. Please note that any views or opinions presented in this message are solely those of the author and do not necessarily represent the views and opinions of PayParq Group. PayParq Group accepts no liability for any potential damage caused by this message.</p>`,
      english: `<p style="color: #666;">DISCLAIMER: The contents of this email as well as any files attached to it are confidential and intended solely for individuals or entities to which they are addressed. If you have received this email message in error, please notify the sender and permanently remove the message and all attached files from your computer without reading them. Any disclosure, copying or distribution of all or part of information contained herein to third parties is prohibited and may be unlawful. Please note that any views or opinions presented in this message are solely those of the author and do not necessarily represent the views and opinions of PayParq Group. PayParq Group accepts no liability for any potential damage caused by this message.</p>`,
    },
  },
};

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
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState<CRMRow[]>([]);
  const [customEmails, setCustomEmails] = useState<string[]>([]);
  const [customEmailInput, setCustomEmailInput] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [senderType, setSenderType] = useState<'transactional' | 'outreach'>('outreach');
  const [senderRegion, setSenderRegion] = useState<'international' | 'yugoslavia'>('international');
  const [sendingProgress, setSendingProgress] = useState('');
  const [availableRecipients, setAvailableRecipients] = useState<CRMRow[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<'custom' | 'parking' | 'parking-bilingual'>('custom');
  const [templateLanguage, setTemplateLanguage] = useState<'serbian' | 'italian' | 'german' | 'spanish' | 'english'>('serbian');

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
      name: '',
      email: '',
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

    if (!importCity.trim()) {
      alert('Please enter a city name first');
      e.target.value = '';
      return;
    }

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

  const handleOpenEmailModal = (row: CRMRow) => {
    setEmailRecipients([row]);
    setAvailableRecipients(filteredRows.filter((r) => r.id !== row.id));
    setCustomEmails([]);
    setCustomEmailInput('');
    setEmailSubject('');
    setEmailBody('');
    setSenderType('outreach');
    setSenderRegion('international');
    setSendingProgress('');
    setSelectedTemplate('custom');
    setTemplateLanguage('serbian');
    setShowEmailModal(true);
  };

  const handleApplyTemplate = (templateName: string, language: TemplateLanguage) => {
    const template = TEMPLATES[templateName];
    if (template) {
      setSelectedTemplate(templateName as 'custom' | 'parking');
      setTemplateLanguage(language);
      setEmailSubject(template.subject);
      const disclaimer = template.disclaimers[language];
      const bodyWithDisclaimer = `${template.body('X')}\n\n${disclaimer}`;
      setEmailBody(bodyWithDisclaimer);
    }
  };

  const handleAddAllRecipients = () => {
    setEmailRecipients([...emailRecipients, ...availableRecipients]);
    setAvailableRecipients([]);
  };

  const handleAddCustomEmail = () => {
    const email = customEmailInput.trim();
    if (email && !customEmails.includes(email)) {
      setCustomEmails([...customEmails, email]);
      setCustomEmailInput('');
    }
  };

  const handleRemoveCustomEmail = (email: string) => {
    setCustomEmails(customEmails.filter((e) => e !== email));
  };

  const handleAddRecipient = (row: CRMRow) => {
    if (!emailRecipients.find((r) => r.id === row.id)) {
      setEmailRecipients([...emailRecipients, row]);
      setAvailableRecipients(availableRecipients.filter((r) => r.id !== row.id));
    }
  };

  const handleRemoveRecipient = (rowId: string) => {
    const removed = emailRecipients.find((r) => r.id === rowId);
    setEmailRecipients(emailRecipients.filter((r) => r.id !== rowId));
    if (removed) {
      setAvailableRecipients([...availableRecipients, removed]);
    }
  };

  const handleSendEmails = async () => {
    if (!emailSubject.trim() || !emailBody.trim() || (emailRecipients.length === 0 && customEmails.length === 0)) {
      alert('Please fill in all fields and select at least one recipient');
      return;
    }

    try {
      setSendingProgress('Starting...');
      const endpoint = senderType === 'transactional' ? '/api/send-email' : '/api/send-outreach-email';

      const resolveName = (r: CRMRow): string => {
        if (r.name && r.name.trim()) return r.name.trim();
        if (r.company && r.company.trim()) return r.company.trim();
        return 'Sir/Madam';
      };

      const allRecipients = [
        ...emailRecipients.map((r) => ({ email: r.email, name: resolveName(r) })),
        ...customEmails.map((email) => ({ email, name: email.split('@')[0] })),
      ];
      const totalRecipients = allRecipients.length;

      const invalidRecipients = allRecipients.filter((r) => !r.email || !r.email.includes('@'));
      if (invalidRecipients.length > 0) {
        const names = invalidRecipients.map((r) => r.name || r.email).join(', ');
        alert(`These contacts have no email address set: ${names}\n\nPlease fill in the Email column for each contact before sending.`);
        setSendingProgress('');
        return;
      }

      for (let i = 0; i < allRecipients.length; i++) {
        const recipient = allRecipients[i];
        const recipientName = String(recipient.name || recipient.email);
        setSendingProgress(`Sending ${i + 1}/${totalRecipients} to ${recipientName}...`);

        const personalizedBody = emailBody.replace(/X/g, recipientName);

        const payload: any = {
          to: String(recipient.email),
          subject: emailSubject,
          html: personalizedBody,
        };

        if (senderType === 'outreach') {
          payload.nameVariant = senderRegion;
        }

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          let errorMsg = 'Unknown error';
          try {
            const errData = await res.json();
            errorMsg = errData.error || errData.message || JSON.stringify(errData);
          } catch (e) {
            errorMsg = res.statusText;
          }
          throw new Error(`Failed to send to ${recipientName}: ${errorMsg}`);
        }
      }

      setSendingProgress('✅ All emails sent successfully!');
      setTimeout(() => {
        setShowEmailModal(false);
        setSendingProgress('');
      }, 2000);
    } catch (error) {
      alert(`Error sending emails: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setSendingProgress('');
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

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Send Email</h2>
              <button onClick={() => setShowEmailModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Templates */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Template</label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <button
                    onClick={() => setSelectedTemplate('custom')}
                    className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                      selectedTemplate === 'custom'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Custom
                  </button>
                  <button
                    onClick={() => handleApplyTemplate('parking', templateLanguage)}
                    className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                      selectedTemplate === 'parking'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Parking Inquiry
                  </button>
                  <button
                    onClick={() => handleApplyTemplate('parking-bilingual', templateLanguage)}
                    className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                      selectedTemplate === 'parking-bilingual'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Parking (Bilingual)
                  </button>
                </div>

                {(selectedTemplate === 'parking' || selectedTemplate === 'parking-bilingual') && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Language:</label>
                    <div className="grid grid-cols-5 gap-1 mb-3">
                      {(['serbian', 'italian', 'german', 'spanish', 'english'] as TemplateLanguage[]).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => handleApplyTemplate(selectedTemplate as 'parking' | 'parking-bilingual', lang)}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors capitalize ${
                            templateLanguage === lang
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>

                    {/* Preview */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Preview (X = recipient name):</p>
                      <div className="bg-white rounded p-2 text-xs text-gray-900 whitespace-pre-wrap break-words max-h-40 overflow-y-auto font-mono">
                        {emailBody.split('\n').slice(0, 8).join('\n')}...
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Recipients */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-900">Recipients ({emailRecipients.length + customEmails.length})</label>
                  {availableRecipients.length > 0 && (
                    <button
                      onClick={handleAddAllRecipients}
                      className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded font-medium"
                    >
                      Add All ({availableRecipients.length})
                    </button>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-3 space-y-2 mb-3 max-h-40 overflow-y-auto">
                  {emailRecipients.map((r) => (
                    <div key={r.id} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200 text-sm">
                      <span className="text-gray-900">{r.contact} ({r.company})</span>
                      <button
                        onClick={() => handleRemoveRecipient(r.id)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {customEmails.map((email) => (
                    <div key={email} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200 text-sm">
                      <span className="text-gray-900">{email}</span>
                      <button
                        onClick={() => handleRemoveCustomEmail(email)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                {availableRecipients.length > 0 && (
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Add from contacts:</label>
                    <select
                      onChange={(e) => {
                        const selected = availableRecipients.find((r) => r.id === e.target.value);
                        if (selected) handleAddRecipient(selected);
                        e.target.value = '';
                      }}
                      defaultValue=""
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-gray-900 text-sm"
                    >
                      <option value="">Select a contact...</option>
                      {availableRecipients.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.contact} ({r.company})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Or add custom email:</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={customEmailInput}
                      onChange={(e) => setCustomEmailInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleAddCustomEmail();
                      }}
                      placeholder="e.g., kzamic@gmail.com"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-gray-900 text-sm"
                    />
                    <button
                      onClick={handleAddCustomEmail}
                      disabled={!customEmailInput.trim()}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Sender Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Sender</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSenderType('transactional')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                      senderType === 'transactional'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    PayParq (Transactional)
                  </button>
                  <button
                    onClick={() => setSenderType('outreach')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                      senderType === 'outreach'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Karlo (Outreach)
                  </button>
                </div>

                {senderType === 'outreach' && (
                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Region:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSenderRegion('international')}
                        className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                          senderRegion === 'international'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Karlo Zamic (Int'l)
                      </button>
                      <button
                        onClick={() => setSenderRegion('yugoslavia')}
                        className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                          senderRegion === 'yugoslavia'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Karlo Žamić (Yu)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Email subject"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 bg-white"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Message</label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Email message"
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 bg-white resize-none"
                />
              </div>

              {/* Progress */}
              {sendingProgress && (
                <div className={`p-3 rounded-lg text-sm ${
                  sendingProgress.includes('✅')
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {sendingProgress}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowEmailModal(false)}
                  disabled={!!sendingProgress}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Close
                </button>
                <button
                  onClick={handleSendEmails}
                  disabled={!emailSubject.trim() || !emailBody.trim() || (emailRecipients.length === 0 && customEmails.length === 0) || !!sendingProgress}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {sendingProgress ? 'Sending...' : `Send to ${emailRecipients.length + customEmails.length} recipient(s)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider w-16">Email</th>
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
                          onClick={() => handleOpenEmailModal(row)}
                          className="inline-flex items-center justify-center p-1.5 hover:bg-blue-50 text-blue-500 rounded transition-colors"
                        >
                          <Mail size={15} />
                        </button>
                      </td>
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
