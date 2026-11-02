FOLDER MODEL — SiPEKA
=====================

Artefak ini dihasilkan oleh prosedur di:
  Penelitian_dan_Model/oof_threshold/run_oof_threshold.py

Isi folder:

  model.pkl     -> CalibratedClassifierCV(ImbPipeline(SMOTE + XGBoost))
  imputer.pkl   -> SimpleImputer(strategy='median'), fit di data latih
  scaler.pkl    -> MinMaxScaler, fit di data latih
  features.pkl  -> list 9 fitur (urutan penting)
  metrics.json  -> metrik + final_threshold

Cara prediksi:
  imputer.transform -> scaler.transform -> predict_proba[:,1] >= final_threshold

Nilai saat ini:
  final_threshold : 0.838
  data uji (301 baris, 19 positif) : TP 17, FN 2, FP 0, TN 282
  precision 100.00 | recall 89.47 | F1 94.44 | AUC 99.91 | AP 98.76

Ambang 0,838 dipilih dari prediksi out-of-fold data latih (5-fold), bukan
dari data uji, lalu dikunci dan dievaluasi sekali. Rentang ambang yang
memberi hasil identik pada data uji: (0,790 ; 0,842].

Versi yang dipakai saat artefak dibuat:
  Python 3.11 | scikit-learn 1.6.1 | XGBoost 3.2.0
  imbalanced-learn 0.13.0 | NumPy 2.2.6 | pandas 2.3.3

Jangan mengubah versi scikit-learn tanpa melatih ulang: CalibratedClassifierCV
sensitif terhadap versi dan hasil prediksi bisa bergeser.

Fitur (urutan penting):
  TD_Sistolik, TD_Diastolik, MAP, Protein_Uria,
  Usia_Tahun, Usia_Kehamilan_Minggu, IMT, LILA_cm, Gula_Darah
