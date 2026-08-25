package assets

import (
	"strings"
	"testing"
)

func TestPublicURL(t *testing.T) {
	lookup := func(id int64) (string, bool) {
		if id == 26 {
			return "uploads/all/doctor-26.webp", true
		}
		if id == 112 {
			return "public/uploads/all/doctor-112.jpg", true
		}
		return "", false
	}

	cases := []struct {
		name string
		raw  string
		want string
	}{
		{name: "empty", raw: "", want: ""},
		{name: "spaces", raw: "   ", want: ""},
		{name: "absolute https", raw: "https://cdn.example.com/a.jpg", want: "https://cdn.example.com/a.jpg"},
		{name: "protocol relative", raw: "//cdn.example.com/a.jpg", want: "https://cdn.example.com/a.jpg"},
		{name: "already public path", raw: "/uploads/all/x.webp", want: "/uploads/all/x.webp"},
		{name: "laravel relative path", raw: "uploads/all/x.webp", want: "/uploads/all/x.webp"},
		{name: "public prefix", raw: "public/uploads/all/x.webp", want: "/uploads/all/x.webp"},
		{name: "legacy public url", raw: "https://panel.doctormarriagebureau.com.pk/public/uploads/all/x.webp", want: "/uploads/all/x.webp"},
		{name: "bare filename", raw: "x.webp", want: "/uploads/all/x.webp"},
		{name: "all folder filename", raw: "all/x.webp", want: "/uploads/all/x.webp"},
		{name: "numeric upload id", raw: "26", want: "/uploads/all/doctor-26.webp"},
		{name: "numeric upload id public prefix", raw: "112", want: "/uploads/all/doctor-112.jpg"},
		{name: "unknown numeric id", raw: "9999", want: ""},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := PublicURL(tc.raw, lookup)
			if got != tc.want {
				t.Fatalf("PublicURL(%q) = %q, want %q", tc.raw, got, tc.want)
			}
		})
	}
}

func TestPublicURLWithoutLookupLeavesUnknownIDEmpty(t *testing.T) {
	if got := PublicURL("26", nil); got != "" {
		t.Fatalf("expected empty URL without lookup, got %q", got)
	}
}

func TestPhotoSQLIncludesUploadsLookup(t *testing.T) {
	sql := PhotoSQL("u.photo")
	for _, needle := range []string{"uploads", "file_name", "u.photo", "/uploads/"} {
		if !strings.Contains(sql, needle) {
			t.Fatalf("PhotoSQL missing %q in:\n%s", needle, sql)
		}
	}
}

func TestPhotoSQLWithUserFallbackUsesLatestUpload(t *testing.T) {
	sql := PhotoSQLWithUserFallback("u.photo", "u.id")
	for _, needle := range []string{"u.photo", "u.id", "up.user_id", "ORDER BY up.id DESC"} {
		if !strings.Contains(sql, needle) {
			t.Fatalf("PhotoSQLWithUserFallback missing %q in:\n%s", needle, sql)
		}
	}
}
