import jsPDF from 'jspdf';
import type { RiskAnalysisResult } from '@/types';

/* ─── Color palette ─────────────────────────────────────────────────── */

const C = {
  dark: [15, 23, 42] as [number, number, number],       // slate-900
  darkMid: [30, 41, 59] as [number, number, number],    // slate-800
  slate5: [248, 250, 252] as [number, number, number],  // slate-50
  slate2: [226, 232, 240] as [number, number, number],  // slate-200
  slate4: [148, 163, 184] as [number, number, number],  // slate-400
  slate6: [71, 85, 105] as [number, number, number],    // slate-600
  slate7: [51, 65, 85] as [number, number, number],     // slate-700
  emerald6: [5, 150, 105] as [number, number, number],  // emerald-600
  emerald5: [16, 185, 129] as [number, number, number], // emerald-500
  emeraldLight: [209, 250, 229] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  amber: [217, 119, 6] as [number, number, number],
  orange: [234, 88, 12] as [number, number, number],
  red: [220, 38, 38] as [number, number, number],
  blue: [37, 99, 235] as [number, number, number],
  cyan: [8, 145, 178] as [number, number, number],
  purple: [147, 51, 234] as [number, number, number],
  teal: [13, 148, 136] as [number, number, number],
};

/* ─── Score helpers ─────────────────────────────────────────────────── */

function scoreColor(score: number): [number, number, number] {
  if (score >= 75) return C.emerald6;
  if (score >= 50) return C.amber;
  if (score >= 25) return C.orange;
  return C.red;
}

function scoreLabel(score: number): string {
  if (score >= 75) return 'Risque FAIBLE';
  if (score >= 50) return 'Risque MODÉRÉ';
  if (score >= 25) return 'Risque ÉLEVÉ';
  return 'Risque CRITIQUE';
}

/* ─── PDF helpers ───────────────────────────────────────────────────── */

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

function pageFooter(doc: jsPDF, pageNum: number, total: number) {
  const y = PAGE_H - 10;
  setFill(doc, C.dark);
  doc.rect(0, PAGE_H - 16, PAGE_W, 16, 'F');

  setTextColor(doc, C.slate4);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('CadaStreMap · Foncier Risk Score · Rapport généré par intelligence artificielle', MARGIN, y);
  doc.text(`Page ${pageNum} / ${total}`, PAGE_W - MARGIN, y, { align: 'right' });
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

/** Draws a score bar (colored fill + grey background). Returns next y. */
function scoreBar(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  score: number,
  label: string,
  subLabel?: string,
): number {
  const BAR_H = 5;
  const color = scoreColor(score);

  setTextColor(doc, C.slate7);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(label, x, y + 3.5);

  const scoreStr = `${score}/100`;
  setTextColor(doc, color);
  doc.text(scoreStr, x + w, y + 3.5, { align: 'right' });

  y += 6;
  setFill(doc, C.slate2);
  doc.roundedRect(x, y, w, BAR_H, 1.5, 1.5, 'F');
  setFill(doc, color);
  doc.roundedRect(x, y, (score / 100) * w, BAR_H, 1.5, 1.5, 'F');

  y += BAR_H + 2;
  if (subLabel) {
    setTextColor(doc, C.slate4);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(subLabel, w);
    doc.text(lines, x, y + 2.5);
    y += lines.length * 3.5 + 2;
  }
  return y + 4;
}

/** Draws a key–value row inside an info card. */
function kvRow(doc: jsPDF, x: number, y: number, w: number, key: string, value: string): number {
  setTextColor(doc, C.slate4);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(key, x, y);

  setTextColor(doc, C.dark);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  const lines = doc.splitTextToSize(value, w - 28);
  doc.text(lines, x + 28, y);
  return y + lines.length * 4 + 3;
}

/** Draws the score circle (arc-based gauge). */
function drawGauge(doc: jsPDF, cx: number, cy: number, r: number, score: number) {
  const color = scoreColor(score);
  const TWO_PI = Math.PI * 2;
  const START = -Math.PI / 2;
  const end = START + (score / 100) * TWO_PI;

  // Background arc (full circle) – drawn as a thin circle stroke
  setDraw(doc, C.slate2);
  doc.setLineWidth(3.5);
  doc.circle(cx, cy, r, 'S');

  // Progress arc – approximate with a polyline of segments
  setDraw(doc, color);
  doc.setLineWidth(3.5);
  const steps = Math.max(2, Math.round(72 * (score / 100)));
  const pts: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = START + (i / steps) * (end - START);
    pts.push(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
  }
  // Draw as a series of line segments
  for (let i = 0; i < pts.length - 2; i += 2) {
    if (i === 0) {
      // nothing – handled below
    }
  }
  // jsPDF lines() helper
  (doc as unknown as { lines: (pts: number[][], x: number, y: number) => void }).lines(
    pts.slice(2).reduce((acc: number[][], _, idx) => {
      if (idx % 2 === 0) acc.push([pts[idx + 2] - pts[idx], pts[idx + 3] - pts[idx + 1]]);
      return acc;
    }, []),
    pts[0],
    pts[1],
  );

  // Score text
  setTextColor(doc, color);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`${score}`, cx, cy + 3, { align: 'center' });
  setTextColor(doc, C.slate4);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('/100', cx, cy + 9, { align: 'center' });
}

/* ─── Main export function ──────────────────────────────────────────── */

export async function exportRiskAnalysisPDF(analysis: RiskAnalysisResult): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ──────────────────────────────────────────────────────────────────
  // PAGE 1 — COVER + SCORE + SYNTHÈSE
  // ──────────────────────────────────────────────────────────────────

  // Dark header band
  setFill(doc, C.dark);
  doc.rect(0, 0, PAGE_W, 60, 'F');

  // Header accent line
  setFill(doc, C.emerald5);
  doc.rect(0, 60, PAGE_W, 2, 'F');

  // Branding
  setTextColor(doc, C.white);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Cada', MARGIN, 20);
  setTextColor(doc, C.emerald5);
  doc.text('Stre', MARGIN + 20, 20);
  setTextColor(doc, C.white);
  doc.text('Map', MARGIN + 35, 20);

  setTextColor(doc, C.slate4);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Plateforme de géolocalisation cadastrale', MARGIN, 26);

  // Report label pill
  setFill(doc, C.emerald6);
  doc.roundedRect(PAGE_W - MARGIN - 46, 14, 46, 8, 2, 2, 'F');
  setTextColor(doc, C.white);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('FONCIER RISK SCORE', PAGE_W - MARGIN - 23, 19.5, { align: 'center' });

  // Parcel reference block
  setTextColor(doc, C.slate4);
  doc.setFontSize(7.5);
  doc.text('RÉFÉRENCE CADASTRALE', MARGIN, 38);
  setTextColor(doc, C.white);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(analysis.parcelRef, MARGIN, 46);

  const dateStr = new Date(analysis.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  setTextColor(doc, C.slate4);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Analysé le ${dateStr}`, MARGIN, 54);

  // Gauge + score label
  const gaugeCX = MARGIN + 25;
  const gaugeCY = 95;
  drawGauge(doc, gaugeCX, gaugeCY, 18, analysis.scoreGlobal);

  // Category badge next to gauge
  const catColor = scoreColor(analysis.scoreGlobal);
  setFill(doc, catColor);
  doc.roundedRect(gaugeCX + 28, gaugeCY - 7, 38, 9, 2, 2, 'F');
  setTextColor(doc, C.white);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(analysis.categorie, gaugeCX + 47, gaugeCY - 1.5, { align: 'center' });

  setTextColor(doc, C.dark);
  doc.setFontSize(11);
  doc.text(scoreLabel(analysis.scoreGlobal), gaugeCX + 28, gaugeCY + 6);

  setTextColor(doc, C.slate6);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Score global de risque foncier (0 = risque maximal, 100 = aucun risque)', gaugeCX + 28, gaugeCY + 12);

  // If surface provided
  if (analysis.surface) {
    doc.text(`Surface estimée : ${analysis.surface}`, gaugeCX + 28, gaugeCY + 18);
  }
  if (analysis.lat && analysis.lng) {
    const coordY = gaugeCY + (analysis.surface ? 24 : 18);
    doc.text(`Coordonnées : ${analysis.lat}, ${analysis.lng}`, gaugeCX + 28, coordY);
  }

  // Score bars overview
  let yPos = 125;
  yPos = sectionTitle(doc, yPos, 'Scores par catégorie de risque');

  const bars = [
    { score: analysis.constructibilite?.score ?? 0, label: 'Constructibilité (PLU/COS)', sub: analysis.constructibilite?.zonePLU },
    { score: analysis.risqueInondation?.score ?? 0, label: 'Risque d\'inondation (PPRI)', sub: analysis.risqueInondation?.zonePPRI },
    { score: analysis.risqueSismique?.score ?? 0, label: 'Risque sismique', sub: analysis.risqueSismique?.zoneAlea },
    { score: analysis.risqueVolcanique?.score ?? 0, label: 'Risque volcanique', sub: '' },
    { score: analysis.loiLittoral?.score ?? 0, label: 'Loi Littoral', sub: analysis.loiLittoral?.applicable ? 'Applicable dans cette zone' : 'Non applicable' },
    { score: analysis.servitudes?.score ?? 0, label: 'Servitudes', sub: analysis.servitudes?.types.join(', ') || '' },
  ].filter(b => b.score > 0);

  const colW = (CONTENT_W - 10) / 2;
  const col2X = MARGIN + colW + 10;

  // Two-column score bar layout
  yPos = 136;
  const leftBars = bars.filter((_, i) => i % 2 === 0);
  const rightBars = bars.filter((_, i) => i % 2 !== 0);
  let yL = yPos;
  let yR = yPos;
  for (const b of leftBars) yL = scoreBar(doc, MARGIN, yL, colW, b.score, b.label, b.sub);
  for (const b of rightBars) yR = scoreBar(doc, col2X, yR, colW, b.score, b.label, b.sub);

  yPos = Math.max(yL, yR) + 4;

  // AI Summary
  if (yPos < 240) {
    if (yPos + 10 < 220) {
      yPos = sectionTitle(doc, yPos, 'Synthèse de l\'IA', C.emerald6);
      setFill(doc, C.emeraldLight);
      const summaryLines = doc.splitTextToSize(analysis.resumeIA, CONTENT_W - 10);
      const summaryH = summaryLines.length * 4.2 + 8;
      doc.roundedRect(MARGIN, yPos, CONTENT_W, summaryH, 3, 3, 'F');
      setTextColor(doc, [6, 78, 59] as [number, number, number]);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text(summaryLines, MARGIN + 5, yPos + 6);
      yPos += summaryH + 6;
    }
  }

  pageFooter(doc, 1, 3);

  // ──────────────────────────────────────────────────────────────────
  // PAGE 2 — RISK DETAILS
  // ──────────────────────────────────────────────────────────────────
  doc.addPage();

  // Thin header
  setFill(doc, C.dark);
  doc.rect(0, 0, PAGE_W, 14, 'F');
  setFill(doc, C.emerald5);
  doc.rect(0, 14, PAGE_W, 1.5, 'F');
  setTextColor(doc, C.white);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('CadaStreMap · Foncier Risk Score', MARGIN, 9.5);
  setTextColor(doc, C.slate4);
  doc.setFont('helvetica', 'normal');
  doc.text(analysis.parcelRef, PAGE_W - MARGIN, 9.5, { align: 'right' });

  yPos = 24;

  // Helper: render a risk detail box
  function riskBox(
    title: string,
    score: number,
    fields: { k: string; v: string }[],
    comment: string,
    boxW: number,
    boxX: number,
    boxY: number,
  ): number {
    const color = scoreColor(score);
    const linesComment = doc.splitTextToSize(comment, boxW - 10);
    const boxH = 10 + fields.length * 7 + linesComment.length * 4 + 14;

    // Card background
    setFill(doc, C.white);
    setDraw(doc, C.slate2);
    doc.setLineWidth(0.3);
    doc.roundedRect(boxX, boxY, boxW, boxH, 3, 3, 'FD');

    // Color accent top bar
    setFill(doc, color);
    doc.roundedRect(boxX, boxY, boxW, 7, 3, 3, 'F');
    doc.rect(boxX, boxY + 4, boxW, 3, 'F');

    // Score pill
    setFill(doc, C.white);
    doc.roundedRect(boxX + boxW - 20, boxY + 1.5, 16, 5, 2, 2, 'F');
    setTextColor(doc, color);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`${score}/100`, boxX + boxW - 12, boxY + 5.5, { align: 'center' });

    // Title
    setTextColor(doc, C.white);
    doc.setFontSize(8.5);
    doc.text(title, boxX + 4, boxY + 5.5);

    let iy = boxY + 12;
    for (const f of fields) {
      iy = kvRow(doc, boxX + 4, iy, boxW, f.k, f.v);
    }

    // Separator
    setDraw(doc, C.slate2);
    doc.setLineWidth(0.2);
    doc.line(boxX + 4, iy, boxX + boxW - 4, iy);
    iy += 4;

    setTextColor(doc, C.slate6);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(linesComment, boxX + 4, iy);

    return boxY + boxH + 5;
  }

  const halfW = (CONTENT_W - 6) / 2;
  const col2 = MARGIN + halfW + 6;

  yPos = sectionTitle(doc, yPos, 'Analyse détaillée des risques');

  let yLeft = yPos;
  let yRight = yPos;

  if (analysis.constructibilite) {
    yLeft = riskBox(
      'Constructibilité & Zonage PLU',
      analysis.constructibilite.score,
      [
        { k: 'Zone PLU :', v: analysis.constructibilite.zonePLU },
        { k: 'COS :', v: analysis.constructibilite.cos },
      ],
      analysis.constructibilite.commentaire,
      halfW, MARGIN, yLeft,
    );
  }

  if (analysis.risqueInondation) {
    yRight = riskBox(
      'Risque d\'inondation (PPRI)',
      analysis.risqueInondation.score,
      [{ k: 'Zone PPRI :', v: analysis.risqueInondation.zonePPRI }],
      analysis.risqueInondation.commentaire,
      halfW, col2, yRight,
    );
  }

  if (analysis.risqueSismique) {
    yLeft = riskBox(
      'Risque sismique',
      analysis.risqueSismique.score,
      [{ k: 'Aléa :', v: analysis.risqueSismique.zoneAlea }],
      analysis.risqueSismique.commentaire,
      halfW, MARGIN, yLeft,
    );
  }

  if (analysis.risqueVolcanique) {
    yRight = riskBox(
      'Risque volcanique',
      analysis.risqueVolcanique.score,
      [],
      analysis.risqueVolcanique.commentaire,
      halfW, col2, yRight,
    );
  }

  if (analysis.loiLittoral) {
    yLeft = riskBox(
      'Loi Littoral',
      analysis.loiLittoral.score,
      [{ k: 'Applicable :', v: analysis.loiLittoral.applicable ? 'Oui' : 'Non' }],
      analysis.loiLittoral.commentaire,
      halfW, MARGIN, yLeft,
    );
  }

  if (analysis.servitudes) {
    yRight = riskBox(
      'Servitudes',
      analysis.servitudes.score,
      analysis.servitudes.types.map((t, i) => ({ k: i === 0 ? 'Types :' : '', v: t })),
      analysis.servitudes.commentaire,
      halfW, col2, yRight,
    );
  }

  pageFooter(doc, 2, 3);

  // ──────────────────────────────────────────────────────────────────
  // PAGE 3 — MARCHÉ, URBANISME, RECOMMANDATIONS, DISCLAIMER
  // ──────────────────────────────────────────────────────────────────
  doc.addPage();

  // Thin header (same as p2)
  setFill(doc, C.dark);
  doc.rect(0, 0, PAGE_W, 14, 'F');
  setFill(doc, C.emerald5);
  doc.rect(0, 14, PAGE_W, 1.5, 'F');
  setTextColor(doc, C.white);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('CadaStreMap · Foncier Risk Score', MARGIN, 9.5);
  setTextColor(doc, C.slate4);
  doc.setFont('helvetica', 'normal');
  doc.text(analysis.parcelRef, PAGE_W - MARGIN, 9.5, { align: 'right' });

  yPos = 24;

  // Marché foncier
  if (analysis.marcheFoncier) {
    yPos = sectionTitle(doc, yPos, 'Marché foncier', C.emerald6);

    const mF = analysis.marcheFoncier;
    const tendColor =
      mF.tendance === 'HAUSSE' ? C.emerald6 : mF.tendance === 'BAISSE' ? C.red : C.slate6;
    const tendArrow =
      mF.tendance === 'HAUSSE' ? '↗' : mF.tendance === 'BAISSE' ? '↘' : '→';

    setFill(doc, C.slate5);
    setDraw(doc, C.slate2);
    doc.setLineWidth(0.3);
    doc.roundedRect(MARGIN, yPos, CONTENT_W, 28, 3, 3, 'FD');

    // Prix m²
    setFill(doc, C.emerald6);
    doc.roundedRect(MARGIN + 4, yPos + 4, 50, 20, 2, 2, 'F');
    setTextColor(doc, C.white);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('PRIX MOYEN /m²', MARGIN + 29, yPos + 10, { align: 'center' });
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(mF.prixMoyenM2, MARGIN + 29, yPos + 19, { align: 'center' });

    // Tendance
    setFill(doc, C.white);
    doc.roundedRect(MARGIN + 60, yPos + 4, 34, 20, 2, 2, 'F');
    setTextColor(doc, C.slate4);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('TENDANCE', MARGIN + 77, yPos + 10, { align: 'center' });
    setTextColor(doc, tendColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${tendArrow} ${mF.tendance}`, MARGIN + 77, yPos + 19, { align: 'center' });

    // Comment
    const mfLines = doc.splitTextToSize(mF.commentaire, CONTENT_W - 106);
    setTextColor(doc, C.slate6);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(mfLines, MARGIN + 102, yPos + 10);

    yPos += 35;
  }

  // Urbanisme
  if (analysis.urbanisme) {
    yPos = sectionTitle(doc, yPos, 'Urbanisme & Permis de construire', C.teal);

    const urb = analysis.urbanisme;
    setFill(doc, C.slate5);
    setDraw(doc, C.slate2);
    doc.setLineWidth(0.3);
    doc.roundedRect(MARGIN, yPos, CONTENT_W, 26, 3, 3, 'FD');

    // Délai
    setFill(doc, C.teal);
    doc.roundedRect(MARGIN + 4, yPos + 4, 52, 18, 2, 2, 'F');
    setTextColor(doc, C.white);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text('DÉLAI ESTIMÉ PERMIS', MARGIN + 30, yPos + 9, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const delaiLines = doc.splitTextToSize(urb.tempsEstimePermis, 46);
    doc.text(delaiLines, MARGIN + 30, yPos + 15, { align: 'center' });

    // Projects
    const projText =
      urb.projetsProches.length > 0
        ? urb.projetsProches.join(' · ')
        : 'Aucun projet identifié à proximité';
    setTextColor(doc, C.slate7);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Projets proches :', MARGIN + 62, yPos + 9);
    setTextColor(doc, C.slate6);
    doc.setFont('helvetica', 'normal');
    const projLines = doc.splitTextToSize(projText, CONTENT_W - 70);
    doc.text(projLines, MARGIN + 62, yPos + 14);

    yPos += 33;

    const urbLines = doc.splitTextToSize(urb.commentaire, CONTENT_W);
    setTextColor(doc, C.slate6);
    doc.setFontSize(7.5);
    doc.text(urbLines, MARGIN, yPos);
    yPos += urbLines.length * 4 + 8;
  }

  // Recommandations
  if (analysis.recommandations.length > 0) {
    yPos = sectionTitle(doc, yPos, 'Recommandations', C.amber);

    for (let i = 0; i < analysis.recommandations.length; i++) {
      const rec = analysis.recommandations[i];
      const recLines = doc.splitTextToSize(rec, CONTENT_W - 14);
      const recH = recLines.length * 4.2 + 6;

      const bgColor: [number, number, number] = i % 2 === 0 ? [255, 251, 235] : C.white;
      setFill(doc, bgColor);
      setDraw(doc, [253, 230, 138] as [number, number, number]);
      doc.setLineWidth(0.2);
      doc.roundedRect(MARGIN, yPos, CONTENT_W, recH, 2, 2, 'FD');

      // Number circle
      setFill(doc, C.amber);
      doc.circle(MARGIN + 5, yPos + recH / 2, 3.5, 'F');
      setTextColor(doc, C.white);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`${i + 1}`, MARGIN + 5, yPos + recH / 2 + 2.5, { align: 'center' });

      setTextColor(doc, C.slate7);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(recLines, MARGIN + 12, yPos + 5);

      yPos += recH + 3;
    }
    yPos += 4;
  }

  // AI Summary (if not on page 1 already, always show here too)
  if (yPos < 230) {
    yPos = sectionTitle(doc, yPos, 'Synthèse de l\'IA', C.emerald6);
    const summaryLines = doc.splitTextToSize(analysis.resumeIA, CONTENT_W - 10);
    const summaryH = summaryLines.length * 4.2 + 8;
    setFill(doc, C.emeraldLight);
    doc.roundedRect(MARGIN, yPos, CONTENT_W, summaryH, 3, 3, 'F');
    setTextColor(doc, [6, 78, 59] as [number, number, number]);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(summaryLines, MARGIN + 5, yPos + 6);
    yPos += summaryH + 8;
  }

  // Disclaimer
  setFill(doc, C.slate5);
  setDraw(doc, C.slate2);
  doc.setLineWidth(0.2);
  const disclaimerText =
    'Ce rapport est généré par intelligence artificielle à titre informatif uniquement. Les scores et analyses sont ' +
    'basés sur des données publiques et des estimations. Pour toute décision d\'investissement, consultez un ' +
    'professionnel qualifié (notaire, géomètre-expert, urbaniste). CadaStreMap ne saurait être tenu responsable ' +
    'des décisions prises sur la base de ce rapport.';
  const dlLines = doc.splitTextToSize(disclaimerText, CONTENT_W - 10);
  const dlH = dlLines.length * 3.8 + 8;

  if (yPos + dlH < PAGE_H - 20) {
    doc.roundedRect(MARGIN, yPos, CONTENT_W, dlH, 2, 2, 'FD');
    setTextColor(doc, C.slate4);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(dlLines, MARGIN + 5, yPos + 5.5);
  }

  pageFooter(doc, 3, 3);

  // ──────────────────────────────────────────────────────────────────
  // Save
  // ──────────────────────────────────────────────────────────────────
  const filename = `foncier-risk-score_${analysis.commune.replace(/\s+/g, '-')}_${analysis.section}${analysis.numero}_${new Date(analysis.createdAt).toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
