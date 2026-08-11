export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function parseToDate(dateInput: string | number | Date): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput;

  if (typeof dateInput === "number") {
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? null : d;
  }

  let str = String(dateInput).trim();
  if (!str) return null;

  // If string does not end with Z or timezone offset (+03:00 / +00:00), append +03:00 for Turkey time
  if (!str.endsWith("Z") && !/[+-]\d{2}:?\d{2}$/.test(str)) {
    str = str.replace(" ", "T") + "+03:00";
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDate(dateInput: string | number | Date): string {
  const d = parseToDate(dateInput);
  if (!d) return '';

  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Istanbul',
  }).format(d);
}

export function formatTime(dateInput: string | number | Date): string {
  const d = parseToDate(dateInput);
  if (!d) return '';

  return new Intl.DateTimeFormat('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Istanbul',
  }).format(d);
}

export function formatDateTime(dateInput: string | number | Date): string {
  const d = parseToDate(dateInput);
  if (!d) return '';

  const datePart = formatDate(d);
  const timePart = formatTime(d);
  return `${datePart} ${timePart}`;
}
