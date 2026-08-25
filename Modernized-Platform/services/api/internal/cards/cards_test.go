package cards

import "testing"

func TestNormalizeGender(t *testing.T) {
	cases := map[string]string{
		"":         "",
		" ":        "",
		"male":     "male",
		"Male":     "male",
		"M":        "male",
		"1":        "male",
		"female":   "female",
		"Female":   "female",
		"F":        "female",
		"2":        "female",
		"unknown":  "",
	}
	for in, want := range cases {
		if got := NormalizeGender(in); got != want {
			t.Fatalf("NormalizeGender(%q)=%q want %q", in, got, want)
		}
	}
}

func TestOppositeGenderLegacyCodes(t *testing.T) {
	if got := OppositeGender("1"); got != "female" {
		t.Fatalf("OppositeGender(1)=%q want female", got)
	}
	if got := OppositeGender("2"); got != "male" {
		t.Fatalf("OppositeGender(2)=%q want male", got)
	}
	if got := OppositeGender("male"); got != "female" {
		t.Fatalf("OppositeGender(male)=%q want female", got)
	}
}

func TestGenderEqualsSQLUsesCanonicalForm(t *testing.T) {
	sql := GenderEqualsSQL("m.gender", "$2")
	if sql == "" || !containsAll(sql, "male", "female", "1", "2") {
		t.Fatalf("GenderEqualsSQL missing legacy aliases: %s", sql)
	}
}

func TestGenderCanonicalSQLMapsLegacyCodes(t *testing.T) {
	sql := GenderCanonicalSQL("m.gender")
	if !containsAll(sql, "'male'", "'female'", "'1'", "'2'") {
		t.Fatalf("GenderCanonicalSQL missing aliases: %s", sql)
	}
}

func containsAll(s string, parts ...string) bool {
	for _, p := range parts {
		if !contains(s, p) {
			return false
		}
	}
	return true
}

func contains(s, sub string) bool {
	return len(s) >= len(sub) && (s == sub || len(sub) == 0 || indexOf(s, sub) >= 0)
}

func indexOf(s, sub string) int {
	for i := 0; i+len(sub) <= len(s); i++ {
		if s[i:i+len(sub)] == sub {
			return i
		}
	}
	return -1
}
