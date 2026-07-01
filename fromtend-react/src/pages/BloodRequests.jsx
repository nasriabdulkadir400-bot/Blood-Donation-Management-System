import React, { useState, useEffect, useCallback } from 'react';
import { requestAPI, recipientAPI } from '../services/api';
import Modal from '../components/Modal';
import '../styles/DataPage.css';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const EMPTY_FORM = { recipientID: '', bloodGroup: '', quantityML: '', requestDate: '' };

function validateRequest(form) {
  const errors = {};
  if (!form.recipientID)  errors.recipientID = 'Recipient waa loo baahan yahay';
  if (!form.bloodGroup)   errors.bloodGroup  = 'Koox dhiigga waa loo baahan yahay';
  if (!form.requestDate)  errors.requestDate  = 'Taariikhda waa loo baahan tahay';
  if (!form.quantityML)   errors.quantityML  = 'Qadarka ML waa loo baahan yahay';
  else {
    const qty = parseInt(form.quantityML);
    if (isNaN(qty) || qty < 100 || qty > 5000)
      errors.quantityML = 'Qadarka ML waa inuu u dhexeeyaa 100 - 5000 ml';
  }
  return errors;
}

export default function BloodRequests() {
  const [requests,   setRequests]   = useState([]);
  const [filtered,   setFiltered]   = useState([]);
  const [recipients, setRecipients] = useState([]);
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
      const [reqRes, recRes] = await Promise.all([requestAPI.getAll(), recipientAPI.getAll()]);
      setRequests(reqRes.data); setFiltered(reqRes.data); setRecipients(recRes.data);
    } catch { setApiError('Xogta la soo qaadi kari waayay.'); }
    finally { setLoading(false); }
  };

  // ===== SEARCH — server-side =====
  const handleSearch = useCallback(async (value) => {
    setSearch(value); setApiError('');
    if (!value.trim()) { setFiltered(requests); return; }
    setSearching(true);
    try {
      const res = await requestAPI.search(value.trim());
      setFiltered(res.data);
    } catch { setApiError('Raadinta la guulaysan wayday.'); }
    finally { setSearching(false); }
  }, [requests]);

  const openAdd = () => {
    setErrors({}); setApiError(''); setSuccess('');
    setForm({ recipientID: '', bloodGroup: '', quantityML: '', requestDate: new Date().toISOString().split('T')[0] });
    setModal({ open: true, mode: 'add', data: null });
  };
  const openEdit = (r) => {
    setErrors({}); setApiError(''); setSuccess('');
    setForm({ recipientID: String(r.recipientID), bloodGroup: r.bloodGroup, quantityML: String(r.quantityML), requestDate: r.requestDate?.split('T')[0] || '' });
    setModal({ open: true, mode: 'edit', data: r });
  };
  const closeModal = () => { setModal({ open: false }); setErrors({}); setApiError(''); setSuccess(''); };

  const handleSave = async () => {
    const ve = validateRequest(form);
    if (Object.keys(ve).length > 0) { setErrors(ve); return; }
    setErrors({}); setSaving(true); setApiError('');
    try {
      const payload = { recipientID: parseInt(form.recipientID), bloodGroup: form.bloodGroup, quantityML: parseInt(form.quantityML), requestDate: form.requestDate };
      if (modal.mode === 'add') {
        await requestAPI.create(payload);
        setSuccess('Codsi cusub si guul ah ayaa loo kaydiyay!');
      } else {
        await requestAPI.update(modal.data.requestID, payload);
        setSuccess('Codsiga si guul ah ayaa loo cusbooneysiiyay!');
      }
      await loadAll();
      if (search.trim()) await handleSearch(search);
      setTimeout(() => { closeModal(); setSuccess(''); }, 1200);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Kaydintu la guulaysan wayday.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Codsigan tirtirtaa?')) return;
    try {
      await requestAPI.delete(id);
      setSuccess('Codsiga si guul ah ayaa looga tirtirtay.');
      await loadAll();
      if (search.trim()) await handleSearch(search);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setApiError(err.response?.data?.message || 'Tirtirku la guulaysan wayday.'); }
  };

  const field = (key) => ({ value: form[key], onChange: (e) => { setForm({ ...form, [key]: e.target.value }); if (errors[key]) setErrors({ ...errors, [key]: '' }); } });

  return (
    <div className="data-page">
      <div className="page-header">
        <div>
          <h1>📋 Codsiyada Dhiigga</h1>
          <span className="page-sub">Blood Requests — {requests.length} codsi</span>
        </div>
        <button className="btn-primary" onClick={openAdd}>+ Codsi Cusub</button>
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
            <thead><tr><th>#</th><th>Recipient Magac</th><th>Koox Dhiig</th><th>Quantity ML</th><th>Taariikhda</th><th>Ficil</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="6" className="empty-row">{search ? `"${search}" — lama helin` : 'Codsi la ma kaydinin'}</td></tr>
              ) : filtered.map((r, i) => (
                <tr key={r.requestID}>
                  <td className="row-num">{i + 1}</td>
                  <td className="name-cell"><div className="avatar hospital">📋</div>{r.recipientName}</td>
                  <td><span className="blood-badge">{r.bloodGroup}</span></td>
                  <td><span className="blood-badge">{r.quantityML} ml</span></td>
                  <td>{r.requestDate ? new Date(r.requestDate).toLocaleDateString('so-SO') : '—'}</td>
                  <td className="action-cell">
                    <button className="btn-edit"   onClick={() => openEdit(r)}>✏️ Wax ka beddel</button>
                    <button className="btn-delete" onClick={() => handleDelete(r.requestID)}>🗑 Tirtir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal.open} title={modal.mode === 'add' ? '➕ Codsi Cusub' : '✏️ Codsi Wax ka Beddel'} onClose={closeModal} onSave={handleSave} saving={saving}>
        {apiError && <div className="alert alert-error sm">⚠️ {apiError}</div>}
        {success  && <div className="alert alert-success sm">✅ {success}</div>}
        <div className="form-grid">
          <div className="form-group full">
            <label>Recipient <span className="req">*</span></label>
            <select {...field('recipientID')}>
              <option value="">— Recipient dooro —</option>
              {recipients.map(r => <option key={r.recipientID} value={r.recipientID}>{r.fullName} — {r.bloodGroup}</option>)}
            </select>
            {errors.recipientID && <span className="field-error">{errors.recipientID}</span>}
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
            <label>Quantity ML <span className="req">*</span> <small>(100–5000)</small></label>
            <input type="number" min="100" max="5000" placeholder="Tusaale: 450" {...field('quantityML')} />
            {errors.quantityML && <span className="field-error">{errors.quantityML}</span>}
          </div>
          <div className="form-group full">
            <label>Taariikhda <span className="req">*</span></label>
            <input type="date" max={new Date().toISOString().split('T')[0]} {...field('requestDate')} />
            {errors.requestDate && <span className="field-error">{errors.requestDate}</span>}
          </div>
        </div>
      </Modal>
    </div>
  );
}
