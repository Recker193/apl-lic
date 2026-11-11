import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { ModalPortal } from './ModalPortal';

interface ReasonPromptModalProps {
  isOpen: boolean;
  title: string;
  label: string;
  placeholder?: string;
  confirmLabel: string;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

/**
 * Colectează un motiv într-un formular din aplicație și afișează eroarea
 * serverului în modal. `window.prompt` poate fi suprimat de browser (returnează
 * null), ceea ce anula acțiunea fără nicio cerere și fără niciun mesaj.
 */
export const ReasonPromptModal: React.FC<ReasonPromptModalProps> = ({
  isOpen,
  title,
  label,
  placeholder,
  confirmLabel,
  busy = false,
  error,
  onClose,
  onSubmit,
}) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed || busy) return;
    onSubmit(trimmed);
  };

  return (
    <ModalPortal>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '1rem',
          backdropFilter: 'blur(3px)',
          overscrollBehavior: 'contain',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget && !busy) onClose();
        }}
      >
        <div
          className="card"
          style={{
            backgroundColor: 'var(--bg-card, #1e293b)',
            color: 'var(--text-main, #f8fafc)',
            borderRadius: '16px',
            padding: '1.75rem',
            maxWidth: '440px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid var(--border)',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>{title}</h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div>
              <label className="label">{label}</label>
              <textarea
                className="input"
                rows={3}
                autoFocus
                required
                placeholder={placeholder}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={busy}
              />
            </div>

            {error && (
              <div
                className="alert-error"
                role="alert"
                style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem' }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.25rem' }}>
              <button type="button" className="btn btn-outline" onClick={onClose} disabled={busy}>
                Anulează
              </button>
              <button type="submit" className="btn btn-primary" disabled={busy || !reason.trim()}>
                {busy ? 'Se salvează...' : confirmLabel}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};
