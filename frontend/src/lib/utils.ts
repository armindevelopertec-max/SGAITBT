export function initialsOf(firstName?: string, lastName?: string): string {
  return `${firstName ?? ''} ${lastName ?? ''}`
    .trim()
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function fullName(person: {
  firstName?: string;
  paternalSurname?: string;
  maternalSurname?: string;
  lastName?: string;
}): string {
  return `${person.firstName ?? ''} ${person.paternalSurname ?? ''} ${person.maternalSurname ?? ''}`.trim() || person.lastName || '—';
}

export function formatDate(value?: string | Date): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
}
