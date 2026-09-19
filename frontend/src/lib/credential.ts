import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import QRCode from 'qrcode';
import { Enrollment, Institution, Student, SubjectAssignment } from '@/lib/types';
import {
  fullSurname,
  fullSurnames,
  ciText,
  formatDate,
} from '@/lib/utils';
import { COLORS, CARD_W, CARD_H, INSTITUTION_SUFFIX } from '@/lib/constants';

const { NAVY, CREAM, GOLD } = COLORS;

export interface CredentialData {
  enrollment: Enrollment;
  institution?: Institution;
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

export async function downloadEnrollmentCredential({
  enrollment,
  institution,
}: CredentialData): Promise<void> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [CARD_W, CARD_H] });
  const margin = 2.5;

  const student = enrollment.student;
  const institutionName =
    institution?.name || 'Instituto Tecnológico \u201CBoliviana de Tecnología\u201D';
  const periodName =
    enrollment.academicPeriod?.periodName ||
    `Gestión ${enrollment.academicPeriod?.year || String(new Date().getFullYear())}`;
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

  const row = (
    label: string,
    value: string,
    x: number,
    yLabel: number,
    valueSize = 8,
    navyValue = false,
  ) => {
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

  // FRENTE
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

  // PARTE POSTERIOR
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
    }),
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

export async function downloadEnrollmentCredentialFromDom({
  enrollment,
  front,
  back,
}: CredentialDomData): Promise<boolean> {
  const [frontPng, backPng] = await Promise.all([captureCard(front), captureCard(back)]);
  if (!frontPng || !backPng) return false;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [CARD_W, CARD_H] });
  doc.addImage(frontPng, 'PNG', 0, 0, CARD_W, CARD_H);
  doc.addPage([CARD_W, CARD_H], 'landscape');
  doc.addImage(backPng, 'PNG', 0, 0, CARD_W, CARD_H);
  doc.save(`Credencial-${enrollment.enrollmentNumber}.pdf`);
  return true;
}

export interface SubjectAssignmentCredentialData {
  student: Student;
  assignments: SubjectAssignment[];
  institution?: Institution;
}

export interface SubjectAssignmentCredentialDomData {
  student: Student;
  front: HTMLElement | null;
  back: HTMLElement | null;
}

export async function buildSubjectAssignmentQrDataUrl(
  student: Student,
  assignments: SubjectAssignment[],
  periodName: string,
): Promise<string | null> {
  const payload = [
    'INSTITUTO TECNOLÓGICO \u201CBOLIVIANA DE TECNOLOGÍA\u201D',
    'BOLETA DE ASIGNACIÓN DE MATERIAS',
    periodName,
    `Estudiante: ${student?.firstName || ''} ${student?.paternalSurname || ''} ${student?.maternalSurname || ''} ${student?.lastName || ''}`.trim(),
    `CI: ${student?.ci || ''}`,
    `Matrícula: ${student?.studentCode || ''}`,
    `Materias: ${assignments.map((a) => a.subject?.code).filter(Boolean).join(', ')}`,
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

export async function downloadSubjectAssignmentCredential({
  student,
  assignments,
  institution,
}: SubjectAssignmentCredentialData): Promise<void> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [CARD_W, CARD_H] });
  const margin = 2.5;

  const institutionName =
    institution?.name || 'Instituto Tecnológico \u201CBoliviana de Tecnología\u201D';
  const periodName =
    assignments[0]?.academicPeriod?.periodName ||
    `Gestión ${assignments[0]?.academicPeriod?.year || String(new Date().getFullYear())}`;
  const year = assignments[0]?.academicPeriod?.year || String(new Date().getFullYear());

  const [logoUrl, photoUrl, qrUrl] = await Promise.all([
    loadImageDataUrl(institution?.logoUrl),
    student?.photoUrl ? loadImageDataUrl(student.photoUrl).catch(() => null) : Promise.resolve(null),
    buildSubjectAssignmentQrDataUrl(student, assignments, periodName),
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

  const row = (
    label: string,
    value: string,
    x: number,
    yLabel: number,
    valueSize = 8,
    navyValue = false,
  ) => {
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

  // FRENTE
  drawBackdrop();
  drawHeader('BOLETA DE ASIGNACIÓN', 32);

  // Sello de gestión
  const badgeW = 29;
  const badgeH = 8.4;
  const badgeX = CARD_W - margin - badgeW;
  const badgeY = 1.1;
  doc.setFillColor(...GOLD);
  doc.rect(badgeX, badgeY, badgeW, badgeH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.6);
  doc.setTextColor(...NAVY);
  doc.text('BOLETA', badgeX + badgeW / 2, badgeY + 3.1, { align: 'center' });
  doc.setFontSize(6.8);
  doc.text('ASIGNACIÓN', badgeX + badgeW / 2, badgeY + 6.5, { align: 'center' });

  // Fotografía
  const photoSize = 30;
  const photoX = CARD_W - margin - photoSize;
  const photoY = 13.6;
  drawPhoto(photoX, photoY, photoSize);

  // Datos
  const colX = margin + 1.5;
  const surnames = [student?.paternalSurname, student?.maternalSurname].filter(Boolean).join(' ');
  row('N.º DE BOLETA', assignments[0]?.id?.slice(-8).toUpperCase() ?? '—', colX, 15, 9.6, true);
  row('APELLIDOS', surnames || '—', colX, 22);
  row('NOMBRES', student?.firstName || '—', colX, 29);
  row('MATRÍCULA', student?.studentCode || '—', colX, 36);
  row('GESTIÓN', periodName, colX, 43);

  // PARTE POSTERIOR
  doc.addPage([CARD_W, CARD_H], 'landscape');
  drawBackdrop();
  drawHeader('DETALLE DE MATERIAS ASIGNADAS');

  const col1X = margin + 1.5;
  const yStart = 13;
  const spacing = 5.8;
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
    ['APELLIDOS', surnames || '—'],
    ['NOMBRES', student?.firstName || '—'],
    ['MATRÍCULA', student?.studentCode || '—'],
    ['CARRERA', student?.career?.name || '—'],
    ['SEMESTRE', student?.currentLevel ? `Nivel ${student.currentLevel}` : '—'],
    ['GESTIÓN', periodName],
    ['RÉGIMEN', 'Regular'],
  ];
  const backRowsCol2: Array<[string, string]> = [
    ['CÉDULA DE IDENTIDAD', ciText(student)],
    ['RÉGIMEN', 'Regular'],
    ['SEDE', institutionSede(institution)],
  ];

  backRowsCol1.forEach(([l, v], i) => {
    label(l, v, col1X, yStart + i * spacing);
    value(v, col1X, yStart + i * spacing);
  });
  backRowsCol2.forEach(([l, v], i) => {
    label(l, v, col1X + 25, yStart + i * spacing);
    value(v, col1X + 25, yStart + i * spacing);
  });

  // Materias table
  let tableY = yStart + Math.max(backRowsCol1.length, backRowsCol2.length) * spacing + 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(...NAVY);
  doc.text('MATERIAS ASIGNADAS:', col1X, tableY);
  tableY += 3;

  doc.setFontSize(5);
  doc.setTextColor(20, 20, 20);
  doc.setFont('helvetica', 'bold');
  const colHeaders = ['Materia', 'Código', 'Paralelo', 'Docente'];
  const colWidths = [48, 15, 12, 20];
  let xPos = col1X;
  for (let i = 0; i < colHeaders.length; i++) {
    doc.text(colHeaders[i], xPos, tableY);
    xPos += colWidths[i];
  }
  tableY += 3.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.8);
  for (const a of assignments) {
    xPos = col1X;
    doc.text(fit(a.subject?.name || '—', colWidths[0], 1), xPos, tableY);
    xPos += colWidths[0];
    doc.text(a.subject?.code || '—', xPos + colWidths[1] / 2, tableY, { align: 'center' });
    xPos += colWidths[1];
    doc.text(a.parallel || '—', xPos + colWidths[2] / 2, tableY, { align: 'center' });
    xPos += colWidths[2];
    const teacher = a.employee?.persona
      ? `${a.employee.persona.firstName} ${a.employee.persona.paternalSurname ?? ''}`.trim()
      : '—';
    doc.text(fit(teacher, colWidths[3], 1), xPos, tableY);
    tableY += 3.5;
    if (tableY > CARD_H - 8) break;
  }

  // QR
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

  doc.save(`Boleta-Asignacion-${student?.studentCode || 'estudiante'}.pdf`);
}

export async function downloadSubjectAssignmentCredentialFromDom({
  student,
  front,
  back,
}: SubjectAssignmentCredentialDomData): Promise<boolean> {
  const [frontPng, backPng] = await Promise.all([captureCard(front), captureCard(back)]);
  if (!frontPng || !backPng) return false;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [CARD_W, CARD_H] });
  doc.addImage(frontPng, 'PNG', 0, 0, CARD_W, CARD_H);
  doc.addPage([CARD_W, CARD_H], 'landscape');
  doc.addImage(backPng, 'PNG', 0, 0, CARD_W, CARD_H);
  doc.save(`Boleta-Asignacion-${student?.studentCode || 'estudiante'}.pdf`);
  return true;
}
