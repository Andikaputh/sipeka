# SiPEKA — Prototipe Pendukung Skrining ANC Berbasis Aturan

Proyek Penulisan Ilmiah yang mencakup notebook persiapan data, pemodelan XGBoost + SMOTE terhadap label aturan, artefak model, visualisasi penelitian, dan prototipe aplikasi web Flask. Judul artikel turunan yang disetujui berbeda dari judul PI dan membatasi klaim pada evaluasi awal teknologi skrining.

> **Prototipe penelitian, bukan alat diagnosis atau perangkat klinis tervalidasi.** Label dibentuk dari `(TD sistolik >=130 ATAU diastolik >=85) DAN proteinuria biner positif`; model mempelajari label tersebut, bukan diagnosis klinisi. Skor dan peringatan TD terpisah tidak menggantikan evaluasi tenaga medis. Dataset pasien tidak disertakan.

## Peta repositori

```text
sipeka/
├── README.md
├── research/
│   ├── README.md                      # alur penelitian, reproduksi, keterbatasan
│   ├── requirements.txt               # tambahan paket untuk notebook
│   └── notebooks/
│       ├── SiPEKA_Data_Preparation.ipynb
│       ├── SiPEKA_Modeling.ipynb          # arsip asli, tidak diubah
│       └── SiPEKA_Modeling_CRISPDM.ipynb  # modeling, ditata ulang per CRISP-DM
├── reports/figures/                   # arsip run lama + gambar OOF model aktif
├── model/                            # artefak yang dipakai aplikasi (tetap di sini)
│   ├── README.txt
│   ├── features.pkl
│   ├── imputer.pkl
│   ├── scaler.pkl
│   ├── model.pkl
│   └── metrics.json
├── app.py                            # backend Flask
├── templates/index.html              # halaman aplikasi
├── static/                           # CSS dan JavaScript
├── requirements.txt                  # dependensi aplikasi
├── Procfile
└── render.yaml                       # konfigurasi deployment yang sudah ada
```

## Mau memahami bagian mana?

| Bagian | Mulai dari |
|---|---|
| Pengolahan laporan ANC menjadi dataset | [Notebook persiapan data](research/notebooks/SiPEKA_Data_Preparation.ipynb) |
| Pelatihan, perbandingan, dan evaluasi model | [Notebook modeling — versi CRISP-DM](research/notebooks/SiPEKA_Modeling_CRISPDM.ipynb) · [asli](research/notebooks/SiPEKA_Modeling.ipynb) |
| Cara menjalankan penelitian dan batasannya | [Panduan penelitian](research/README.md) |
| Angka hasil eksperimen tersimpan dan urutan fitur | [model/metrics.json](model/metrics.json) |
| Gambar EDA dan evaluasi (bedakan arsip dan aktif) | [reports/figures/README.md](reports/figures/README.md) |
| Cara inferensi dan respons API | [app.py](app.py) |

## Alur singkat

1. Notebook persiapan data membaca laporan ANC Excel dan menghasilkan `Dataset_Primer_Final.csv` serta `.xlsx`.
2. Notebook modeling menerima CSV, membentuk label berbasis aturan, melatih/membandingkan model, dan menyimpan artefak serta grafik.
3. Artefak aplikasi berada di `model/`; Flask memuat imputer, scaler, daftar fitur, model, dan metrik dari lokasi tersebut.
4. Gambar hasil eksperimen yang diarsipkan di repo berada di `reports/figures/`. Notebook asli menyimpan output relatif ke direktori kerja, bukan otomatis ke folder arsip ini.

Notebook asli di `research/` tetap arsip run lama. Artefak aktif `model/` berasal dari eksperimen OOF yang terpisah dan terdokumentasi di folder penelitian lokal (bukan notebook lama tersebut).

## Menjalankan aplikasi secara lokal

Dari root repo, gunakan environment Python terpisah:

```bash
python -m venv .venv
```

Aktifkan environment sesuai terminal:

```bat
:: Windows Command Prompt
.venv\Scripts\activate.bat
```

```bash
# Linux/macOS
source .venv/bin/activate
```

Lalu:

```bash
python -m pip install -r requirements.txt
python app.py
```

Buka `http://localhost:5000`. Jalankan `python -m unittest discover -s tests -v` untuk memeriksa kontrak model/API dengan input rekaan. Entry point lokal mengaktifkan debug dan bind ke semua interface; gunakan hanya di lingkungan pengembangan tepercaya, bukan sebagai server publik. `Procfile`/`render.yaml` memakai Gunicorn.

**Keamanan artefak:** aplikasi menggunakan pickle. Muat hanya artefak dari sumber tepercaya; pickle dapat menjalankan kode saat dimuat. Kecocokan versi pustaka juga memengaruhi kemampuan memuat model. Versi runtime lengkap saat pelatihan belum diarsipkan, sehingga reproduksi persis belum dijamin.

## Model dan keluaran aplikasi

- Urutan fitur tercatat di `model/metrics.json` dan `model/features.pkl`.
- Alur inferensi: imputer → scaler → `predict_proba` → pembandingan dengan threshold.
- Threshold aktif adalah **0,838**; confusion matrix terhadap label aturan pada 301 baris uji: TP 17, FN 2, FP 0, TN 282. Backend membaca ambang dari `metrics.json`.
- Bundle `model/model.pkl` yang benar-benar di-deploy berbeda satu prediksi dari model yang dilatih ulang untuk laporan: pada 301 baris yang sama hasilnya TP 17, FN 2, FP 1, TN 281 (akurasi 99,00%; precision 94,44%; F1 91,89%; korelasi skor 0,9986). Angka laporan utama tetap 17/2/0/282; perbedaan dicatat di `metrics.json` (`deployed_bundle_check`) dan dibahas terbuka di draf artikel.
- Respons `/api/predict` memisahkan `model_prediction`, `rule_indicator`, dan `clinical_override` (peringatan TD). Metrik model **tidak** mencakup override; pesan aplikasi bukan diagnosis atau rekomendasi klinis tervalidasi.
- Proteinuria yang tidak diisi menghasilkan `rule_indicator: null`, **bukan** negatif.
- Jika model atau ambang tidak tersedia, backend memakai mode demo berbasis aturan, bukan menebak ambang lain. Nilai `production` pada `/api/health` hanya menandakan model berhasil dimuat menurut kode, bukan sertifikasi kesiapan klinis/produksi.

| Endpoint | Metode | Fungsi |
|---|---|---|
| `/` | GET | Halaman web |
| `/api/health` | GET | Status pemuatan model, fitur, threshold |
| `/api/info` | GET | Metrik/metadata yang tersimpan |
| `/api/predict` | POST | Prediksi prototipe dan respons pendukung |

## Batasan penelitian yang wajib dibaca

Label penelitian dibentuk dari tekanan darah dan proteinuria, yang juga masuk sebagai fitur model. Metrik tinggi karena model mempelajari ulang aturan tersebut **bukan bukti deteksi penyakit secara independen**. Notebook lama memilih threshold menggunakan test set; artefak aktif memilihnya melalui OOF data latih. Pada eksperimen aktif imputer/scaler masih di-fit pada seluruh data latih sebelum CV, sehingga CV **belum** sepenuhnya terisolasi antarfold. Jangan mengklaim validasi eksternal atau diagnosis klinis. Lihat [panduan penelitian](research/README.md).

## Privasi dan cakupan

Tidak menyertakan laporan pasien, CSV/Excel hasil olahan, naskah Word, ZIP lokal, environment Python, atau folder Downloads. Notebook yang diarsipkan tidak memiliki output sel saat diperiksa. Hindari commit output yang berisi nama, nomor rekam medis, atau data individual pasien ketika menjalankan ulang.
