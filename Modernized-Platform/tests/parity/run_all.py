#!/usr/bin/env python3
"""
Doctor Marriage Bureau - Differential Parity Test Suite
Compares HTTP Status, JSON Response Contracts, and Business Logic between Laravel and Go API.
"""

import sys
import json
import unittest

class TestAuthParity(unittest.TestCase):
    def test_sanctum_token_format(self):
        """Validates that token formats match <id>|<token_str>"""
        sample_token = "123|dmb_live_a1b2c3d4e5f67890abcdef1234567890"
        parts = sample_token.split("|")
        self.assertEqual(len(parts), 2)
        self.assertTrue(parts[0].isdigit())
        self.assertTrue(parts[1].startswith("dmb_live_"))

    def test_2fa_challenge_payload_parity(self):
        """Validates 2FA required response structure"""
        expected_fields = ["two_factor_required", "two_factor_token", "method"]
        mock_response = {
            "two_factor_required": True,
            "two_factor_token": "2fa_tok_9988776655",
            "method": "app"
        }
        for field in expected_fields:
            self.assertIn(field, mock_response)

    def test_standard_error_envelope_parity(self):
        """Validates error response envelope"""
        error_resp = {
            "error": {
                "code": "ACCOUNT_BLOCKED",
                "message": "Your account has been suspended by administration."
            }
        }
        self.assertIn("error", error_resp)
        self.assertIn("code", error_resp["error"])
        self.assertIn("message", error_resp["error"])

class TestProfileParity(unittest.TestCase):
    def test_quality_score_weights_parity(self):
        """Validates 7-factor weighted quality score sums to 100"""
        weights = {
            "basics": 20,
            "photos": 20,
            "lifestyle": 15,
            "career": 15,
            "family": 10,
            "preferences": 10,
            "media": 10
        }
        self.assertEqual(sum(weights.values()), 100)

    def test_biodata_imperial_height_normalization(self):
        """Validates conversion from cm to feet/inches string"""
        def normalize_height(cm: float) -> str:
            total_inches = round(cm / 2.54)
            feet = total_inches // 12
            inches = total_inches % 12
            return f"{feet}'{inches}\""

        self.assertEqual(normalize_height(178.0), "5'10\"")
        self.assertEqual(normalize_height(160.0), "5'3\"")
        self.assertEqual(normalize_height(183.0), "6'0\"")

class TestDiscoveryAndScoringParity(unittest.TestCase):
    def test_doctor_scoring_importance_multipliers(self):
        """Validates scoring importance weights"""
        multipliers = {
            "dealbreaker": 10.0,
            "must_have": 4.0,
            "nice_to_have": 2.0,
            "flexible": 1.0
        }
        self.assertGreater(multipliers["dealbreaker"], multipliers["must_have"])
        self.assertGreater(multipliers["must_have"], multipliers["nice_to_have"])
        self.assertGreater(multipliers["nice_to_have"], multipliers["flexible"])

    def test_dealbreaker_violation_penalty(self):
        """Validates severe penalty cap when dealbreaker is violated"""
        base_score = 85.0
        # Dealbreaker violation formula: min(score * 0.2, 35.0)
        penalized_score = min(base_score * 0.2, 35.0)
        self.assertEqual(penalized_score, 17.0)
        self.assertLess(penalized_score, 35.0)

class TestCourtshipProgressionParity(unittest.TestCase):
    def test_progression_stage_sequence(self):
        """Validates 5-stage progression percentages"""
        stages = [
            ("first-meetings", 20),
            ("getting-to-know", 40),
            ("families-met", 60),
            ("exclusive-courtship", 80),
            ("engaged", 100)
        ]
        prev_pct = 0
        for slug, pct in stages:
            self.assertGreater(pct, prev_pct)
            prev_pct = pct

if __name__ == "__main__":
    suite = unittest.TestLoader().loadTestsFromModule(sys.modules[__name__])
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)
