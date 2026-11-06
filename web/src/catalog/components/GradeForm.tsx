import React, { useState } from 'react';

interface GradeFormProps {
  onSubmit: (data: {
    studentId: string;
    type: string;
    value: number;
    gradedAt: string;
    comment?: string;
  }) => void;
  onCancel: () => void;
  students: { id: string; name: string }[];
}

export const GradeForm: React.FC<GradeFormProps> = ({
  onSubmit,
  onCancel,
  students,
}) => {
  const [formData, setFormData] = useState({
    studentId: '',
    type: 'TEST',
    value: 10,
    gradedAt: new Date().toISOString().split('T')[0],
    comment: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="grade-form">
      <form onSubmit={handleSubmit}>
        <div>
          <label>Elev:</label>
          <select
            value={formData.studentId}
            onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
            required
          >
            <option value="">Selectează elevul</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Tip notă:</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          >
            <option value="ORAL">Oral</option>
            <option value="TEST">Test</option>
            <option value="HOMEWORK">Tema</option>
            <option value="PROJECT">Proiect</option>
            <option value="THESIS">Teză</option>
          </select>
        </div>

        <div>
          <label>Notă (1-10):</label>
          <input
            type="number"
            min="1"
            max="10"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: parseInt(e.target.value) })}
            required
          />
        </div>

        <div>
          <label>Data:</label>
          <input
            type="date"
            value={formData.gradedAt}
            onChange={(e) => setFormData({ ...formData, gradedAt: e.target.value })}
            required
          />
        </div>

        <div>
          <label>Comentariu (opțional):</label>
          <input
            type="text"
            value={formData.comment}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
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
