FOLDER MODEL — SiPEKA
=====================
Taruh artefak hasil Google Colab (SiPEKA_Modeling.ipynb) di folder ini:

  model.pkl        -> pipeline XGBoost + SMOTE (ImbPipeline)
  imputer.pkl      -> SimpleImputer (median), fit di training
  scaler.pkl       -> MinMaxScaler, fit di training
  features.pkl     -> list 9 fitur (urutan penting)
  metrics.json     -> metrik + final_threshold

Selama file di atas belum ada, aplikasi berjalan MODE DEMO (rule-based:
TD>=130/85 DAN proteinuria positif). Setelah artefak asli ditaruh,
aplikasi otomatis memakai model ML saat di-restart.

Fitur (urутan): TD_Sistolik, TD_Diastolik, MAP, Protein_Uria,
Usia_Tahun, Usia_Kehamilan_Minggu, IMT, LILA_cm, Gula_Darah
