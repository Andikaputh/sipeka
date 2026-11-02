# Penelitian dan model SiPEKA

[Kembali ke halaman utama](../README.md)

Folder ini mengarsipkan notebook asli dari bahan Penulisan Ilmiah, ditambah satu versi modeling yang ditata ulang mengikuti alur CRISP-DM. Dataset tidak disertakan. **Notebook lama tidak menghasilkan bundle aktif**: `model/` sekarang berasal dari eksperimen OOF terpisah yang direproduksi pada CSV asli di luar repo. Angka hasil hanya mengukur kecocokan terhadap label penelitian yang dibuat dari TD/proteinuria, bukan diagnosis klinis.

> Audit metodologi: pemilihan ambang di notebook lama memakai `y_test` (lihat catatan di bawah). Bundle aktif memilih 0,838 dari prediksi OOF data latih, tetapi imputer/scaler di-fit sebelum CV sehingga validasi antarfold belum sepenuhnya terisolasi. Gambar lama `reports/figures/05_evaluasi.png` menggambarkan run 0,627 dan **tidak boleh dipakai sebagai gambar hasil aktif**.

| Berkas | Status |
|---|---|
| [`notebooks/SiPEKA_Data_Preparation.ipynb`](notebooks/SiPEKA_Data_Preparation.ipynb) | asli, tidak diubah |
| [`notebooks/SiPEKA_Modeling.ipynb`](notebooks/SiPEKA_Modeling.ipynb) | asli, tidak diubah (arsip) |
| [`notebooks/SiPEKA_Modeling_CRISPDM.ipynb`](notebooks/SiPEKA_Modeling_CRISPDM.ipynb) | versi modeling yang ditata ulang |

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

### 2b. Modeling — versi CRISP-DM (tatanan baru)

Buka [SiPEKA_Modeling_CRISPDM.ipynb](notebooks/SiPEKA_Modeling_CRISPDM.ipynb).

- Notebook ini adalah **penataan ulang, bukan eksperimen baru**. Model, hyperparameter, split, urutan evaluasi, dan threshold tidak diubah.
- Satu sel = satu langkah. Sel besar dipecah (EDA 6 panel, tabel 3.2/3.3, GridSearch, gambar evaluasi, `metrics.json`) dan setiap fase punya heading bernomor.
- Perbaikan teknis: `from google.colab import files` dibungkus `try/except` sehingga bisa jalan lokal; seed terpusat di `SEED`/`RANDOM_STATE`; lokasi artefak terpusat di `OUT`; `boxplot(labels=...)` diganti `tick_labels` dengan fallback matplotlib lama; teks ringkasan "RandomizedSearch" diperbaiki menjadi GridSearchCV; ada sel *smoke test* yang memuat ulang `model.pkl` dan menjalankan satu prediksi.
- `metrics.json` dari notebook ini menambah kunci `random_state` dan `grid_search`; kunci lama yang dibaca aplikasi tidak berubah.
- Perbedaan angka dengan notebook asli (bila ada) berarti selisi versi pustaka atau data, bukan perubahan metodologi. Bandingkan sebelum memakai hasilnya.


### 3. Arsip hasil dan aplikasi

| Hasil | Lokasi repo |
|---|---|
| Artefak yang dimuat aplikasi | [`../model/`](../model/) |
| Metrik dan metadata eksperimen tersimpan | [`../model/metrics.json`](../model/metrics.json) |
| Grafik hasil penelitian tersimpan | [`../reports/figures/`](../reports/figures/) |

Notebook menyimpan output di direktori kerja runtime; tidak otomatis memperbarui kedua lokasi di atas. Jangan mengganti model produksi hanya karena pelatihan selesai: bandingkan hasil, cek kompatibilitas dan privasi, lalu lakukan pembaruan artefak secara eksplisit. Artefak yang ada saat penataan cocok dengan hasil model lokal, tetapi kesamaan file tidak membuktikan notebook saat ini akan meregenerasi byte yang sama.

## Menjalankan notebook

### Google Colab

1. Unggah/buka notebook yang dipakai secara terpisah di Colab (persiapan data, lalu modeling).
2. Jalankan persiapan data dengan laporan yang diizinkan; unduh atau simpan CSV hasilnya dari runtime.
3. Pada runtime modeling, pasang dependensi yang dibutuhkan lalu unggah CSV tersebut melalui sel upload.
4. Jalankan sel berurutan. Unduh hasil ZIP dari sel akhir jika eksperimen berhasil.

`SiPEKA_Modeling.ipynb` memasang XGBoost dan imbalanced-learn tanpa pin versi. `SiPEKA_Modeling_CRISPDM.ipynb` memakai sel pemasangan terjaga yang hanya berjalan bila paket belum ada, dan memakai batas versi kasar (`xgboost>=3.0,<4`, `imbalanced-learn>=0.13,<0.14`). Keduanya belum menjadi environment pelatihan yang terkunci; simpan versi lingkungan bila mereproduksi eksperimen baru.

### Lingkungan lokal

Dari root repo, dengan environment aktif:

```bash
python -m pip install -r research/requirements.txt
python -m jupyter lab
```

Buka notebook dari `research/notebooks/`. Persiapan data dan `SiPEKA_Modeling_CRISPDM.ipynb` punya fallback lokal (membaca `Dataset_Primer_Final.csv` dari direktori kerja, menulis artefak ke direktori kerja). **`SiPEKA_Modeling.ipynb` yang asli belum siap dijalankan lokal tanpa penyesuaian upload/download Colab** dan sengaja tidak diubah. Jangan menganggap perintah instalasi menjamin notebook akan selesai berjalan: data sumber dan runtime pelatihan asli tidak tersedia untuk verifikasi.

Smoke test versi CRISPDM sudah dilakukan dengan CSV sintetis berskema sama (bukan data penelitian): 52 sel code berjalan tanpa error dan seluruh artefak serta enam PNG terbentuk. Itu menguji struktur dan urutan sel, bukan angka penelitian.

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
- Pada penataan ini, ketiga notebook memiliki nol output sel. Gambar yang ditambahkan adalah grafik analisis, bukan tabel identitas pasien; sebagian memuat titik distribusi data tanpa label identitas.
