package discovery

import "testing"

func TestLastPageMath(t *testing.T) {
	cases := []struct {
		total, limit, want int64
	}{
		{0, 12, 1},
		{12, 12, 1},
		{13, 12, 2},
		{48, 12, 4},
		{1, 12, 1},
	}
	for _, tc := range cases {
		got := int64(1)
		if tc.total > 0 {
			got = (tc.total + tc.limit - 1) / tc.limit
		}
		if got != tc.want {
			t.Fatalf("total=%d limit=%d got %d want %d", tc.total, tc.limit, got, tc.want)
		}
	}
}
