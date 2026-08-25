package profiles

import (
	"context"
	"strings"
)

// ProfileOption is one admin-configurable dropdown value.
type ProfileOption struct {
	ID        int64  `json:"id"`
	Group     string `json:"group"`
	Value     string `json:"value"`
	Label     string `json:"label"`
	SortOrder int    `json:"sort_order"`
}

var allowedProfileOptionGroups = map[string]struct{}{
	"gender":                  {},
	"marriage_timeline":       {},
	"relocation_willingness":  {},
	"seriousness_level":       {},
	"diet":                    {},
	"drink":                   {},
	"smoke":                   {},
	"property":                {},
	"living_with":             {},
	"sleep_schedule":          {},
	"work_location_type":      {},
	"family_type":             {},
	"immigration_status":      {},
	"personality_tags":        {},
	"personal_values":         {},
	"community_values":        {},
}

// NormalizeOptionGroup maps URL slugs to profile_option_values.group keys.
func NormalizeOptionGroup(raw string) string {
	return strings.ReplaceAll(strings.ToLower(strings.TrimSpace(raw)), "-", "_")
}

// AllowedProfileOptionGroup reports whether a group is a known admin option list.
func AllowedProfileOptionGroup(group string) bool {
	_, ok := allowedProfileOptionGroups[NormalizeOptionGroup(group)]
	return ok
}

// GroupProfileOptions buckets option rows by group, preserving input order.
func GroupProfileOptions(items []ProfileOption) map[string][]ProfileOption {
	out := make(map[string][]ProfileOption, len(allowedProfileOptionGroups))
	for _, item := range items {
		key := NormalizeOptionGroup(item.Group)
		if key == "" {
			continue
		}
		item.Group = key
		out[key] = append(out[key], item)
	}
	return out
}

// ListProfileOptions returns active options for one group.
func (s *Service) ListProfileOptions(ctx context.Context, group string) ([]ProfileOption, error) {
	group = NormalizeOptionGroup(group)
	if !AllowedProfileOptionGroup(group) {
		return []ProfileOption{}, nil
	}
	rows, err := s.pg.Pool.Query(ctx, `
		SELECT id, "group", value, label, sort_order
		FROM profile_option_values
		WHERE "group" = $1 AND is_active = TRUE
		ORDER BY sort_order, id
	`, group)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []ProfileOption{}
	for rows.Next() {
		var item ProfileOption
		if err := rows.Scan(&item.ID, &item.Group, &item.Value, &item.Label, &item.SortOrder); err != nil {
			return nil, err
		}
		out = append(out, item)
	}
	return out, rows.Err()
}

// ListAllProfileOptions returns every active option grouped by admin group.
func (s *Service) ListAllProfileOptions(ctx context.Context) (map[string][]ProfileOption, error) {
	rows, err := s.pg.Pool.Query(ctx, `
		SELECT id, "group", value, label, sort_order
		FROM profile_option_values
		WHERE is_active = TRUE
		ORDER BY "group", sort_order, id
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []ProfileOption{}
	for rows.Next() {
		var item ProfileOption
		if err := rows.Scan(&item.ID, &item.Group, &item.Value, &item.Label, &item.SortOrder); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return GroupProfileOptions(items), nil
}
