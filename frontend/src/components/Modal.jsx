import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, size = '', children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content ${size}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className={`modal-body ${size === 'large' ? 'scrollable' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
