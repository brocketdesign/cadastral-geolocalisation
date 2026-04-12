import jsPDF from 'jspdf';
import type { GeoResult } from '@/types';
import type { Agency, Client } from '@/types';

/* ─── Palette ───────────────────────────────────────────────── */

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
  amber: [245, 158, 11] as [number, number, number],
};

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;

function setFill(doc: jsPDF, rgb: [number, number, number]) { doc.setFillColor(rgb[0], rgb[1], rgb[2]); }
function setTextColor(doc: jsPDF, rgb: [number, number, number]) { doc.setTextColor(rgb[0], rgb[1], rgb[2]); }
function setDraw(doc: jsPDF, rgb: [number, number, number]) { doc.setDrawColor(rgb[0], rgb[1], rgb[2]); }

function sectionTitle(doc: jsPDF, y: number, label: string): number {
  setFill(doc, C.emerald6);
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
  doc.text(value || '—', x + 52, y);
  return y + 7;
}

/* ─── Main export function ──────────────────────────────────── */

export async function generateReportPDF(
  result: GeoResult,
  agency: Agency | null,
  client: Client | null,
): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const now = new Date();

  /* ── HEADER ──────────────────────────────────────── */
  const headerH = agency ? 64 : 56;
  setFill(doc, C.dark);
  doc.rect(0, 0, PAGE_W, headerH, 'F');
  setFill(doc, C.emerald5);
  doc.rect(0, headerH, PAGE_W, 2, 'F');

  /* Agency block on left, or CadaStreMap branding */
  if (agency) {
    // Agency logo (try to load image, fallback to text)
    let logoLoaded = false;
    if (agency.logo_url) {
      try {
        const imgData = await loadImageAsDataURL(agency.logo_url);
        doc.addImage(imgData, 'JPEG', MARGIN, 8, 22, 22);
        logoLoaded = true;
      } catch {
        // ignore — logo not available
      }
    }
    const textX = logoLoaded ? MARGIN + 26 : MARGIN;
    setTextColor(doc, C.white);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(agency.name, textX, 17);
    setTextColor(doc, C.slate4);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    if (agency.address) doc.text(agency.address, textX, 24);
    if (agency.phone) doc.text(agency.phone, textX, 30);
  } else {
    setTextColor(doc, C.white);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Cada', MARGIN, 18);
    setTextColor(doc, C.emerald5);
    doc.text('Stre', MARGIN + 18, 18);
    setTextColor(doc, C.white);
    doc.text('Map', MARGIN + 32, 18);
    setTextColor(doc, C.slate4);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Plateforme de géolocalisation cadastrale', MARGIN, 24);
  }

  /* Report type pill — top right */
  setFill(doc, C.emerald6);
  doc.roundedRect(PAGE_W - MARGIN - 42, 10, 42, 8, 2, 2, 'F');
  setTextColor(doc, C.white);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('RAPPORT PARCELLE', PAGE_W - MARGIN - 21, 15.5, { align: 'center' });

  /* Parcel reference sub-header */
  setTextColor(doc, C.slate4);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('PARCELLE', MARGIN, headerH - 18);
  setTextColor(doc, C.white);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(
    result.address || `${result.commune} — Section ${result.section} — ${result.numero}`,
    MARGIN,
    headerH - 10,
  );

  const dateStr = now.toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  setTextColor(doc, C.slate4);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Généré le ${dateStr}`, MARGIN, headerH - 3);

  let y = headerH + 10;

  /* ── CLIENT BLOCK ─────────────────────────────────────────── */
  if (client) {
    y = sectionTitle(doc, y, 'Client');
    const clientCardH = 30;
    setFill(doc, C.slate5);
    setDraw(doc, C.slate2);
    doc.setLineWidth(0.3);
    doc.roundedRect(MARGIN, y, CONTENT_W, clientCardH, 3, 3, 'FD');
    let cy = y + 8;
    cy = kvRow(doc, MARGIN + 6, cy, 'Nom', client.name);
    if (client.phone) cy = kvRow(doc, MARGIN + 6, cy, 'Téléphone', client.phone);
    if (client.email) kvRow(doc, MARGIN + 6, cy, 'Email', client.email);
    y += clientCardH + 10;
  }

  /* ── INFORMATIONS CADASTRALES ─────────────────────────────── */
  y = sectionTitle(doc, y, 'Informations cadastrales');

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

  /* ── COORDONNÉES ──────────────────────────────────────────── */
  y = sectionTitle(doc, y, 'Coordonnées GPS');

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
  doc.text(result.lat.toFixed(6), MARGIN + 6, y + 20);
  doc.text(result.lng.toFixed(6), MARGIN + CONTENT_W / 2 + 6, y + 20);

  y += coordCardH + 10;

  /* ── RÉFÉRENCE COMPLÈTE ───────────────────────────────────── */
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

  /* ── LIENS UTILES ─────────────────────────────────────────── */
  y = sectionTitle(doc, y, 'Liens utiles');

  const googleMapsUrl = `https://www.google.com/maps?q=${result.lat},${result.lng}`;
  const geoportailUrl = `https://www.geoportail-urbanisme.gouv.fr/map/#tile=1&lon=${result.lng}&lat=${result.lat}&zoom=19`;

  setTextColor(doc, C.slate6);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Google Maps :', MARGIN + 6, y + 2);
  setTextColor(doc, C.emerald6);
  doc.textWithLink(googleMapsUrl, MARGIN + 38, y + 2, { url: googleMapsUrl });

  y += 7;
  setTextColor(doc, C.slate6);
  doc.text('Géoportail :', MARGIN + 6, y + 2);
  setTextColor(doc, C.emerald6);
  const truncGeo = geoportailUrl.length > 80 ? geoportailUrl.slice(0, 80) + '…' : geoportailUrl;
  doc.textWithLink(truncGeo, MARGIN + 38, y + 2, { url: geoportailUrl });

  y += 14;

  /* ── FOOTER ──────────────────────────────────────────────── */
  setFill(doc, C.dark);
  doc.rect(0, PAGE_H - 14, PAGE_W, 14, 'F');

  setTextColor(doc, C.slate4);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  if (agency) {
    doc.text(`${agency.name} · Rapport généré via CadaStreMap`, MARGIN, PAGE_H - 5.5);
  } else {
    doc.text('CadaStreMap · Rapport Parcelle Cadastrale', MARGIN, PAGE_H - 5.5);
  }
  doc.text(`${dateStr} · Page 1 / 1`, PAGE_W - MARGIN, PAGE_H - 5.5, { align: 'right' });

  /* ── SAVE ────────────────────────────────────────────────── */
  const safeName = result.commune.replace(/\s+/g, '-');
  const clientPart = client ? `_${client.name.replace(/\s+/g, '-')}` : '';
  const filename = `rapport-parcelle_${safeName}_${result.section}${result.numero}${clientPart}_${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

/* ─── Helper: load remote image as data URL ─────────────────── */

function loadImageAsDataURL(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context unavailable'));
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg'));
    };
    img.onerror = reject;
    img.src = url;
  });
}
