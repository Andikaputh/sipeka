"""Kontrak API studi label aturan; data tes sintetis, bukan data pasien."""
import unittest

from app import app, ARTIFACTS, THRESHOLD


class StudyContractTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_model_metrics_source(self):
        self.assertAlmostEqual(THRESHOLD, 0.838)
        self.assertEqual(ARTIFACTS["metrics"]["metrics"]["tp"], 17)
        self.assertEqual(ARTIFACTS["metrics"]["metrics"]["fn"], 2)
        self.assertEqual(ARTIFACTS["metrics"]["metrics"]["fp"], 0)
        self.assertEqual(ARTIFACTS["metrics"]["metrics"]["tn"], 282)

    def test_same_rule_and_model_are_reported_separately(self):
        result = self.client.post("/api/predict", json={
            "TD_Sistolik": 145, "TD_Diastolik": 95, "Protein_Uria": 1,
            "Usia_Tahun": 32, "Usia_Kehamilan_Minggu": 34,
            "IMT": 28.4, "LILA_cm": 24, "Gula_Darah": 0,
        })
        self.assertEqual(result.status_code, 200)
        body = result.json
        self.assertEqual(body["rule_indicator"], 1)
        self.assertIn(body["model_prediction"], (0, 1))
        self.assertTrue(body["clinical_override"])
        self.assertIn("bukan diagnosis", body["research_disclaimer"].lower())
        self.assertNotIn("Tidak Berisiko Tinggi", body["label"])

    def test_missing_protein_not_negative_rule(self):
        result = self.client.post("/api/predict", json={
            "TD_Sistolik": 125, "TD_Diastolik": 80,
        })
        self.assertEqual(result.status_code, 200)
        self.assertIsNone(result.json["rule_indicator"])

    def test_missing_required_pressure_rejected(self):
        self.assertEqual(self.client.post("/api/predict", json={
            "TD_Sistolik": 125,
        }).status_code, 400)

    def test_invalid_inputs_rejected_without_internal_error(self):
        for body in ([], {'TD_Sistolik': 'oops', 'TD_Diastolik': 80},
                     {'TD_Sistolik': 120, 'TD_Diastolik': 80, 'Protein_Uria': 2},
                     {'TD_Sistolik': 80, 'TD_Diastolik': 100}):
            with self.subTest(body=body):
                self.assertEqual(self.client.post('/api/predict', json=body).status_code, 400)

    def test_home_declares_limits(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"bukan diagnosis", response.data)


if __name__ == "__main__":
    unittest.main()
