/* ============================================================================
   exporters — экспорт «карт фаз»:
   • PDF — печать страницы фаз (печатный стиль в style.css, @media print).
   • PPTX — презентация: титул + слайд на фазу, бренд-палитра, текущий язык.
   Данные берём из board.js (ITERATIONS/TASKS/LANES) и phases.js (OUTCOME — ru-источник).
   ========================================================================== */

import { ITERATIONS, TASKS, LANES } from './board.js';
import { OUTCOME, EXTRA } from './phases.js';
import { getLang, t, trIter, trLane, trTask, trOutcome } from './i18n.js';

const laneById = Object.fromEntries(LANES.map((l) => [l.id, l]));

/* ── PDF: печать (пользователь сохраняет как PDF из диалога печати) ── */
export function exportPhasesPDF() {
  const prev = document.title;
  document.title = `${t('export.coverTitle')} — ${getLang().toUpperCase()}`;
  const restore = () => { document.title = prev; window.removeEventListener('afterprint', restore); };
  window.addEventListener('afterprint', restore);
  window.print();
}

/* ── PPTX ── */
const C = {
  paper: 'ECE4D5', card: 'F6F0E4', ink: '1D1A15', soft: '564F43', faint: '8A8270',
  acc: 'B3502A', oak: '9C6B32', white: 'F7EFE4', railSoft: 'F3E0D2', oakSoft: 'F0E7D2',
};
const SERIF = 'Georgia';
const SANS = 'Calibri';

export async function exportPhasesPPTX() {
  const lang = getLang();
  const { default: PptxGenJS } = await import('pptxgenjs');
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33 × 7.5"
  pptx.author = 'Kitchen Planner';
  pptx.title = t('export.coverTitle');

  /* титульный слайд */
  const cover = pptx.addSlide();
  cover.background = { color: C.paper };
  cover.addShape(pptx.ShapeType.rect, { x: 0, y: 3.05, w: 13.33, h: 0.06, fill: { color: C.acc } });
  cover.addText(t('export.coverTitle'), {
    x: 0.9, y: 1.9, w: 11.5, h: 1.1, fontFace: SERIF, fontSize: 46, bold: true, color: C.ink, align: 'left',
  });
  cover.addText(t('export.coverSubtitle'), {
    x: 0.95, y: 3.25, w: 11.5, h: 0.5, fontFace: SANS, fontSize: 18, color: C.acc, align: 'left',
  });
  cover.addText(
    ITERATIONS.map((it, i) => `${String(i).padStart(2, '0')}  ${trIter(it, 'sub')}`).join('    ·    '),
    { x: 0.95, y: 4.0, w: 11.5, h: 0.5, fontFace: SANS, fontSize: 12, color: C.soft, align: 'left' },
  );

  /* «фронты работ → продукт» — формула цели (как в шапке страницы) */
  const FR = ['editor', 'planner', 'data', 'ai'];
  cover.addText(t('phases.fronts.h').toUpperCase(), {
    x: 0.95, y: 4.74, w: 11, h: 0.3, fontFace: SANS, fontSize: 10, bold: true, color: C.faint, charSpacing: 2,
  });
  const fy = 5.12, fh = 1.25, gap = 0.46, x0 = 0.95;
  const cellW = (12.43 - x0 - gap * 4) / 5;
  const drawCell = (fx, key, accent) => {
    cover.addShape(pptx.ShapeType.rect, {
      x: fx, y: fy, w: cellW, h: fh,
      fill: { color: accent ? C.acc : C.card }, line: accent ? { type: 'none' } : { color: 'D9CDB6', width: 0.5 },
    });
    cover.addText([
      { text: `${accent ? '★ ' : ''}${t(`phases.fronts.${key}.t`)}\n`, options: { fontSize: 12.5, bold: true, color: accent ? 'FFFFFF' : C.ink } },
      { text: t(`phases.fronts.${key}.s`), options: { fontSize: 8.5, color: accent ? 'FCE9DE' : C.faint } },
    ], { x: fx + 0.14, y: fy + 0.12, w: cellW - 0.28, h: fh - 0.24, fontFace: SANS, valign: 'top', fit: 'shrink', lineSpacingMultiple: 1.0 });
  };
  FR.forEach((key, i) => {
    const fx = x0 + i * (cellW + gap);
    drawCell(fx, key, false);
    cover.addText(i < FR.length - 1 ? '+' : '=', {
      x: fx + cellW, y: fy, w: gap, h: fh, fontFace: SERIF, fontSize: 18, bold: true,
      color: i < FR.length - 1 ? C.acc : C.faint, align: 'center', valign: 'middle',
    });
  });
  drawCell(x0 + 4 * (cellW + gap), 'goal', true);

  /* по слайду на фазу */
  ITERATIONS.forEach((it, idx) => {
    const s = pptx.addSlide();
    s.background = { color: C.paper };
    const rail = it.demo ? C.acc : C.oak;

    /* левый корешок */
    s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 3.5, h: 7.5, fill: { color: rail } });
    s.addText(String(idx).padStart(2, '0'), { x: 0.32, y: 0.25, w: 2.9, h: 1.5, fontFace: SERIF, fontSize: 82, bold: true, color: C.white });
    s.addText(trIter(it, 'sub'), { x: 0.34, y: 1.75, w: 2.95, h: 1.1, fontFace: SERIF, fontSize: 23, bold: true, color: 'FFFFFF', valign: 'top' });
    s.addText(`${trIter(it, 'name')} · ${trIter(it, 'weeks')}`, { x: 0.34, y: 2.78, w: 2.95, h: 0.4, fontFace: SANS, fontSize: 11, color: C.white });
    s.addText(trIter(it, 'why'), { x: 0.34, y: 3.25, w: 2.95, h: 2.5, fontFace: SANS, fontSize: 12.5, color: 'F4E5DA', valign: 'top', fit: 'shrink' });
    s.addText(it.demo ? t('phases.flag.demo') : t('phases.flag.internal'), { x: 0.34, y: 6.75, w: 2.95, h: 0.4, fontFace: SANS, fontSize: 10, bold: true, color: 'FCE9DE' });

    /* справа: кто что делает */
    s.addText(t('phases.subh').toUpperCase(), { x: 3.9, y: 0.35, w: 9.1, h: 0.4, fontFace: SANS, fontSize: 12, bold: true, color: C.acc, charSpacing: 2 });

    const tasks = TASKS.filter((x) => x.iter === it.id);
    tasks.forEach((x, i) => {
      const lane = laneById[x.lane];
      const col = i % 2;
      const row = Math.floor(i / 2);
      const bx = 3.9 + col * 4.62;
      const by = 0.9 + row * 1.42;
      const pts = trTask(x, 'points');
      const lines = Array.isArray(pts) && pts.length ? pts : [trTask(x, 'hook')];
      const runs = [
        { text: `${trLane(lane)}\n`, options: { fontSize: 9, color: C.oak, bold: true } },
        { text: `${trTask(x, 'title')}\n`, options: { fontSize: 11.5, color: C.ink, bold: true } },
      ];
      lines.forEach((p, k) => runs.push({
        text: `–  ${p}${k < lines.length - 1 ? '\n' : ''}`,
        options: { fontSize: 8.5, color: C.faint },
      }));
      s.addText(runs, { x: bx, y: by, w: 4.4, h: 1.34, fontFace: SANS, valign: 'top', fit: 'shrink', lineSpacingMultiple: 1.0 });
    });

    /* результат фазы */
    const ry = 5.55;
    s.addShape(pptx.ShapeType.rect, { x: 3.9, y: ry, w: 9.12, h: 1.75, fill: { color: it.demo ? C.railSoft : C.oakSoft } });
    s.addShape(pptx.ShapeType.rect, { x: 3.9, y: ry, w: 0.07, h: 1.75, fill: { color: rail } });
    s.addText(t('phases.result'), { x: 4.1, y: ry + 0.12, w: 8.7, h: 0.35, fontFace: SANS, fontSize: 11, bold: true, color: rail });
    s.addText(trOutcome(it.id, OUTCOME[it.id] || it.output), { x: 4.1, y: ry + 0.5, w: 8.75, h: 1.15, fontFace: SANS, fontSize: 10.5, color: C.ink, valign: 'top', fit: 'shrink' });
  });

  /* слайд «Дополнительные платежи» */
  const ex = pptx.addSlide();
  ex.background = { color: C.paper };
  ex.addText(t('ex.eyebrow').toUpperCase(), { x: 0.6, y: 0.4, w: 12, h: 0.3, fontFace: SANS, fontSize: 10, bold: true, color: C.acc, charSpacing: 2 });
  ex.addText(t('ex.h'), { x: 0.6, y: 0.7, w: 12, h: 0.6, fontFace: SERIF, fontSize: 30, bold: true, color: C.ink });

  const hOpt = { fill: C.oak, color: 'F6EDE2', bold: true, fontSize: 9, valign: 'middle' };
  const rows = [[
    { text: '#', options: { ...hOpt, align: 'center' } },
    { text: t('ex.col.item'), options: hOpt },
    { text: t('ex.col.desc'), options: hOpt },
    { text: t('ex.col.pay'), options: hOpt },
    { text: t('ex.col.price'), options: { ...hOpt, align: 'right' } },
  ]];
  EXTRA.forEach((r, i) => {
    const n = String(i + 1);
    const desc = r.dk ? t(`ex.${r.dk}.d`) : '';
    if (r.kind === 'group') {
      const g = { fill: 'E9DFCA', valign: 'middle' };
      rows.push([
        { text: n, options: { ...g, align: 'center', fontSize: 8.5, color: C.soft } },
        { text: `${r.item}${r.choose ? `  ${t('ex.choose')}` : ''}`, options: { ...g, bold: true, fontFace: SERIF, fontSize: 10.5, color: C.ink } },
        { text: desc, options: { ...g, fontSize: 8, color: C.soft } },
        { text: '', options: g }, { text: '', options: g },
      ]);
    } else if (r.kind === 'total') {
      const a = { fill: C.acc, valign: 'middle' };
      rows.push([
        { text: '', options: a }, { text: '', options: a },
        { text: t('ex.total'), options: { ...a, color: 'FFFFFF', bold: true, align: 'right', fontSize: 9 } },
        { text: t(`ex.pay.${r.pay}`), options: { ...a, color: 'FCE9DE', fontSize: 8.5 } },
        { text: r.price, options: { ...a, color: 'FFFFFF', bold: true, align: 'right', fontSize: 11 } },
      ]);
    } else {
      rows.push([
        { text: n, options: { align: 'center', fontSize: 8.5, color: C.faint, valign: 'middle' } },
        { text: r.item, options: { bold: true, fontSize: 9, color: C.ink, valign: 'middle' } },
        { text: desc, options: { fontSize: 8, color: C.soft, valign: 'middle' } },
        { text: r.pay ? t(`ex.pay.${r.pay}`) : '', options: { fontSize: 8, color: C.oak, valign: 'middle' } },
        { text: r.price !== undefined ? r.price : '', options: { align: 'right', bold: true, fontSize: 9.5, color: C.ink, valign: 'middle' } },
      ]);
    }
  });
  ex.addTable(rows, {
    x: 0.6, y: 1.55, w: 12.13, colW: [0.5, 2.7, 6.03, 1.5, 1.4], rowH: 0.34,
    fontFace: SANS, border: { type: 'solid', color: 'D9CDB6', pt: 0.5 }, margin: [2, 5, 2, 5], autoPage: false,
  });

  pptx.writeFile({ fileName: `kitchen-phases-${lang}.pptx` });
}
