import React from 'react';
import '../styles/Modal.css';

export default function Modal({ open, title, children, onClose, onSave, saving }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Jooji</button>
          <button className="btn-save" onClick={onSave} disabled={saving}>
            {saving ? <span className="spinner-sm"></span> : 'Kaydi'}
          </button>
        </div>
      </div>
    </div>
  );
}
