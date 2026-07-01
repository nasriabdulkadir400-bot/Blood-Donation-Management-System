import React, { useState, useEffect, useCallback } from 'react';
import { donorAPI } from '../services/api';
import Modal from '../components/Modal';
import '../styles/DataPage.css';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const EMPTY_FORM = { fullName: '', gender: '', bloodGroup: '', phone: '', address: '' };

// ===== FORM VALIDATION — client-side =====
function validateDonor(form) {
  const errors = {};
  // Required Fields
  if (!form.fullName.trim())       errors.fullName   = 'Magaca buuxa waa loo baahan yahay';
  else if (form.fullName.trim().length < 2) errors.fullName = 'Magaca waa inuu ka koobnaadaa ugu yaraan 2 xaraf';
  if (!form.bloodGroup)            errors.bloodGroup = 'Koox dhiigga waa loo baahan yahay';
  // Empty Field Checking — phone optional but if entered must be numeric-ish
  if (form.phone && !/^[0-9+\-\s()]{7,20}$/.test(form.phone))
    errors.phone = 'Telefoon sax ah geli (7-20 xaraf, tiro kaliya)';
  return errors;
}

export default function Donors() {
  const [donors,   setDonors]   = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search,   setSearch]   = useState('');
  const [loading,  setLoading]  = useState(true);
  const [searching,setSearching]= useState(false);
  const [modal,    setModal]    = useState({ open: false, mode: 'add', data: null });
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [errors,   setErrors]   = useState({});
  const [saving,   setSaving]   = useState(false);
  const [apiError, setApiError] = useState('');
  const [success,  setSuccess]  = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const res = await donorAPI.getAll();
      setDonors(res.data);
      setFiltered(res.data);
    } catch {
      setApiError('Xogta la soo qaadi kari waayay. Hubi server-ka.');
    } finally {
      setLoading(false);
    }
  };

  // ===== SEARCH — server-side API call =====
  const handleSearch = useCallback(async (value) => {
    setSearch(value);
    setApiError('');
    if (!value.trim()) {
      setFiltered(donors);
      return;
    }
    setSearching(true);
    try {
      const res = await donorAPI.search(value.trim());
      setFiltered(res.data);
    } catch {
      setApiError('Raadinta la guulaysan wayday.');
    } finally {
      setSearching(false);
    }
  }, [donors]);

  const openAdd = () => {
    setErrors({}); setApiError(''); setSuccess('');
    setForm(EMPTY_FORM);
    setModal({ open: true, mode: 'add', data: null });
  };

  const openEdit = (d) => {
    setErrors({}); setApiError(''); setSuccess('');
    setForm({ fullName: d.fullName, gender: d.gender || '', bloodGroup: d.bloodGroup, phone: d.phone || '', address: d.address || '' });
    setModal({ open: true, mode: 'edit', data: d });
  };

  const closeModal = () => {
    setModal({ open: false }); setErrors({}); setApiError(''); setSuccess('');
  };

  const handleSave = async () => {
    // Client-side Form Validation
    const validationErrors = validateDonor(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    setApiError('');
    try {
      const payload = { fullName: form.fullName.trim(), gender: form.gender || null, bloodGroup: form.bloodGroup, phone: form.phone || null, address: form.address || null };
      if (modal.mode === 'add') {
        await donorAPI.create(payload);
        setSuccess('Donor cusub si guul ah ayaa loo kaydiyay!');
      } else {
        await donorAPI.update(modal.data.donorID, payload);
        setSuccess('Donor si guul ah ayaa loo cusbooneysiiyay!');
      }
      await loadAll();
      if (search.trim()) await handleSearch(search);
      setTimeout(() => { closeModal(); setSuccess(''); }, 1200);
    } catch (err) {
      // User-Friendly Error Messages from API
      const msg = err.response?.data?.message || 'Kaydintu la guulaysan wayday.';
      setApiError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`"${name}" tirtirtaa? Ficilkan lama noqon karo.`)) return;
    setApiError(''); setSuccess('');
    try {
      await donorAPI.delete(id);
      setSuccess(`"${name}" si guul ah ayaa looga tirtirtay.`);
      await loadAll();
      if (search.trim()) await handleSearch(search);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Tirtirku la guulaysan wayday.');
    }
  };

  const field = (key) => ({
    value: form[key],
    onChange: (e) => { setForm({ ...form, [key]: e.target.value }); if (errors[key]) setErrors({ ...errors, [key]: '' }); },
    className: errors[key] ? 'input-error' : ''
  });

  return (
    <div className="data-page">
      <div className="page-header">
        <div>
          <h1>🩸 Wadaagayaasha Dhiigga</h1>
          <span className="page-sub">Donors — {donors.length} qof oo diiwan ah</span>
        </div>
        <button className="btn-primary" onClick={openAdd}>+ Kudar Donor</button>
      </div>

      {apiError && !modal.open && <div className="alert alert-error">⚠️ {apiError}</div>}
      {success  && !modal.open && <div className="alert alert-success">✅ {success}</div>}

      {/* ===== SEARCH BAR ===== */}
      <div className="table-toolbar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Raadi Donor magac ahaan..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />
          {searching && <span className="search-spinner">⏳</span>}
          {search && <button className="search-clear" onClick={() => handleSearch('')}>✕</button>}
        </div>
        <span className="count-label">{filtered.length} natiijooyinka</span>
      </div>

      {loading ? (
        <div className="page-loading"><div className="loading-pulse">🩸</div><p>Xogta la soo rarayo...</p></div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>Magaca</th><th>Jinsiga</th><th>Koox Dhiig</th><th>Telefoon</th><th>Cinwaan</th><th>Ficil</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="7" className="empty-row">
                  {search ? `"${search}" — Donor lama helin` : 'Donor la ma kaydinin weli'}
                </td></tr>
              ) : filtered.map((d, i) => (
                <tr key={d.donorID}>
                  <td className="row-num">{i + 1}</td>
                  <td className="name-cell"><div className="avatar">{d.fullName?.[0]?.toUpperCase()}</div>{d.fullName}</td>
                  <td>{d.gender || '—'}</td>
                  <td><span className="blood-badge">{d.bloodGroup}</span></td>
                  <td>{d.phone   || '—'}</td>
                  <td>{d.address || '—'}</td>
                  <td className="action-cell">
                    <button className="btn-edit"   onClick={() => openEdit(d)}>✏️ Wax ka beddel</button>
                    <button className="btn-delete" onClick={() => handleDelete(d.donorID, d.fullName)}>🗑 Tirtir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal.open} title={modal.mode === 'add' ? '➕ Donor Cusub' : '✏️ Donor Wax ka Beddel'} onClose={closeModal} onSave={handleSave} saving={saving}>
        {apiError && <div className="alert alert-error sm">⚠️ {apiError}</div>}
        {success  && <div className="alert alert-success sm">✅ {success}</div>}
        <div className="form-grid">
          <div className="form-group full">
            <label>Magaca Buuxa <span className="req">*</span></label>
            <input placeholder="Tusaale: Ahmed Ali" {...field('fullName')} />
            {errors.fullName && <span className="field-error">{errors.fullName}</span>}
          </div>
          <div className="form-group">
            <label>Jinsiga</label>
            <select {...field('gender')}>
              <option value="">— Dooro —</option>
              <option value="Male">Lab (Male)</option>
              <option value="Female">Dheddig (Female)</option>
            </select>
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
            <input placeholder="Tusaale: 0612345678" {...field('phone')} />
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </div>
          <div className="form-group full">
            <label>Cinwaan</label>
            <input placeholder="Magaala, Degmo..." {...field('address')} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
