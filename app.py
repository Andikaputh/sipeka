"""
SiPEKA - Sistem Prediksi Risiko Preeklampsia
Flask Backend API
==============================================
Cara menjalankan:
    pip install -r requirements.txt
    python app.py

Akses di: http://localhost:5000
"""

from flask import Flask, render_template, request, jsonify
import pickle
import numpy as np
import pandas as pd
import json
import os

app = Flask(__name__)

MODEL_DIR = os.path.join(os.path.dirname(__file__), 'model')

def load_artifacts():
    artifacts = {}
    files = {
        'model'   : 'model.pkl',
        'imputer' : 'imputer.pkl',
        'scaler'  : 'scaler.pkl',
        'features': 'features.pkl',
        'metrics' : 'metrics.json',
    }
    for key, fname in files.items():
        path = os.path.join(MODEL_DIR, fname)
        if os.path.exists(path):
            if fname.endswith('.pkl'):
                with open(path, 'rb') as f:
                    artifacts[key] = pickle.load(f)
            elif fname.endswith('.json'):
                with open(path, 'r') as f:
                    artifacts[key] = json.load(f)
            print(f"  OK: {fname}")
        else:
            print(f"  MISSING: {fname}")
            artifacts[key] = None
    return artifacts

print("\n" + "="*55)
print("  SiPEKA - Loading model artifacts...")
print("="*55)
ARTIFACTS = load_artifacts()

FEATURES = ARTIFACTS.get('features') or [
    'TD_Sistolik', 'TD_Diastolik', 'MAP', 'Protein_Uria',
    'Usia_Tahun', 'Usia_Kehamilan_Minggu', 'IMT', 'LILA_cm', 'Gula_Darah',
]

THRESHOLD = 0.35
if ARTIFACTS.get('metrics'):
    THRESHOLD = ARTIFACTS['metrics'].get('final_threshold', 0.35)

print(f"  Features  : {len(FEATURES)}")
print(f"  Threshold : {THRESHOLD}")
print("="*55 + "\n")


def build_rekomendasi(pred, data, severe=False):
    """Rekomendasi bervariasi sesuai kondisi & faktor risiko pasien."""
    def g(k):
        try: return float(data.get(k))
        except (TypeError, ValueError): return None
    sbp, dbp = g('TD_Sistolik'), g('TD_Diastolik')
    prot, gula = g('Protein_Uria'), g('Gula_Darah')
    usia, imt, lila = g('Usia_Tahun'), g('IMT'), g('LILA_cm')
    r = []
    if pred == 1:
        if severe or (sbp and sbp >= 160) or (dbp and dbp >= 110):
            r.append("RUJUK SEGERA ke RS/SpOG - tekanan darah pada tingkat kegawatan kehamilan.")
            r.append("Stabilkan pasien, siapkan rujukan, dan dampingi selama proses rujukan.")
        elif (sbp and sbp >= 140) or (dbp and dbp >= 90):
            r.append("Rujuk / konsultasikan ke dokter atau SpOG - tekanan darah telah mencapai ambang PNPK.")
            r.append(f"Istirahatkan pasien 10-15 menit, lalu ukur ulang TD (saat ini {int(sbp or 0)}/{int(dbp or 0)} mmHg).")
        else:
            r.append("Konsultasikan ke dokter untuk evaluasi lebih lanjut terkait risiko preeklampsia.")
            r.append("Jadwalkan kontrol ANC lebih rapat dari biasanya.")
        if prot == 1:
            r.append("Proteinuria positif - konfirmasi dengan pemeriksaan urin lanjutan dan catat perkembangannya.")
        else:
            r.append("Proteinuria belum positif - pantau melalui pemeriksaan urin pada kunjungan berikutnya.")
        if gula == 1:
            r.append("Skrining gula darah positif - evaluasi kemungkinan diabetes gestasional.")
        if imt is not None and imt >= 30:
            r.append(f"IMT {imt:.1f} (obesitas) - edukasi gizi seimbang dan pemantauan kenaikan berat badan.")
        if lila is not None and lila < 23.5:
            r.append(f"LILA {lila:.1f} cm (<23,5 = KEK) - rujuk konseling gizi untuk perbaikan asupan.")
        if usia is not None and (usia >= 35 or usia < 20):
            r.append(f"Usia {int(usia)} tahun termasuk faktor risiko - tingkatkan kewaspadaan pemantauan.")
        r.append("Edukasi tanda bahaya: nyeri kepala hebat, pandangan kabur, nyeri ulu hati, bengkak mendadak.")
    else:
        r.append("Lanjutkan pemeriksaan ANC rutin sesuai jadwal Kemenkes (minimal 6x).")
        r.append("Pantau tekanan darah pada setiap kunjungan ANC berikutnya.")
        if gula == 1:
            r.append("Catatan: skrining gula darah positif - tetap pantau meski risiko preeklampsia rendah.")
        if imt is not None and imt >= 30:
            r.append(f"Catatan: IMT {imt:.1f} tergolong tinggi - anjurkan pola makan sehat dan aktivitas ringan.")
        if lila is not None and lila < 23.5:
            r.append(f"Catatan: LILA {lila:.1f} cm menandakan KEK - perbaiki asupan gizi ibu.")
        if usia is not None and (usia >= 35 or usia < 20):
            r.append(f"Catatan: usia {int(usia)} tahun - pemantauan sedikit lebih ketat dianjurkan.")
        if not (gula == 1 or (imt and imt >= 30) or (lila and lila < 23.5)):
            r.append("Edukasi pola makan bergizi, rendah garam, cukup istirahat, dan aktivitas fisik ringan.")
        r.append("Ingatkan pasien memeriksakan diri bila muncul nyeri kepala, bengkak, atau pandangan kabur.")
    r.append("Dokumentasikan hasil pemeriksaan pada buku KIA dan rekam medis.")
    return r


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json(force=True)
        required = ['TD_Sistolik', 'TD_Diastolik']
        missing = [f for f in required if f not in data]
        if missing:
            return jsonify({'status': 'error',
                            'message': f'Field wajib tidak ada: {missing}'}), 400

        if 'MAP' not in data or data.get('MAP') is None:
            data['MAP'] = round(
                (float(data['TD_Sistolik']) + 2 * float(data['TD_Diastolik'])) / 3, 1)

        row = {}
        for feat in FEATURES:
            v = data.get(feat)
            row[feat] = float(v) if v is not None else np.nan
        df_input = pd.DataFrame([row], columns=FEATURES)

        model   = ARTIFACTS.get('model')
        imputer = ARTIFACTS.get('imputer')
        scaler  = ARTIFACTS.get('scaler')

        if model is None:
            sbp = float(data.get('TD_Sistolik', 0))
            dbp = float(data.get('TD_Diastolik', 0))
            prob = round(min(0.99, max(0.01,
                (sbp - 90) / 80 * 0.5 + (dbp - 60) / 50 * 0.3)), 3)
            prot_demo = data.get('Protein_Uria')
            hi_bp = (sbp >= 130 or dbp >= 85)
            pred = 1 if (hi_bp and prot_demo is not None and float(prot_demo) == 1) else 0
        else:
            X = imputer.transform(df_input) if imputer else df_input.values
            X = scaler.transform(X) if scaler else X
            prob = float(model.predict_proba(X)[0][1])
            pred = int(prob >= THRESHOLD)

        sbp_o = float(data.get('TD_Sistolik', 0))
        dbp_o = float(data.get('TD_Diastolik', 0))
        clinical_override = False
        override_reason = None
        if sbp_o >= 160 or dbp_o >= 110:
            clinical_override = True
            override_reason = ('Hipertensi berat (TD >=160/110 mmHg) - kegawatan '
                               'kehamilan, rujuk SEGERA terlepas dari skor model.')
        elif sbp_o >= 140 or dbp_o >= 90:
            clinical_override = True
            override_reason = ('TD >=140/90 mmHg (ambang PNPK) - perlu rujukan / '
                               'evaluasi lanjut terlepas dari skor model.')
        if clinical_override:
            pred = 1

        flags = []
        sbp = sbp_o
        dbp = dbp_o
        prot = data.get('Protein_Uria')

        if sbp >= 140:
            flags.append({'level': 'danger', 'text': f'TD Sistolik {sbp:.0f} mmHg >= 140 - ambang PNPK!'})
        elif sbp >= 130:
            flags.append({'level': 'warning', 'text': f'TD Sistolik {sbp:.0f} mmHg mendekati ambang waspada'})
        if dbp >= 90:
            flags.append({'level': 'danger', 'text': f'TD Diastolik {dbp:.0f} mmHg >= 90 - ambang PNPK!'})
        elif dbp >= 85:
            flags.append({'level': 'warning', 'text': f'TD Diastolik {dbp:.0f} mmHg mendekati ambang waspada'})
        if prot is not None and float(prot) == 1:
            flags.append({'level': 'warning', 'text': 'Protein Uria positif - konfirmasi dengan pemeriksaan lanjutan'})
        usia = data.get('Usia_Tahun')
        if usia is not None:
            usia = float(usia)
            if usia >= 35:
                flags.append({'level': 'info', 'text': f'Usia {int(usia)} tahun - faktor risiko usia lanjut'})
            elif usia < 20:
                flags.append({'level': 'info', 'text': f'Usia {int(usia)} tahun - faktor risiko usia muda'})
        if not flags:
            flags.append({'level': 'ok', 'text': 'Semua parameter dalam batas normal'})
        if clinical_override:
            flags.insert(0, {'level': 'danger', 'text': 'OVERRIDE KLINIS: ' + override_reason})

        return jsonify({
            'status'            : 'success',
            'prediction'        : pred,
            'clinical_override' : clinical_override,
            'override_reason'   : override_reason,
            'probability'       : round(prob * 100, 1),
            'probability_raw'   : round(prob, 4),
            'threshold'         : THRESHOLD,
            'label'             : 'Perlu Rujukan / Berisiko' if pred == 1 else 'Tidak Berisiko Tinggi',
            'clinical_flags'    : flags,
            'rekomendasi'       : build_rekomendasi(pred, data, severe=(sbp_o >= 160 or dbp_o >= 110)),
            'input_data'        : {k: (round(v, 2) if isinstance(v, float) else v)
                                   for k, v in row.items() if not (isinstance(v, float) and np.isnan(v))},
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/health')
def health():
    model_loaded = ARTIFACTS.get('model') is not None
    return jsonify({
        'status'      : 'ok',
        'model_loaded': model_loaded,
        'mode'        : 'production' if model_loaded else 'demo (rule-based)',
        'features'    : FEATURES,
        'threshold'   : THRESHOLD,
    })


@app.route('/api/info')
def info():
    return jsonify(ARTIFACTS.get('metrics') or {})


if __name__ == '__main__':
    print("SiPEKA berjalan di http://localhost:5000")
    print("Mode:", 'production' if ARTIFACTS.get('model') else 'demo')
    app.run(debug=True, host='0.0.0.0', port=5000)
