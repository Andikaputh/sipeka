# SiPEKA — Sistem Prediksi Risiko Preeklampsia

Proyek Penulisan Ilmiah yang mencakup notebook persiapan data, pemodelan XGBoost + SMOTE, artefak model, visualisasi penelitian, dan prototipe aplikasi web Flask.

> **Prototipe penelitian, bukan alat diagnosis atau perangkat klinis tervalidasi.** Skor dan pesan aplikasi tidak menggantikan evaluasi tenaga medis. Dataset pasien tidak disertakan. Metrik tersimpan merupakan hasil eksperimen terdahulu, bukan hasil pelatihan ulang atau validasi independen pada pembaruan dokumentasi ini.

## Peta repositori

```text
sipeka/
├── README.md
├── research/
│   ├── README.md                      # alur penelitian, reproduksi, keterbatasan
│   ├── requirements.txt               # tambahan paket untuk notebook
│   └── notebooks/
│       ├── SiPEKA_Data_Preparation.ipynb
│       └── SiPEKA_Modeling.ipynb
├── reports/figures/                   # enam gambar hasil penelitian tersimpan
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
| Pelatihan, perbandingan, dan evaluasi model | [Notebook modeling](research/notebooks/SiPEKA_Modeling.ipynb) |
| Cara menjalankan penelitian dan batasannya | [Panduan penelitian](research/README.md) |
| Angka hasil eksperimen tersimpan dan urutan fitur | [model/metrics.json](model/metrics.json) |
| Gambar EDA dan evaluasi | [reports/figures](reports/figures/) |
| Cara inferensi dan respons API | [app.py](app.py) |

## Alur singkat

1. Notebook persiapan data membaca laporan ANC Excel dan menghasilkan `Dataset_Primer_Final.csv` serta `.xlsx`.
2. Notebook modeling menerima CSV, membentuk label berbasis aturan, melatih/membandingkan model, dan menyimpan artefak serta grafik.
3. Artefak aplikasi berada di `model/`; Flask memuat imputer, scaler, daftar fitur, model, dan metrik dari lokasi tersebut.
4. Gambar hasil eksperimen yang diarsipkan di repo berada di `reports/figures/`. Notebook asli menyimpan output relatif ke direktori kerja, bukan otomatis ke folder arsip ini.

Notebook ditambahkan dari bahan penelitian lokal tanpa mengubah kode atau menggabungkannya. File model yang sudah ada cocok byte-per-byte dengan hasil model lokal saat diperiksa; tidak dibuat salinan PKL kedua di `research/`.

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

Buka `http://localhost:5000`. Perintah di atas mendokumentasikan entry point yang sudah ada; aplikasi belum diuji ulang dalam pembaruan arsip penelitian ini. Entry point lokal mengaktifkan debug dan bind ke semua interface; gunakan hanya di lingkungan pengembangan tepercaya, bukan sebagai server publik. `Procfile`/`render.yaml` tetap memakai Gunicorn tanpa mengubah struktur aplikasi.

**Keamanan artefak:** aplikasi menggunakan pickle. Muat hanya artefak dari sumber tepercaya; pickle dapat menjalankan kode saat dimuat. Kecocokan versi pustaka juga memengaruhi kemampuan memuat model. Versi runtime lengkap saat pelatihan belum diarsipkan, sehingga reproduksi persis belum dijamin.

## Model dan keluaran aplikasi

- Urutan fitur tercatat di `model/metrics.json` dan `model/features.pkl`.
- Alur inferensi: imputer → scaler → `predict_proba` → pembandingan dengan threshold.
- Threshold tersimpan saat dokumentasi dibuat adalah `0.627`; backend membacanya dari `metrics.json` dan memiliki nilai fallback jika metrik tidak tersedia.
- Backend juga menerapkan aturan override terpisah dari prediksi model. Karena itu keluaran aplikasi tidak selalu sama dengan klasifikasi model murni. Aturan tersebut adalah perilaku prototipe, bukan rekomendasi klinis yang diverifikasi dalam dokumentasi ini.
- Jika model tidak tersedia, backend menyediakan fallback demo. Nilai `production` pada `/api/health` hanya menandakan model berhasil dimuat menurut kode, bukan sertifikasi kesiapan klinis/produksi.

| Endpoint | Metode | Fungsi |
|---|---|---|
| `/` | GET | Halaman web |
| `/api/health` | GET | Status pemuatan model, fitur, threshold |
| `/api/info` | GET | Metrik/metadata yang tersimpan |
| `/api/predict` | POST | Prediksi prototipe dan respons pendukung |

## Batasan penelitian yang wajib dibaca

Label penelitian dibentuk dari tekanan darah dan proteinuria, yang juga masuk sebagai fitur model. Metrik tinggi karena model mempelajari ulang aturan tersebut **bukan bukti deteksi penyakit secara independen**. Selain itu, notebook memilih threshold menggunakan label test set dan melakukan preprocessing sebelum cross-validation; angka evaluasi memerlukan audit metodologi sebelum dipakai untuk klaim generalisasi. Lihat rincian di [panduan penelitian](research/README.md).

## Privasi dan cakupan

Tidak menyertakan laporan pasien, CSV/Excel hasil olahan, naskah Word, ZIP lokal, environment Python, atau folder Downloads. Notebook yang diarsipkan tidak memiliki output sel saat diperiksa. Hindari commit output yang berisi nama, nomor rekam medis, atau data individual pasien ketika menjalankan ulang.
