# Penelitian dan model SiPEKA

[Kembali ke halaman utama](../README.md)

Folder ini mengarsipkan dua notebook asli dari bahan Penulisan Ilmiah. Notebook tidak digabung atau dilatih ulang pada penataan ini. Dataset tidak disertakan; hasil eksperimen di repo belum diverifikasi ulang terhadap data sumber.

## Urutan kerja

### 1. Persiapan data

Buka [SiPEKA_Data_Preparation.ipynb](notebooks/SiPEKA_Data_Preparation.ipynb).

- Input: laporan ANC Excel. Notebook menjelaskan empat laporan bulanan; kode upload menerima berkas yang dipilih pengguna. Fallback lokal mencari pola `*Laporan Kunjungan Ibu Hamil*.xlsx` di direktori kerja.
- Proses: deteksi header, ekstraksi variabel, transformasi nilai, pembersihan, serta pemberian label berbasis aturan yang ditetapkan dalam penelitian.
- Output: `Dataset_Primer_Final.csv` dan `Dataset_Primer_Final.xlsx`, relatif ke direktori kerja.
- Dataset dan laporan sumber tidak ditemukan sebagai file terpisah dalam bahan yang diperiksa. Siapkan sendiri data yang akses/penggunaannya telah diizinkan; jangan unggah ke repo publik.

### 2. Modeling

Buka [SiPEKA_Modeling.ipynb](notebooks/SiPEKA_Modeling.ipynb).

- Notebook menggunakan `google.colab.files.upload()` untuk menerima CSV hasil persiapan data. Jalur ini belum menyediakan fallback lokal pada bagian modeling.
- Proses yang ditulis di kode: stratified train/test split, imputasi dan scaling, pembandingan oversampling/algoritma, GridSearchCV, kalibrasi sigmoid, pemilihan threshold, dan evaluasi.
- Output: `features.pkl`, `imputer.pkl`, `scaler.pkl`, `model.pkl`, `metrics.json`, enam PNG, serta `SiPEKA_model.zip`.
- Ada teks ringkasan lama yang menyebut RandomizedSearch, tetapi kode menggunakan **GridSearchCV**. Notebook asli dipertahankan, bukan diam-diam direvisi dalam penataan arsip ini.

### 3. Arsip hasil dan aplikasi

| Hasil | Lokasi repo |
|---|---|
| Artefak yang dimuat aplikasi | [`../model/`](../model/) |
| Metrik dan metadata eksperimen tersimpan | [`../model/metrics.json`](../model/metrics.json) |
| Grafik hasil penelitian tersimpan | [`../reports/figures/`](../reports/figures/) |

Notebook menyimpan output di direktori kerja runtime; tidak otomatis memperbarui kedua lokasi di atas. Jangan mengganti model produksi hanya karena pelatihan selesai: bandingkan hasil, cek kompatibilitas dan privasi, lalu lakukan pembaruan artefak secara eksplisit. Artefak yang ada saat penataan cocok dengan hasil model lokal, tetapi kesamaan file tidak membuktikan notebook saat ini akan meregenerasi byte yang sama.

## Menjalankan notebook

### Google Colab

1. Unggah/buka kedua notebook secara terpisah di Colab.
2. Jalankan persiapan data dengan laporan yang diizinkan; unduh atau simpan CSV hasilnya dari runtime.
3. Pada runtime modeling, pasang dependensi yang dibutuhkan lalu unggah CSV tersebut melalui sel upload.
4. Jalankan sel berurutan. Unduh hasil ZIP dari sel akhir jika eksperimen berhasil.

Sel instalasi bawaan modeling hanya memasang XGBoost dan imbalanced-learn tanpa pin versi. Ini bukan environment pelatihan yang terkunci. Ikuti kebutuhan pustaka pada kode dan simpan versi lingkungan bila mereproduksi eksperimen baru.

### Lingkungan lokal

Dari root repo, dengan environment aktif:

```bash
python -m pip install -r research/requirements.txt
python -m jupyter lab
```

Buka notebook dari `research/notebooks/`. Persiapan data memiliki fallback lokal; **modeling belum siap dijalankan lokal tanpa penyesuaian upload/download Colab**. Penataan ini tidak melakukan perubahan kode tersebut. Jangan menganggap perintah instalasi menjamin notebook akan selesai berjalan: data sumber dan runtime pelatihan asli tidak tersedia untuk verifikasi.

`research/requirements.txt` menambahkan paket visualisasi, Excel, dan Jupyter di atas dependensi aplikasi. Paket tambahan belum dipin ke versi pelatihan asli; tidak disajikan sebagai lockfile atau reproduksi persis.

## Apa yang perlu diaudit sebelum membuat klaim performa?

1. **Label rule-based dan sifat sirkular.** Label dibuat dari fitur yang juga masuk model. Akurasi tinggi dapat menunjukkan keberhasilan mempelajari aturan, bukan penemuan risiko klinis independen.
2. **Pemilihan threshold memakai test set.** Kode menghitung precision-recall curve pada `y_test` lalu memilih threshold di sana dan melaporkan performa pada test set yang sama. Dibutuhkan validasi/holdout terpisah atau prosedur nested yang sesuai untuk estimasi yang tidak bias akibat pemilihan threshold.
3. **Preprocessing di luar fold CV.** Imputer dan scaler di-fit pada seluruh bagian training sebelum cross-validation pada data tersebut. Walau holdout awal tidak ikut fit preprocessing, hasil CV tidak sepenuhnya fold-isolated; preprocessing perlu diaudit di dalam pipeline CV.
4. **Cakupan data dan validasi.** Metadata menyebut satu Puskesmas dan Januari–April 2026. Generalisasi ke periode/tempat lain dan validitas klinis belum dibuktikan oleh pengarsipan ini.
5. **Klaim di notebook bukan verifikasi sumber eksternal.** Referensi, angka latar belakang, ambang, dan klaim validasi yang tertulis di notebook harus diperiksa kembali pada sumber dan pihak terkait sebelum dipakai untuk publikasi/layanan.
6. **Kompatibilitas artefak.** Model pickle membutuhkan paket dan versi yang sesuai. Jangan memuat pickle dari sumber yang tidak dipercaya.

## Privasi sebelum commit hasil baru

- Jangan sertakan laporan ANC, dataset per-pasien, atau data identitas.
- Bersihkan output sel dan metadata/attachment yang memuat informasi sensitif.
- Tinjau gambar dan teks hasil eksperimen sebelum dipublikasikan.
- `.gitignore` memblokir CSV/Excel dan folder data secara default, tetapi pola ignore bukan jaminan keamanan; pemeriksaan manual tetap diperlukan.
- Pada penataan ini, kedua notebook memiliki nol output sel. Gambar yang ditambahkan adalah grafik analisis, bukan tabel identitas pasien; sebagian memuat titik distribusi data tanpa label identitas.
