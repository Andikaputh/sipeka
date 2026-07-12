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

function showToast(msg, type = 'error') {
  let toast = document.querySelector('.toast');
  if (!toast) { toast = document.createElement('div'); toast.className = 'toast'; document.body.appendChild(toast); }
  toast.textContent = msg;
  toast.style.background = type === 'error' ? 'var(--red-600)' : 'var(--green-600)';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

document.addEventListener('DOMContentLoaded', () => {
  ['BB_kg', 'TB_cm'].forEach(id => { const el = $(id); if (el) el.addEventListener('input', calcIMT); });
  watchTD();
  $('predict-form').addEventListener('submit', handleSubmit);
  $('modal-close').addEventListener('click', closeModal);
  $('btn-reset').addEventListener('click', () => { closeModal(); resetForm(); });
  $('btn-print').addEventListener('click', () => window.print());
  $('result-modal').addEventListener('click', e => { if (e.target === $('result-modal')) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  console.log('SiPEKA initialized');
});
