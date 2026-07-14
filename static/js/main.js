/**
 * SiPEKA - main.js
 * Form submission, API call to Flask, modal result rendering, print.
 */

const $ = id => document.getElementById(id);
const val = id => {
  const el = $(id);
  if (!el) return null;
  const v = el.value.trim();
  return v === '' ? null : (el.type === 'number' ? parseFloat(v) : v);
};

function calcMAP() {
  const s = val('TD_Sistolik'), d = val('TD_Diastolik');
  $('MAP').value = (s && d) ? ((s + 2 * d) / 3).toFixed(1) : '';
}
function calcIMT() {
  const bb = val('BB_kg'), tb = val('TB_cm');
  $('IMT').value = (bb && tb && tb > 0) ? (bb / ((tb / 100) ** 2)).toFixed(1) : '';
}

function watchTD() {
  const sEl = $('TD_Sistolik'), dEl = $('TD_Diastolik');
  const hS = $('hint-sistolik'), hD = $('hint-diastolik');
  sEl.addEventListener('input', function () {
    calcMAP();
    const v = parseFloat(this.value);
    if (v >= 140) { hS.textContent = 'WASPADA! Sistolik >=140 mmHg - ambang PNPK!'; hS.className = 'form-hint hint-danger'; this.classList.add('input-danger'); this.classList.remove('input-warning'); }
    else if (v >= 130) { hS.textContent = 'Sistolik mendekati ambang waspada (>=130 mmHg)'; hS.className = 'form-hint hint-warning'; this.classList.add('input-warning'); this.classList.remove('input-danger'); }
    else { hS.textContent = 'Waspada jika >= 140 mmHg'; hS.className = 'form-hint'; this.classList.remove('input-danger', 'input-warning'); }
  });
  dEl.addEventListener('input', function () {
    calcMAP();
    const v = parseFloat(this.value);
    if (v >= 90) { hD.textContent = 'WASPADA! Diastolik >=90 mmHg - ambang PNPK!'; hD.className = 'form-hint hint-danger'; this.classList.add('input-danger'); this.classList.remove('input-warning'); }
    else if (v >= 85) { hD.textContent = 'Diastolik mendekati ambang waspada (>=85 mmHg)'; hD.className = 'form-hint hint-warning'; this.classList.add('input-warning'); this.classList.remove('input-danger'); }
    else { hD.textContent = 'Waspada jika >= 90 mmHg'; hD.className = 'form-hint'; this.classList.remove('input-danger', 'input-warning'); }
  });
}

function openModal() {
  const m = $('result-modal');
  m.classList.add('open');
  m.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  const m = $('result-modal');
  m.classList.remove('open');
  m.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

async function handleSubmit(e) {
  e.preventDefault();
  const sbp = val('TD_Sistolik'), dbp = val('TD_Diastolik');
  if (!sbp || !dbp) {
    showToast('Isi minimal TD Sistolik dan TD Diastolik!', 'error');
    return;
  }
  const payload = {
    Usia_Tahun            : val('Usia_Tahun'),
    TD_Sistolik           : sbp,
    TD_Diastolik          : dbp,
    MAP                   : parseFloat($('MAP').value) || null,
    Usia_Kehamilan_Minggu : val('Usia_Kehamilan_Minggu'),
    BB_kg                 : val('BB_kg'),
    TB_cm                 : val('TB_cm'),
    IMT                   : parseFloat($('IMT').value) || null,
    LILA_cm               : val('LILA_cm'),
    Protein_Uria          : val('Protein_Uria') !== null ? parseFloat(val('Protein_Uria')) : null,
    Gula_Darah            : val('Gula_Darah') !== null ? parseFloat(val('Gula_Darah')) : null,
  };
  Object.keys(payload).forEach(k => {
    if (payload[k] === null || payload[k] === undefined || isNaN(payload[k])) delete payload[k];
  });

  const btn = $('predict-btn');
  btn.classList.add('loading'); btn.disabled = true;
  try {
    const res = await fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.status === 'error') { showToast(data.message, 'error'); return; }
    renderResult(data);
    openModal();
  } catch (err) {
    showToast('Gagal terhubung ke server. Pastikan Flask berjalan.', 'error');
    console.error(err);
  } finally {
    btn.classList.remove('loading'); btn.disabled = false;
  }
}

function renderResult(data) {
  const isHigh = data.prediction === 1;
  const probPct = data.probability;
  const badge = $('risk-badge');
  badge.className = 'risk-badge ' + (isHigh ? 'high' : 'low');
  $('risk-label').textContent = 'HASIL SKRINING';
  $('risk-title').textContent = isHigh ? 'Perlu Rujukan / Berisiko' : 'Tidak Berisiko Tinggi';
  $('risk-sub').textContent = isHigh
    ? 'Probabilitas model: ' + probPct + '% - tindak lanjuti sesuai rekomendasi'
    : 'Probabilitas model: ' + probPct + '% - lanjutkan pemantauan rutin';
  $('risk-icon').innerHTML = isHigh
    ? '<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'
    : '<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>';
  $('prob-pct').textContent = probPct + '%';
  const fill = $('prob-fill');
  fill.className = 'prob-fill ' + (isHigh ? 'danger' : '');
  fill.style.width = '0%';
  setTimeout(() => { fill.style.width = probPct + '%'; }, 120);

  // Tanggal pemeriksaan
  const now = new Date();
  $('print-date').textContent = 'Tanggal pemeriksaan: ' +
    now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) +
    ', ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // Ringkasan data pemeriksaan
  const yn = v => (v === '1' ? 'Positif' : (v === '0' ? 'Negatif' : null));
  const recap = $('recap-grid');
  recap.innerHTML = '';
  [
    ['Usia Ibu', val('Usia_Tahun'), 'tahun'],
    ['Usia Kehamilan', val('Usia_Kehamilan_Minggu'), 'minggu'],
    ['TD Sistolik', val('TD_Sistolik'), 'mmHg'],
    ['TD Diastolik', val('TD_Diastolik'), 'mmHg'],
    ['MAP', $('MAP').value, 'mmHg'],
    ['Berat Badan', val('BB_kg'), 'kg'],
    ['Tinggi Badan', val('TB_cm'), 'cm'],
    ['IMT', $('IMT').value, 'kg/m²'],
    ['LILA', val('LILA_cm'), 'cm'],
    ['Protein Uria', yn(val('Protein_Uria')), ''],
    ['Gula Darah', yn(val('Gula_Darah')), ''],
  ].forEach(([label, value, unit]) => {
    if (value === null || value === undefined || value === '') return;
    const div = document.createElement('div');
    div.className = 'recap-item';
    div.innerHTML = '<span>' + label + '</span><b>' + value + (unit ? (' ' + unit) : '') + '</b>';
    recap.appendChild(div);
  });

  const flagsEl = $('flags-section');
  flagsEl.innerHTML = '';
  const icons = { danger: '[!]', warning: '[!]', info: '[i]', ok: '[ok]' };
  (data.clinical_flags || []).forEach(f => {
    const div = document.createElement('div');
    div.className = 'flag-item ' + f.level;
    div.textContent = (icons[f.level] || '') + ' ' + f.text;
    flagsEl.appendChild(div);
  });

  const rekomSection = $('rekom-section');
  rekomSection.className = 'rekom-section ' + (isHigh ? 'high' : 'low');
  const rekomList = $('rekom-list');
  rekomList.innerHTML = '';
  (data.rekomendasi || []).forEach(r => {
    const li = document.createElement('li');
    li.textContent = r;
    rekomList.appendChild(li);
  });
}

function resetForm() {
  $('predict-form').reset();
  $('MAP').value = ''; $('IMT').value = '';
  $('hint-sistolik').textContent = 'Waspada jika >= 140 mmHg'; $('hint-sistolik').className = 'form-hint';
  $('hint-diastolik').textContent = 'Waspada jika >= 90 mmHg'; $('hint-diastolik').className = 'form-hint';
  document.querySelectorAll('.input-danger, .input-warning').forEach(el => el.classList.remove('input-danger', 'input-warning'));
}

function fillExample() {
  const ex = {
    Usia_Tahun: 29, Usia_Kehamilan_Minggu: 34,
    TD_Sistolik: 145, TD_Diastolik: 95,
    BB_kg: 72, TB_cm: 158, LILA_cm: 24,
    Protein_Uria: '1', Gula_Darah: '0',
  };
  Object.keys(ex).forEach(id => {
    const el = $(id);
    if (!el) return;
    el.value = ex[id];
    el.dispatchEvent(new Event('input'));
    el.dispatchEvent(new Event('change'));
  });
  calcMAP(); calcIMT();
  showToast('Contoh data terisi. Klik Analisis Risiko untuk melihat hasilnya.', 'success');
}

function openPanduan() {
  const m = $('panduan-modal');
  m.classList.add('open');
  m.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function closePanduan() {
  const m = $('panduan-modal');
  m.classList.remove('open');
  m.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function showToast(msg, type = 'error') {
  let toast = document.querySelector('.toast');
  if (!toast) { toast = document.createElement('div'); toast.className = 'toast'; document.body.appendChild(toast); }
  toast.textContent = msg;
  toast.style.background = type === 'error' ? 'var(--red-600)' : 'var(--green-600)';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

/* ---- Tur onboarding ---- */
const tourSteps = [
  { el: null, title: 'Selamat Datang di SiPEKA', text: 'Alat bantu skrining risiko preeklampsia untuk bidan pada pemeriksaan ANC. Kenali fiturnya sebentar. Anda dapat melewati kapan saja.' },
  { el: '#form-card', title: 'Formulir Data Klinis', text: 'Masukkan data pemeriksaan pasien di sini. Hanya tekanan darah yang wajib diisi, data lain melengkapi bila tersedia.' },
  { el: '#TD_Sistolik', title: 'Tekanan Darah (Wajib)', text: 'Isi TD Sistolik dan Diastolik. Nilai MAP akan terhitung otomatis dari kedua nilai ini.' },
  { el: '#btn-example', title: 'Isi Contoh Data', text: 'Klik untuk mengisi data contoh secara otomatis. Berguna untuk mencoba sistem dengan cepat.' },
  { el: '#predict-btn', title: 'Analisis Risiko', text: 'Klik untuk menjalankan model dan menampilkan hasil prediksi beserta rekomendasi tindak lanjut.' },
  { el: '#btn-panduan', title: 'Panduan & Tutorial', text: 'Buka panduan penggunaan atau putar ulang tutorial ini kapan saja melalui tombol ini.' },
];
let tourIdx = 0;

function placeTour(elx) {
  const r = elx.getBoundingClientRect(), pad = 8;
  const spot = $('tour-spot'), pop = $('tour-pop');
  spot.style.left = (r.left - pad) + 'px';
  spot.style.top = (r.top - pad) + 'px';
  spot.style.width = (r.width + pad * 2) + 'px';
  spot.style.height = (r.height + pad * 2) + 'px';
  const popW = Math.min(320, window.innerWidth - 24);
  let top = r.bottom + 14, left = r.left;
  if (top + 200 > window.innerHeight) top = Math.max(12, r.top - 14 - 200);
  left = Math.min(Math.max(12, left), window.innerWidth - popW - 12);
  pop.style.left = left + 'px';
  pop.style.top = top + 'px';
}

function renderTour() {
  const step = tourSteps[tourIdx];
  const welcome = !step.el;
  $('tour').classList.toggle('welcome', welcome);
  $('tour-count').textContent = welcome ? '' : ('Langkah ' + tourIdx + ' dari ' + (tourSteps.length - 1));
  $('tour-title').textContent = step.title;
  $('tour-text').textContent = step.text;
  $('tour-prev').style.display = (!welcome && tourIdx > 1) ? '' : 'none';
  $('tour-next').textContent = welcome ? 'Mulai Tutorial' : (tourIdx === tourSteps.length - 1 ? 'Selesai' : 'Lanjut');
  if (welcome) return;
  const elx = document.querySelector(step.el);
  if (!elx) { nextTour(); return; }
  elx.scrollIntoView({ block: 'center', behavior: 'smooth' });
  setTimeout(() => placeTour(elx), 320);
}

function startTour() {
  tourIdx = 0;
  $('tour').classList.add('open');
  $('tour').setAttribute('aria-hidden', 'false');
  renderTour();
}
function endTour() {
  $('tour').classList.remove('open');
  $('tour').setAttribute('aria-hidden', 'true');
  try { localStorage.setItem('sipeka_tour_done', '1'); } catch (e) {}
}
function nextTour() { if (tourIdx < tourSteps.length - 1) { tourIdx++; renderTour(); } else { endTour(); } }
function prevTour() { if (tourIdx > 1) { tourIdx--; renderTour(); } }

document.addEventListener('DOMContentLoaded', () => {
  ['BB_kg', 'TB_cm'].forEach(id => { const el = $(id); if (el) el.addEventListener('input', calcIMT); });
  watchTD();
  $('predict-form').addEventListener('submit', handleSubmit);
  $('modal-close').addEventListener('click', closeModal);
  $('btn-reset').addEventListener('click', () => { closeModal(); resetForm(); });
  $('btn-print').addEventListener('click', () => window.print());
  $('result-modal').addEventListener('click', e => { if (e.target === $('result-modal')) closeModal(); });
  $('btn-example').addEventListener('click', fillExample);
  $('btn-panduan').addEventListener('click', openPanduan);
  $('panduan-close').addEventListener('click', closePanduan);
  $('panduan-ok').addEventListener('click', closePanduan);
  $('panduan-modal').addEventListener('click', e => { if (e.target === $('panduan-modal')) closePanduan(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closePanduan(); endTour(); } });
  $('tour-next').addEventListener('click', nextTour);
  $('tour-prev').addEventListener('click', prevTour);
  $('tour-skip').addEventListener('click', endTour);
  $('panduan-tour').addEventListener('click', () => { closePanduan(); startTour(); });
  const repositionTour = () => { if ($('tour').classList.contains('open') && tourSteps[tourIdx].el) { const e = document.querySelector(tourSteps[tourIdx].el); if (e) placeTour(e); } };
  window.addEventListener('resize', repositionTour);
  window.addEventListener('scroll', repositionTour, true);
  try { if (!localStorage.getItem('sipeka_tour_done')) setTimeout(startTour, 700); } catch (e) {}
  console.log('SiPEKA initialized');
});

