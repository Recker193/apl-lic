import React, { useRef } from 'react';

interface TimeInput24Props {
  value: string; // format "HH:mm"
  onChange: (val: string) => void;
  onComplete?: () => void;
  hourInputRef?: React.RefObject<HTMLInputElement | null>;
}

export const TimeInput24: React.FC<TimeInput24Props> = ({
  value,
  onChange,
  onComplete,
  hourInputRef,
}) => {
  const defaultHourRef = useRef<HTMLInputElement>(null);
  const hourRef = hourInputRef || defaultHourRef;
  const minRef = useRef<HTMLInputElement>(null);

  // Stare internă pentru zecile orei/minutului când utilizatorul introduce cifre
  const hourDigitRef = useRef<string | null>(null);
  const minDigitRef = useRef<string | null>(null);

  const [hour, minute] = (value || '08:00').split(':');

  const handleHourKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Săgeată dreapta sau Tab / Colon -> trecere directă la minut
    if (e.key === 'ArrowRight' || e.key === ':' || e.key === 'Tab') {
      if (e.key !== 'Tab') {
        e.preventDefault();
        minRef.current?.focus();
        minRef.current?.select();
      }
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      hourDigitRef.current = null;
      onChange(`00:${minute || '00'}`);
      return;
    }

    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      const num = parseInt(e.key, 10);

      // Dacă utilizatorul a tastat deja 1 sau 2
      if (hourDigitRef.current !== null) {
        const first = hourDigitRef.current;
        hourDigitRef.current = null;

        if (first === '1') {
          // 10..19 valid -> salvăm și sărim direct la minut
          const newH = `1${num}`;
          onChange(`${newH}:${minute || '00'}`);
          minRef.current?.focus();
          minRef.current?.select();
          return;
        } else if (first === '2') {
          // 20..23 valid
          if (num <= 3) {
            const newH = `2${num}`;
            onChange(`${newH}:${minute || '00'}`);
            minRef.current?.focus();
            minRef.current?.select();
            return;
          } else {
            // 24-29 invalid, considerăm că a vrut cifra unităților 0{num}
            onChange(`0${num}:${minute || '00'}`);
            minRef.current?.focus();
            minRef.current?.select();
            return;
          }
        }
      }

      // Prima cifră tastată
      // Dacă tastează 3..9 -> sare automat la minut cu 03..09
      if (num >= 3 && num <= 9) {
        hourDigitRef.current = null;
        onChange(`0${num}:${minute || '00'}`);
        minRef.current?.focus();
        minRef.current?.select();
        return;
      }

      // Dacă tastează 0 -> devine 00 și așteaptă a doua cifră
      if (num === 0) {
        hourDigitRef.current = '0';
        onChange(`00:${minute || '00'}`);
        return;
      }

      // Dacă tastează 1 sau 2 -> îl lasă să completeze a doua cifră
      if (num === 1 || num === 2) {
        hourDigitRef.current = String(num);
        onChange(`0${num}:${minute || '00'}`);
        // Rămâne pe input-ul de oră pentru a introduce a doua cifră!
      }
    }
  };

  const handleHourBlur = () => {
    hourDigitRef.current = null;
  };

  const handleMinKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Săgeată stânga -> întoarcere la oră
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      hourRef.current?.focus();
      hourRef.current?.select();
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      minDigitRef.current = null;
      onChange(`${hour || '08'}:00`);
      return;
    }

    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      const num = parseInt(e.key, 10);

      // Dacă avem prima cifră a minutului deja introdusă (0..5)
      if (minDigitRef.current !== null) {
        const first = minDigitRef.current;
        minDigitRef.current = null;
        const newM = `${first}${num}`;
        onChange(`${hour || '08'}:${newM}`);
        onComplete?.();
        return;
      }

      // Prima cifră a minutului
      // Dacă tastează 6..9 -> minutul nu poate avea zeci 6-9, deci devine 06..09 și trece mai departe
      if (num >= 6) {
        minDigitRef.current = null;
        onChange(`${hour || '08'}:0${num}`);
        onComplete?.();
        return;
      }

      // Dacă tastează 0..5 -> îl lasă să bage a doua cifră a minutului
      minDigitRef.current = String(num);
      onChange(`${hour || '08'}:0${num}`);
    }
  };

  const handleMinBlur = () => {
    minDigitRef.current = null;
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '0.375rem',
        padding: '0.35rem 0.5rem',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <input
        ref={hourRef}
        type="text"
        inputMode="numeric"
        value={hour || '08'}
        onKeyDown={handleHourKeyDown}
        onBlur={handleHourBlur}
        onFocus={(e) => {
          hourDigitRef.current = null;
          e.target.select();
        }}
        onChange={() => {}}
        placeholder="HH"
        maxLength={2}
        style={{
          width: '32px',
          border: 'none',
          outline: 'none',
          backgroundColor: 'transparent',
          textAlign: 'center',
          fontWeight: 700,
          fontSize: '0.95rem',
          color: 'var(--text-main)',
        }}
      />
      <span style={{ fontWeight: 800, color: 'var(--text-muted)', margin: '0 3px' }}>:</span>
      <input
        ref={minRef}
        type="text"
        inputMode="numeric"
        value={minute || '00'}
        onKeyDown={handleMinKeyDown}
        onBlur={handleMinBlur}
        onFocus={(e) => {
          minDigitRef.current = null;
          e.target.select();
        }}
        onChange={() => {}}
        placeholder="MM"
        maxLength={2}
        style={{
          width: '32px',
          border: 'none',
          outline: 'none',
          backgroundColor: 'transparent',
          textAlign: 'center',
          fontWeight: 700,
          fontSize: '0.95rem',
          color: 'var(--text-main)',
        }}
      />
    </div>
  );
};
