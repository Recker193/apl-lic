/**
 * Formatează o dată în formatul 24 de ore (ex: 08.11.2026, 14:30)
 */
export function formatDateTime24(dateInput: string | Date | number): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('ro-RO', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formatează doar ora în formatul 24 de ore (ex: 14:30)
 */
export function formatTime24(dateInput: string | Date | number): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('ro-RO', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formatează doar data (ex: 08.11.2026)
 */
export function formatDateRo(dateInput: string | Date | number): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ro-RO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

