import React, { useState, useEffect, useCallback } from 'react';
import { donationAPI, donorAPI } from '../services/api';
import Modal from '../components/Modal';
import '../styles/DataPage.css';

const EMPTY_FORM = { donorID: '', donationDate: '', quantityML: '' };

function validateDonation(form) {
  const errors = {};
  if (!form.donorID)         errors.donorID      = 'Donor waa loo baahan yahay';
  if (!form.donationDate)    errors.donationDate  = 'Taariikhda waa loo baahan tahay';
  if (!form.quantityML)      errors.quantityML   = 'Qadarka ML waa loo baahan yahay';
  else {
    const qty = parseInt(form.quantityML);
    if (isNaN(qty) || qty < 100 || qty > 2000)
      errors.quantityML = 'Qadarka ML waa inuu u dhexeeyaa 100 - 2000 ml';
  }
  return errors;
}

export default function BloodDonations() {
  const [donations, setDonations] = useState([]);
  const [filtered,  setFiltered]  = useState([]);
  const [donors,    setDonors]    = useState([]);
  const [search,    setSearch]    = useState('');
  const [loading,   setLoading]   = useState(true);
  const [searching, setSearching] = useState(false);
  const [modal,     setModal]     = useState({ open: false, mode: 'add', data: null });
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [errors,    setErrors]    = useState({});
  const [saving,    setSaving]    = useState(false);
  const [apiError,  setApiError]  = useState('');
  const [success,   setSuccess]   = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [donRes, dRes] = await Promise.all([donationAPI.getAll(), donorAPI.getAll()]);
      setDonations(donRes.data); setFiltered(donRes.data); setDonors(dRes.data);
    } catch { setApiError('Xogta la soo qaadi kari waayay.'); }
    finally { setLoading(false); }
  };

  // ===== SEARCH — server-side =====
  const handleSearch = useCallback(async (value) => {
    setSearch(value); setApiError('');
    if (!value.trim()) { setFiltered(donations); return; }
    setSearching(true);
    try {
      const res = await donationAPI.search(value.trim());
      setFiltered(res.data);
    } catch { setApiError('Raadinta la guulaysan wayday.'); }
    finally { setSearching(false); }
  }, [donations]);

  const openAdd = () => {
    setErrors({}); setApiError(''); setSuccess('');
    setForm({ donorID: '', donationDate: new Date().toISOString().split('T')[0], quantityML: '' });
    setModal({ open: true, mode: 'add', data: null });
  };
  const openEdit = (d) => {
    setErrors({}); setApiError(''); setSuccess('');
    setForm({ donorID: String(d.donorID), donationDate: d.donationDate?.split('T')[0] || '', quantityML: String(d.quantityML) });
    setModal({ open: true, mode: 'edit', data: d });
  };
  const closeModal = () => { setModal({ open: false }); setErrors({}); setApiError(''); setSuccess(''); };

  const handleSave = async () => {
    const ve = validateDonation(form);
    if (Object.keys(ve).length > 0) { setErrors(ve); return; }
    setErrors({}); setSaving(true); setApiError('');
    try {
      const payload = { donorID: parseInt(form.donorID), donationDate: form.donationDate, quantityML: parseInt(form.quantityML) };
      if (modal.mode === 'add') {
        await donationAPI.create(payload);
        setSuccess('Deeq cusub si guul ah ayaa loo kaydiyay!');
      } else {
        await donationAPI.update(modal.data.donationID, payload);
        setSuccess('Deeqda si guul ah ayaa loo cusbooneysiiyay!');
      }
      await loadAll();
      if (search.trim()) await handleSearch(search);
      setTimeout(() => { closeModal(); setSuccess(''); }, 1200);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Kaydintu la guulaysan wayday.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deeqdan tirtirtaa?')) return;
    try {
      await donationAPI.delete(id);
      setSuccess('Deeqda si guul ah ayaa looga tirtirtay.');
      await loadAll();
      if (search.trim()) await handleSearch(search);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setApiError(err.response?.data?.message || 'Tirtirku la guulaysan wayday.'); }
  };

  const field = (key) => ({ value: form[key], onChange: (e) => { setForm({ ...form, [key]: e.target.value }); if (errors[key]) setErrors({ ...errors, [key]: '' }); } });
  const totalML = filtered.reduce((s, d) => s + (d.quantityML || 0), 0);

  return (
    <div className="data-page">
      <div className="page-header">
        <div>
          <h1>💉 Deeqaha Dhiigga</h1>
          <span className="page-sub">Blood Donations — {donations.length} deeq · Wadarta: {totalML.toLocaleString()} ml</span>
        </div>
        <button className="btn-primary" onClick={openAdd}>+ Deeq Cusub</button>
      </div>

      {apiError && !modal.open && <div className="alert alert-error">⚠️ {apiError}</div>}
      {success  && !modal.open && <div className="alert alert-success">✅ {success}</div>}

      <div className="table-toolbar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="Raadi Donor magac ahaan..." value={search} onChange={e => handleSearch(e.target.value)} />
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
            <thead><tr><th>#</th><th>Donor Magac</th><th>Taariikhda</th><th>Quantity (ML)</th><th>Ficil</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="5" className="empty-row">{search ? `"${search}" — lama helin` : 'Deeq la ma kaydinin'}</td></tr>
              ) : filtered.map((d, i) => (
                <tr key={d.donationID}>
                  <td className="row-num">{i + 1}</td>
                  <td className="name-cell"><div className="avatar">{d.donorName?.[0]?.toUpperCase()}</div>{d.donorName}</td>
                  <td>{d.donationDate ? new Date(d.donationDate).toLocaleDateString('so-SO') : '—'}</td>
                  <td><span className="blood-badge">{d.quantityML} ml</span></td>
                  <td className="action-cell">
                    <button className="btn-edit"   onClick={() => openEdit(d)}>✏️ Wax ka beddel</button>
                    <button className="btn-delete" onClick={() => handleDelete(d.donationID)}>🗑 Tirtir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal.open} title={modal.mode === 'add' ? '➕ Deeq Cusub' : '✏️ Deeq Wax ka Beddel'} onClose={closeModal} onSave={handleSave} saving={saving}>
        {apiError && <div className="alert alert-error sm">⚠️ {apiError}</div>}
        {success  && <div className="alert alert-success sm">✅ {success}</div>}
        <div className="form-grid">
          <div className="form-group full">
            <label>Donor <span className="req">*</span></label>
            <select {...field('donorID')}>
              <option value="">— Donor dooro —</option>
              {donors.map(d => <option key={d.donorID} value={d.donorID}>{d.fullName} — {d.bloodGroup}</option>)}
            </select>
            {errors.donorID && <span className="field-error">{errors.donorID}</span>}
          </div>
          <div className="form-group">
            <label>Taariikhda Deeqda <span className="req">*</span></label>
            <input type="date" max={new Date().toISOString().split('T')[0]} {...field('donationDate')} />
            {errors.donationDate && <span className="field-error">{errors.donationDate}</span>}
          </div>
          <div className="form-group">
            <label>Quantity ML <span className="req">*</span> <small>(100–2000)</small></label>
            <input type="number" min="100" max="2000" placeholder="Tusaale: 450" {...field('quantityML')} />
            {errors.quantityML && <span className="field-error">{errors.quantityML}</span>}
          </div>
        </div>
      </Modal>
    </div>
  );
}
