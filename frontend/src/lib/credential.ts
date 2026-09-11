import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import QRCode from 'qrcode';
import { Enrollment, Institution } from '@/lib/types';

const INSTITUTION_SUFFIX = 'R.M. 1049/2023';
const NAVY: [number, number, number] = [20, 33, 61];
const CREAM: [number, number, number] = [250, 247, 241];
const GOLD: [number, number, number] = [200, 158, 68];
const CARD_W = 85;
const CARD_H = 55;

export interface CredentialData {
  enrollment: Enrollment;
  institution?: Institution;
}

export function fullSurname(student: Enrollment['student']): string {
  if (!student) return '—';
  return student.lastName || [student.paternalSurname, student.maternalSurname].filter(Boolean).join(' ') || '—';
}

export function paternalOf(student: Enrollment['student']): string {
  if (!student) return '—';
  if (student.paternalSurname) return student.paternalSurname;
  return student.lastName?.split(' ')[0] || '—';
}

export function maternalOf(student: Enrollment['student']): string {
  if (!student) return '—';
  if (student.maternalSurname) return student.maternalSurname;
  const parts = student.lastName?.split(' ') || [];
  return parts.length > 1 ? parts.slice(1).join(' ') : '—';
}

export function fullSurnames(student: Enrollment['student']): string {
  const parts = [paternalOf(student), maternalOf(student)].filter((v) => v !== '—');
  return parts.length ? parts.join(' ') : '—';
}

export function institutionSede(institution?: Institution): string {
  return institution?.address?.split(',')[0]?.trim() || 'El Alto';
}

export function emergencyPhone(student: Enrollment['student']): string {
  return student?.phone?.trim() || '—';
}

export function studyRegime(career?: Enrollment['career']): string {
  const regime = career?.studyPlan?.['regime'];
  return typeof regime === 'string' && regime.trim() ? regime : 'Semestral';
}

export function ciText(student: Enrollment['student']): string {
  return student?.ci ? `${student.ci}${student.ciExtension ? ` ${student.ciExtension}` : ''}` : '—';
}

export function formatDate(value?: string | Date): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

async function loadImageDataUrl(url?: string, fallback = '/logo.png'): Promise<string | null> {
  try {
    const res = await fetch(url || fallback);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function buildQrDataUrl(enrollment: Enrollment): Promise<string | null> {
  const student = enrollment.student;
  const payload = [
    'INSTITUTO TECNOLÓGICO \u201CBOLIVIANA DE TECNOLOGÍA\u201D',
    enrollment.academicPeriod?.periodName || `Gestión ${enrollment.academicPeriod?.year || ''}`,
    `N.º de matrícula: ${enrollment.enrollmentNumber}`,
    `Estudiante: ${student?.firstName || ''} ${fullSurname(student)}`,
    `CI: ${student?.ci || ''}`,
    `Carrera: ${enrollment.career?.name || ''}`,
  ]
    .filter((line) => line.trim())
    .join('\n');

  try {
    return await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 300,
    });
  } catch {
    return null;
  }
}

export async function downloadEnrollmentCredential({ enrollment, institution }: CredentialData): Promise<void> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [CARD_W, CARD_H] });
  const margin = 2.5;

  const student = enrollment.student;
  const institutionName = institution?.name || 'Instituto Tecnológico \u201CBoliviana de Tecnología\u201D';
  const periodName = enrollment.academicPeriod?.periodName || `Gestión ${enrollment.academicPeriod?.year || String(new Date().getFullYear())}`;
  const year = enrollment.academicPeriod?.year || String(new Date().getFullYear());

  const [logoUrl, photoUrl, qrUrl] = await Promise.all([
    loadImageDataUrl(institution?.logoUrl),
    student?.photoUrl ? loadImageDataUrl(student.photoUrl).catch(() => null) : Promise.resolve(null),
    buildQrDataUrl(enrollment),
  ]);

  const fit = (value: string, width: number, maxLines = 1): string => {
    if (!value) return '';
    const lines: string[] = [];
    let current = '';
    for (const word of value.split(' ')) {
      const test = current ? `${current} ${word}` : word;
      if (doc.getTextWidth(test) > width && current) {
        lines.push(current);
        current = word;
        if (lines.length >= maxLines) return lines.slice(0, maxLines).join(' ') + '…';
      } else {
        current = test;
      }
    }
    lines.push(current);
    if (lines.length > maxLines) return lines.slice(0, maxLines).join(' ') + '…';
    return lines.join(' ');
  };

  const drawBackdrop = () => {
    doc.setFillColor(...CREAM);
    doc.rect(0, 0, CARD_W, CARD_H, 'F');
    doc.setDrawColor(...NAVY);
    doc.setLineWidth(0.35);
    doc.rect(1.1, 1.1, CARD_W - 2.2, CARD_H - 2.2, 'S');
  };

  const drawHeader = (title: string, reservedRight = 0) => {
    const bandH = 10.4;
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, CARD_W, bandH, 'F');
    if (logoUrl) {
      try {
        doc.addImage(logoUrl, 'JPEG', margin, 1.7, 7, 7);
      } catch {
        doc.addImage(logoUrl, 'PNG', margin, 1.7, 7, 7);
      }
    }
    const nameX = logoUrl ? margin + 8 : margin;
    const nameW = CARD_W - nameX - reservedRight - margin;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.9);
    doc.setTextColor(255, 255, 255);
    const nameText = fit(institutionName.toUpperCase(), nameW, 1);
    doc.text(nameText, nameX + nameW / 2, 4.8, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.9);
    doc.setTextColor(188, 194, 214);
    doc.text(title, nameX + nameW / 2, 7.9, { align: 'center' });
  };

  const row = (label: string, value: string, x: number, yLabel: number, valueSize = 8, navyValue = false) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.9);
    doc.setTextColor(110, 110, 110);
    doc.text(label, x, yLabel);
    const valueY = yLabel + 3.2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(valueSize);
    if (navyValue) doc.setTextColor(...NAVY);
    else doc.setTextColor(20, 20, 20);
    doc.text(fit(value || '—', 50, 1), x, valueY);
    doc.setFontSize(valueSize);
    return valueY;
  };

  const drawPhoto = (x: number, y: number, size: number) => {
    doc.setDrawColor(...NAVY);
    doc.setLineWidth(0.4);
    doc.rect(x, y, size, size, 'S');
    if (photoUrl) {
      try {
        const props = doc.getImageProperties(photoUrl);
        const imgWmm = (props.width * 25.4) / 72;
        const imgHmm = (props.height * 25.4) / 72;
        const inner = size - 0.6;
        const scale = Math.min(inner / imgWmm, inner / imgHmm);
        const w = imgWmm * scale;
        const h = imgHmm * scale;
        doc.setLineWidth(0);
        try {
          doc.addImage(photoUrl, 'JPEG', x + (size - w) / 2, y + (size - h) / 2, w, h);
        } catch {
          doc.addImage(photoUrl, 'PNG', x + (size - w) / 2, y + (size - h) / 2, w, h);
        }
        doc.setLineWidth(0.4);
        doc.rect(x, y, size, size, 'S');
      } catch {
        /* placeholder */
      }
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(5.4);
      doc.setTextColor(150, 150, 150);
      doc.text('FOTOGRAFÍA', x + size / 2, y + size / 2, { align: 'center' });
    }
  };

  // ---------------- FRENTE ----------------
  drawBackdrop();
  drawHeader('CREDENCIAL DE MATRÍCULA', 32);

  // Sello de gestión (esquina superior derecha)
  const badgeW = 29;
  const badgeH = 8.4;
  const badgeX = CARD_W - margin - badgeW;
  const badgeY = 1.1;
  doc.setFillColor(...GOLD);
  doc.rect(badgeX, badgeY, badgeW, badgeH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.6);
  doc.setTextColor(...NAVY);
  doc.text('GESTIÓN', badgeX + badgeW / 2, badgeY + 3.1, { align: 'center' });
  doc.setFontSize(6.8);
  doc.text(periodName, badgeX + badgeW / 2, badgeY + 6.5, { align: 'center' });

  // Fotografía 30 x 30 mm
  const photoSize = 30;
  const photoX = CARD_W - margin - photoSize;
  const photoY = 13.6;
  drawPhoto(photoX, photoY, photoSize);

  // Datos en orden vertical
  const colX = margin + 1.5;
  row('N.º DE MATRÍCULA (REGISTRO ÚNICO)', enrollment.enrollmentNumber, colX, 15, 9.6, true);
  row('APELLIDOS', fullSurnames(student), colX, 22);
  row('NOMBRES', student?.firstName || '—', colX, 29);
  row('CARRERA', enrollment.career?.name || '—', colX, 36);
  row('FECHA', formatDate(enrollment.enrollmentDate), colX, 43);

  // ---------------- PARTE POSTERIOR ----------------
  doc.addPage([CARD_W, CARD_H], 'landscape');
  drawBackdrop();
  drawHeader('PARTE POSTERIOR');

  const col1X = margin + 1.5;
  const col2X = 31.5;
  const yStart = 13;
  const spacing = 6.2;
  const label = (labelText: string, value: string, x: number, yLabel: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.8);
    doc.setTextColor(110, 110, 110);
    doc.text(labelText, x, yLabel);
  };
  const value = (valueText: string, x: number, yLabel: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(20, 20, 20);
    doc.text(fit(valueText || '—', 25, 1), x, yLabel + 2.6);
  };

  const backRowsCol1: Array<[string, string]> = [
    ['APELLIDOS', fullSurnames(student)],
    ['NOMBRES', student?.firstName || '—'],
    ['CARRERA', enrollment.career?.name || '—'],
    ['NIVEL', student?.currentLevel ? `Nivel ${student.currentLevel}` : '—'],
    ['GESTIÓN ACTUAL', periodName],
    ['RÉGIMEN', studyRegime(enrollment.career)],
  ];
  const backRowsCol2: Array<[string, string]> = [
    ['FECHA', formatDate(enrollment.enrollmentDate)],
    ['CÉDULA DE IDENTIDAD', ciText(student)],
    ['REGISTRO ÚNICO', enrollment.enrollmentNumber],
    ['TEL. EMERGENCIA', emergencyPhone(student)],
    ['SEDE', institutionSede(institution)],
  ];

  backRowsCol1.forEach(([l, v], i) => {
    label(l, v, col1X, yStart + i * spacing);
    value(v, col1X, yStart + i * spacing);
  });
  backRowsCol2.forEach(([l, v], i) => {
    label(l, v, col2X, yStart + i * spacing);
    value(v, col2X, yStart + i * spacing);
  });

  // QR de verificación (esquina derecha)
  if (qrUrl) {
    const qrSize = 22.5;
    const qrX = CARD_W - margin - qrSize;
    try {
      doc.addImage(qrUrl, 'PNG', qrX, 12.5, qrSize, qrSize);
    } catch {
      /* sin QR */
    }
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(4.4);
    doc.setTextColor(120, 120, 120);
    doc.text('Código QR de verificación', qrX + qrSize / 2, 37.5, { align: 'center' });
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.5);
  doc.setTextColor(130, 130, 130);
  doc.text(`${institutionName.toUpperCase()} · ${INSTITUTION_SUFFIX} · Gestión ${year}`, CARD_W / 2, CARD_H - 1.8, {
    align: 'center',
  });

  doc.save(`Credencial-${enrollment.enrollmentNumber}.pdf`);
}

export interface CredentialDomData {
  enrollment: Enrollment;
  front: HTMLElement | null;
  back: HTMLElement | null;
}

async function inlineImages(el: HTMLElement): Promise<void> {
  const images = Array.from(el.querySelectorAll('img'));
  await Promise.all(
    images.map(async (img) => {
      const src = img.getAttribute('src');
      if (!src || src.startsWith('data:')) return;
      try {
        const dataUrl = await loadImageDataUrl(src);
        if (dataUrl) img.setAttribute('src', dataUrl);
      } catch {
        /* se conserva la URL original */
      }
    })
  );
}

async function captureCard(el: HTMLElement | null): Promise<string | null> {
  if (!el) return null;
  await inlineImages(el);
  try {
    return await toPng(el, {
      pixelRatio: 4,
      cacheBust: true,
      width: el.offsetWidth,
      height: el.offsetHeight,
    });
  } catch {
    return null;
  }
}

/**
 * Genera el PDF de la credencial capturando la vista previa CSS (idéntico a pantalla).
 * Devuelve `true` si la captura fue exitosa; si falla conviene usar
 * `downloadEnrollmentCredential` (jsPDF) como respaldo.
 */
export async function downloadEnrollmentCredentialFromDom({ enrollment, front, back }: CredentialDomData): Promise<boolean> {
  const [frontPng, backPng] = await Promise.all([captureCard(front), captureCard(back)]);
  if (!frontPng || !backPng) return false;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [CARD_W, CARD_H] });
  doc.addImage(frontPng, 'PNG', 0, 0, CARD_W, CARD_H);
  doc.addPage([CARD_W, CARD_H], 'landscape');
  doc.addImage(backPng, 'PNG', 0, 0, CARD_W, CARD_H);
  doc.save(`Credencial-${enrollment.enrollmentNumber}.pdf`);
  return true;
}