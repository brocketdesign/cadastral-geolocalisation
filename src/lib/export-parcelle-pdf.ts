import jsPDF from 'jspdf';
import type { GeoResult } from '@/types';

/* ─── Color palette (matches risk-pdf style) ────────────────────────── */

const C = {
  dark: [15, 23, 42] as [number, number, number],
  darkMid: [30, 41, 59] as [number, number, number],
  slate5: [248, 250, 252] as [number, number, number],
  slate2: [226, 232, 240] as [number, number, number],
  slate4: [148, 163, 184] as [number, number, number],
  slate6: [71, 85, 105] as [number, number, number],
  slate7: [51, 65, 85] as [number, number, number],
  emerald6: [5, 150, 105] as [number, number, number],
  emerald5: [16, 185, 129] as [number, number, number],
  emeraldLight: [209, 250, 229] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

/* ─── Helpers ───────────────────────────────────────────────────────── */

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;

function setFill(doc: jsPDF, rgb: [number, number, number]) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
}
function setTextColor(doc: jsPDF, rgb: [number, number, number]) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}
function setDraw(doc: jsPDF, rgb: [number, number, number]) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
}

function sectionTitle(
  doc: jsPDF,
  y: number,
  label: string,
  accent: [number, number, number] = C.emerald6,
): number {
  setFill(doc, accent);
  doc.rect(MARGIN, y, 3, 5.5, 'F');
  setTextColor(doc, C.dark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(label, MARGIN + 6, y + 4.5);
  return y + 11;
}

function kvRow(doc: jsPDF, x: number, y: number, key: string, value: string): number {
  setTextColor(doc, C.slate6);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(key, x, y);

  setTextColor(doc, C.dark);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(value, x + 50, y);
  return y + 7;
}

/* ─── Main export ───────────────────────────────────────────────────── */

/**
 * Generate and download a single-page A4 PDF for a cadastral parcel result.
 */
export async function exportParcellePDF(result: GeoResult): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const now = new Date();

  // ── HEADER BAND ──────────────────────────────────────────────────
  setFill(doc, C.dark);
  doc.rect(0, 0, PAGE_W, 56, 'F');

  // Accent line
  setFill(doc, C.emerald5);
  doc.rect(0, 56, PAGE_W, 2, 'F');

  // Branding
  setTextColor(doc, C.white);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Cada', MARGIN, 18);
  setTextColor(doc, C.emerald5);
  doc.text('Stre', MARGIN + 20, 18);
  setTextColor(doc, C.white);
  doc.text('Map', MARGIN + 35, 18);

  setTextColor(doc, C.slate4);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Plateforme de géolocalisation cadastrale', MARGIN, 24);

  // Report type pill
  setFill(doc, C.emerald6);
  doc.roundedRect(PAGE_W - MARGIN - 40, 12, 40, 8, 2, 2, 'F');
  setTextColor(doc, C.white);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('FICHE PARCELLE', PAGE_W - MARGIN - 20, 17.5, { align: 'center' });

  // Parcel address
  setTextColor(doc, C.slate4);
  doc.setFontSize(7.5);
  doc.text('RÉFÉRENCE CADASTRALE', MARGIN, 36);
  setTextColor(doc, C.white);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(result.address || `${result.commune} — Section ${result.section} — Parcelle ${result.numero}`, MARGIN, 44);

  // Date
  const dateStr = now.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  setTextColor(doc, C.slate4);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Généré le ${dateStr}`, MARGIN, 51);

  // ── INFORMATIONS CADASTRALES ─────────────────────────────────────
  let y = 68;
  y = sectionTitle(doc, y, 'Informations cadastrales');

  // Info card background
  const infoCardH = 58;
  setFill(doc, C.slate5);
  setDraw(doc, C.slate2);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, CONTENT_W, infoCardH, 3, 3, 'FD');

  let iy = y + 8;
  iy = kvRow(doc, MARGIN + 6, iy, 'Commune', result.commune || '—');
  iy = kvRow(doc, MARGIN + 6, iy, 'Territoire', result.territoire || '—');
  iy = kvRow(doc, MARGIN + 6, iy, 'Section', result.section || '—');
  iy = kvRow(doc, MARGIN + 6, iy, 'N° Parcelle', result.numero || '—');
  iy = kvRow(doc, MARGIN + 6, iy, 'Surface estimée', result.surface || 'Non disponible');
  kvRow(doc, MARGIN + 6, iy, 'Zonage', result.zonage || 'Non disponible');

  y += infoCardH + 10;

  // ── COORDONNÉES ──────────────────────────────────────────────────
  y = sectionTitle(doc, y, 'Coordonnées GPS');

  // Coords card
  const coordCardH = 28;
  setFill(doc, C.emeraldLight);
  setDraw(doc, [167, 243, 208] as [number, number, number]);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, CONTENT_W, coordCardH, 3, 3, 'FD');

  setTextColor(doc, [6, 78, 59] as [number, number, number]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Latitude', MARGIN + 6, y + 10);
  doc.text('Longitude', MARGIN + CONTENT_W / 2 + 6, y + 10);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(result.lat.toFixed(6), MARGIN + 6, y + 20);
  doc.text(result.lng.toFixed(6), MARGIN + CONTENT_W / 2 + 6, y + 20);

  y += coordCardH + 10;

  // ── RÉFÉRENCE CADASTRALE COMPLÈTE ─────────────────────────────────
  y = sectionTitle(doc, y, 'Référence cadastrale complète');

  const refStr = `${result.territoire} / ${result.commune} / ${result.section} / ${result.numero}`;
  setFill(doc, C.slate5);
  setDraw(doc, C.slate2);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, CONTENT_W, 14, 3, 3, 'FD');

  setTextColor(doc, C.dark);
  doc.setFontSize(11);
  doc.setFont('courier', 'bold');
  doc.text(refStr, MARGIN + 6, y + 9);
  y += 24;

  // ── LIENS UTILES ──────────────────────────────────────────────────
  y = sectionTitle(doc, y, 'Liens utiles');

  setTextColor(doc, C.slate6);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');

  const googleMapsUrl = `https://www.google.com/maps?q=${result.lat},${result.lng}`;
  const geoportailUrl = `https://www.geoportail-urbanisme.gouv.fr/map/#tile=1&lon=${result.lng}&lat=${result.lat}&zoom=19`;

  doc.text('Google Maps :', MARGIN + 6, y + 2);
  setTextColor(doc, C.emerald6);
  doc.textWithLink(googleMapsUrl, MARGIN + 36, y + 2, { url: googleMapsUrl });

  y += 7;
  setTextColor(doc, C.slate6);
  doc.text('Géoportail :', MARGIN + 6, y + 2);
  setTextColor(doc, C.emerald6);
  const truncGeo = geoportailUrl.length > 80 ? geoportailUrl.slice(0, 80) + '…' : geoportailUrl;
  doc.textWithLink(truncGeo, MARGIN + 36, y + 2, { url: geoportailUrl });

  y += 14;

  // ── DISCLAIMER ────────────────────────────────────────────────────
  const disclaimerText =
    'Ce document est généré automatiquement à titre informatif. Les informations cadastrales proviennent des bases ' +
    'de données publiques de l\'IGN (apicarto) et de l\'API Adresse (data.gouv.fr). Pour toute démarche officielle, ' +
    'veuillez consulter un géomètre-expert ou le service du cadastre de votre commune. CadaStreMap ne saurait être ' +
    'tenu responsable des décisions prises sur la base de ce document.';
  const dlLines = doc.splitTextToSize(disclaimerText, CONTENT_W - 10);
  const dlH = dlLines.length * 3.8 + 8;

  if (y + dlH < PAGE_H - 20) {
    setFill(doc, C.slate5);
    setDraw(doc, C.slate2);
    doc.setLineWidth(0.2);
    doc.roundedRect(MARGIN, y, CONTENT_W, dlH, 2, 2, 'FD');
    setTextColor(doc, C.slate4);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(dlLines, MARGIN + 5, y + 5.5);
  }

  // ── FOOTER ────────────────────────────────────────────────────────
  const footerY = PAGE_H - 10;
  setFill(doc, C.dark);
  doc.rect(0, PAGE_H - 16, PAGE_W, 16, 'F');

  setTextColor(doc, C.slate4);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('CadaStreMap · Fiche Parcelle Cadastrale', MARGIN, footerY);
  doc.text('Page 1 / 1', PAGE_W - MARGIN, footerY, { align: 'right' });

  // ── SAVE ──────────────────────────────────────────────────────────
  const safeName = result.commune.replace(/\s+/g, '-');
  const filename = `fiche-parcelle_${safeName}_${result.section}${result.numero}_${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
