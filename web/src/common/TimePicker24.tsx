import React from 'react';

interface TimePicker24Props {
  value: string; // format "HH:mm", ex: "07:30", "14:15"
  onChange: (val: string) => void;
  required?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

export const TimePicker24: React.FC<TimePicker24Props> = ({ value, onChange }) => {
  const [currentHour, currentMin] = (value || '08:00').split(':');

  const handleHourChange = (newHour: string) => {
    onChange(`${newHour}:${currentMin || '00'}`);
  };

  const handleMinChange = (newMin: string) => {
    onChange(`${currentHour || '08'}:${newMin}`);
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', width: '100%' }}>
      <select
        className="input"
        style={{ flex: 1, padding: '0.45rem 0.5rem', textAlign: 'center', fontWeight: 600 }}
        value={currentHour || '08'}
        onChange={(e) => handleHourChange(e.target.value)}
      >
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>:</span>
      <select
        className="input"
        style={{ flex: 1, padding: '0.45rem 0.5rem', textAlign: 'center', fontWeight: 600 }}
        value={currentMin || '00'}
        onChange={(e) => handleMinChange(e.target.value)}
      >
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  );
};

