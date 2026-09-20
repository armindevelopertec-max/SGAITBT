import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const suppressedErrors = [
  'Failed to read the',
  'Error while reading CSS',
  'cssRules',
  'SecurityError',
  'Error inlining remote css file',
];

const originalError = console.error;
console.error = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && suppressedErrors.some((e) => (args[0] as string).includes(e))) {
    return;
  }
  originalError.apply(console, args);
};

export async function captureElementToPdf(
  element: HTMLElement,
  filename: string,
): Promise<void> {
  const canvas = await html2canvas(element, {
    useCORS: true,
    background: '#ffffff',
    logging: false,
  });

  const dataUrl = canvas.toDataURL('image/png', 1.0);

  const rect = element.getBoundingClientRect();
  const elemWidthMm = rect.width / 3.78;
  const elemHeightMm = rect.height / 3.78;

  const cartaWidth = 216;
  const cartaHeight = 279;

  let pdfWidth: number;
  let pdfHeight: number;

  if (elemWidthMm > cartaWidth) {
    const scale = cartaWidth / elemWidthMm;
    pdfWidth = cartaWidth;
    pdfHeight = elemHeightMm * scale;
  } else {
    pdfWidth = elemWidthMm;
    pdfHeight = elemHeightMm;
  }

  const pdf = new jsPDF({
    orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
    unit: 'mm',
    format: [pdfWidth, Math.max(pdfHeight, cartaHeight * 0.5)],
  });

  pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(filename);
}
