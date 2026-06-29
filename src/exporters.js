/* ============================================================================
   exporters — экспорт «карт фаз»:
   • PDF — печать страницы фаз (печатный стиль в style.css, @media print).
   • PPTX — презентация: титул + слайд на фазу, бренд-палитра, текущий язык.
   Данные берём из board.js (ITERATIONS/TASKS/LANES) и phases.js (OUTCOME — ru-источник).
   ========================================================================== */

import { ITERATIONS, TASKS, LANES } from './board.js';
import { OUTCOME } from './phases.js';
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
    { x: 0.95, y: 4.1, w: 11.5, h: 0.5, fontFace: SANS, fontSize: 12, color: C.soft, align: 'left' },
  );

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
      s.addText([
        { text: `${trLane(lane)}\n`, options: { fontSize: 9, color: C.oak, bold: true } },
        { text: `${trTask(x, 'title')}\n`, options: { fontSize: 12, color: C.ink, bold: true } },
        { text: trTask(x, 'hook'), options: { fontSize: 9.5, color: C.faint } },
      ], { x: bx, y: by, w: 4.4, h: 1.34, fontFace: SANS, valign: 'top', fit: 'shrink', lineSpacingMultiple: 0.98 });
    });

    /* результат фазы */
    const ry = 5.55;
    s.addShape(pptx.ShapeType.rect, { x: 3.9, y: ry, w: 9.12, h: 1.75, fill: { color: it.demo ? C.railSoft : C.oakSoft } });
    s.addShape(pptx.ShapeType.rect, { x: 3.9, y: ry, w: 0.07, h: 1.75, fill: { color: rail } });
    s.addText(t('phases.result'), { x: 4.1, y: ry + 0.12, w: 8.7, h: 0.35, fontFace: SANS, fontSize: 11, bold: true, color: rail });
    s.addText(trOutcome(it.id, OUTCOME[it.id] || it.output), { x: 4.1, y: ry + 0.5, w: 8.75, h: 1.15, fontFace: SANS, fontSize: 10.5, color: C.ink, valign: 'top', fit: 'shrink' });
  });

  pptx.writeFile({ fileName: `kitchen-phases-${lang}.pptx` });
}
