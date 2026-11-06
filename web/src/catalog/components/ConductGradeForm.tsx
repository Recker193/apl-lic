import React, { useState } from 'react';

interface ConductGradeFormProps {
  onSubmit: (data: { value: number }) => void;
  onCancel: () => void;
  currentValue?: number;
}

export const ConductGradeForm: React.FC<ConductGradeFormProps> = ({
  onSubmit,
  onCancel,
  currentValue,
}) => {
  const [value, setValue] = useState(currentValue || 10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ value });
  };

  return (
    <div className="conduct-grade-form">
      <form onSubmit={handleSubmit}>
        <div>
          <label>Notă purtare (1-10):</label>
          <input
            type="number"
            min="1"
            max="10"
            value={value}
            onChange={(e) => setValue(parseInt(e.target.value))}
            required
          />
        </div>

        <div className="form-actions">
          <button type="submit">Salvează</button>
          <button type="button" onClick={onCancel}>
            Anulează
          </button>
        </div>
      </form>
    </div>
  );
};
