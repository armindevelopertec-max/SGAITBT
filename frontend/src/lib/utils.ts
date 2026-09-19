export type PersonNameFields = {
  firstName?: string;
  paternalSurname?: string;
  maternalSurname?: string;
  lastName?: string;
  ci?: string;
  ciExtension?: string;
  phone?: string;
};

export function initialsOf(firstName?: string, lastName?: string): string {
  return `${firstName ?? ''} ${lastName ?? ''}`
    .trim()
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function fullName(person: PersonNameFields): string {
  return `${person.firstName ?? ''} ${person.paternalSurname ?? ''} ${person.maternalSurname ?? ''}`.trim() || person.lastName || '—';
}

export function fullSurname(person?: PersonNameFields | null): string {
  if (!person) return '—';
  return person.lastName || [person.paternalSurname, person.maternalSurname].filter(Boolean).join(' ') || '—';
}

export function paternalOf(person?: PersonNameFields | null): string {
  if (!person) return '—';
  if (person.paternalSurname) return person.paternalSurname;
  return person.lastName?.split(' ')[0] || '—';
}

export function maternalOf(person?: PersonNameFields | null): string {
  if (!person) return '—';
  if (person.maternalSurname) return person.maternalSurname;
  const parts = person.lastName?.split(' ') || [];
  return parts.length > 1 ? parts.slice(1).join(' ') : '—';
}

export function fullSurnames(person?: PersonNameFields | null): string {
  const parts = [paternalOf(person), maternalOf(person)].filter((v) => v !== '—');
  return parts.length ? parts.join(' ') : '—';
}

export function ciText(person?: PersonNameFields | null): string {
  if (!person?.ci) return '—';
  return person.ciExtension ? `${person.ci} ${person.ciExtension}` : person.ci;
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

export function formatDateShort(value?: string | Date): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
