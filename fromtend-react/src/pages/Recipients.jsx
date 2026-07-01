import React, { useState, useEffect, useCallback } from 'react';
import { recipientAPI } from '../services/api';
import Modal from '../components/Modal';
import '../styles/DataPage.css';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const EMPTY_FORM = { fullName: '', bloodGroup: '', phone: '', hospitalName: '' };

function validateRecipient(form) {
  const errors = {};
  if (!form.fullName.trim())       errors.fullName   = 'Magaca buuxa waa loo baahan yahay';
  else if (form.fullName.trim().length < 2) errors.fullName = 'Magaca waa inuu ka koobnaadaa ugu yaraan 2 xaraf';
  if (!form.bloodGroup)            errors.bloodGroup = 'Koox dhiigga waa loo baahan yahay';
  if (form.phone && !/^[0-9+\-\s()]{7,20}$/.test(form.phone))
    errors.phone = 'Telefoon sax ah geli (7-20 xaraf, tiro kaliya)';
  return errors;
}

export default function Recipients() {
  const [recipients, setRecipients] = useState([]);
  const [filtered,   setFiltered]   = useState([]);
  const [search,     setSearch]     = useState('');
  const [loading,    setLoading]    = useState(true);
  const [searching,  setSearching]  = useState(false);
  const [modal,      setModal]      = useState({ open: false, mode: 'add', data: null });
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [errors,     setErrors]     = useState({});
  const [saving,     setSaving]     = useState(false);
  const [apiError,   setApiError]   = useState('');
  const [success,    setSuccess]    = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const res = await recipientAPI.getAll();
      setRecipients(res.data); setFiltered(res.data);
    } catch { setApiError('Xogta la soo qaadi kari waayay.'); }
    finally { setLoading(false); }
  };

  // ===== SEARCH — server-side =====
  const handleSearch = useCallback(async (value) => {
    setSearch(value); setApiError('');
    if (!value.trim()) { setFiltered(recipients); return; }
    setSearching(true);
    try {
      const res = await recipientAPI.search(value.trim());
      setFiltered(res.data);
    } catch { setApiError('Raadinta la guulaysan wayday.'); }
    finally { setSearching(false); }
  }, [recipients]);

  const openAdd = () => {
    setErrors({}); setApiError(''); setSuccess('');
    setForm(EMPTY_FORM);
    setModal({ open: true, mode: 'add', data: null });
  };
  const openEdit = (r) => {
    setErrors({}); setApiError(''); setSuccess('');
    setForm({ fullName: r.fullName, bloodGroup: r.bloodGroup, phone: r.phone || '', hospitalName: r.hospitalName || '' });
    setModal({ open: true, mode: 'edit', data: r });
  };
  const closeModal = () => { setModal({ open: false }); setErrors({}); setApiError(''); setSuccess(''); };

  const handleSave = async () => {
    const ve = validateRecipient(form);
    if (Object.keys(ve).length > 0) { setErrors(ve); return; }
    setErrors({}); setSaving(true); setApiError('');
    try {
      const payload = { fullName: form.fullName.trim(), bloodGroup: form.bloodGroup, phone: form.phone || null, hospitalName: form.hospitalName || null };
      if (modal.mode === 'add') {
        await recipientAPI.create(payload);
        setSuccess('Recipient cusub si guul ah ayaa loo kaydiyay!');
      } else {
        await recipientAPI.update(modal.data.recipientID, payload);
        setSuccess('Recipient si guul ah ayaa loo cusbooneysiiyay!');
      }
      await loadAll();
      if (search.trim()) await handleSearch(search);
      setTimeout(() => { closeModal(); setSuccess(''); }, 1200);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Kaydintu la guulaysan wayday.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`"${name}" tirtirtaa?`)) return;
    setApiError('');
    try {
      await recipientAPI.delete(id);
      setSuccess(`"${name}" si guul ah ayaa looga tirtirtay.`);
      await loadAll();
      if (search.trim()) await handleSearch(search);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setApiError(err.response?.data?.message || 'Tirtirku la guulaysan wayday.'); }
  };

  const field = (key) => ({
    value: form[key],
    onChange: (e) => { setForm({ ...form, [key]: e.target.value }); if (errors[key]) setErrors({ ...errors, [key]: '' }); },
  });

  return (
    <div className="data-page">
      <div className="page-header">
        <div>
          <h1>🏥 Qaatayaasha Dhiigga</h1>
          <span className="page-sub">Recipients — {recipients.length} qof oo diiwan ah</span>
        </div>
        <button className="btn-primary" onClick={openAdd}>+ Kudar Recipient</button>
      </div>

      {apiError && !modal.open && <div className="alert alert-error">⚠️ {apiError}</div>}
      {success  && !modal.open && <div className="alert alert-success">✅ {success}</div>}

      <div className="table-toolbar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="Raadi Recipient magac ahaan..." value={search} onChange={e => handleSearch(e.target.value)} />
          {searching && <span className="search-spinner">⏳</span>}
          {search && <button className="search-clear" onClick={() => handleSearch('')}>✕</button>}
        </div>
        <span className="count-label">{filtered.length} natiijooyinka</span>
      </div>

      {loading ? (
        <div className="page-loading"><div className="loading-pulse">🩸</div><p>La soo rarayo...</p></div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead><tr><th>#</th><th>Magaca</th><th>Koox Dhiig</th><th>Telefoon</th><th>Isbitaalka</th><th>Ficil</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="6" className="empty-row">{search ? `"${search}" — lama helin` : 'Wax la ma kaydinin'}</td></tr>
              ) : filtered.map((r, i) => (
                <tr key={r.recipientID}>
                  <td className="row-num">{i + 1}</td>
                  <td className="name-cell"><div className="avatar hospital">🏥</div>{r.fullName}</td>
                  <td><span className="blood-badge">{r.bloodGroup}</span></td>
                  <td>{r.phone        || '—'}</td>
                  <td>{r.hospitalName || '—'}</td>
                  <td className="action-cell">
                    <button className="btn-edit"   onClick={() => openEdit(r)}>✏️ Wax ka beddel</button>
                    <button className="btn-delete" onClick={() => handleDelete(r.recipientID, r.fullName)}>🗑 Tirtir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal.open} title={modal.mode === 'add' ? '➕ Recipient Cusub' : '✏️ Recipient Wax ka Beddel'} onClose={closeModal} onSave={handleSave} saving={saving}>
        {apiError && <div className="alert alert-error sm">⚠️ {apiError}</div>}
        {success  && <div className="alert alert-success sm">✅ {success}</div>}
        <div className="form-grid">
          <div className="form-group full">
            <label>Magaca Buuxa <span className="req">*</span></label>
            <input placeholder="Tusaale: Maryan Ahmed" {...field('fullName')} />
            {errors.fullName && <span className="field-error">{errors.fullName}</span>}
          </div>
          <div className="form-group">
            <label>Koox Dhiig <span className="req">*</span></label>
            <select {...field('bloodGroup')}>
              <option value="">— Dooro —</option>
              {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            {errors.bloodGroup && <span className="field-error">{errors.bloodGroup}</span>}
          </div>
          <div className="form-group">
            <label>Telefoon</label>
            <input placeholder="Tusaale: 0615566778" {...field('phone')} />
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </div>
          <div className="form-group full">
            <label>Isbitaalka</label>
            <input placeholder="Tusaale: Banadir Hospital" {...field('hospitalName')} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
