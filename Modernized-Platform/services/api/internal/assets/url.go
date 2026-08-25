// Package assets normalizes Laravel upload IDs and stored paths into public URLs.
package assets

import (
	"strconv"
	"strings"
)

// Lookup resolves a numeric uploads.id to the stored file_name.
type Lookup func(id int64) (string, bool)

// PublicURL turns a Laravel photo value into a browser-ready path.
// Numeric values are treated as uploads.id and resolved via lookup.
func PublicURL(raw string, lookup Lookup) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return ""
	}
	if id, err := strconv.ParseInt(raw, 10, 64); err == nil && raw == strconv.FormatInt(id, 10) {
		if lookup == nil {
			return ""
		}
		fileName, ok := lookup(id)
		if !ok || strings.TrimSpace(fileName) == "" {
			return ""
		}
		return normalizePath(fileName)
	}
	return normalizePath(raw)
}

func normalizePath(raw string) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return ""
	}
	if strings.HasPrefix(raw, "//") {
		return "https:" + raw
	}
	if strings.HasPrefix(raw, "http://") || strings.HasPrefix(raw, "https://") {
		if i := strings.Index(raw, "/public/uploads/"); i >= 0 {
			return "/uploads/" + strings.TrimPrefix(raw[i+len("/public/uploads/"):], "/")
		}
		return raw
	}

	raw = strings.TrimPrefix(raw, "/")
	raw = strings.TrimPrefix(raw, "public/")
	switch {
	case strings.HasPrefix(raw, "uploads/"):
		return "/" + raw
	case strings.HasPrefix(raw, "all/"):
		return "/uploads/" + raw
	default:
		return "/uploads/all/" + raw
	}
}

// PhotoSQL returns a SQL expression that resolves a stored photo column to a
// public /uploads/... path, including Laravel numeric upload IDs.
func PhotoSQL(column string) string {
	return strings.ReplaceAll(photoSQLTemplate, "{{col}}", column)
}

// PhotoSQLWithUserFallback resolves the photo column, then the user's newest
// upload row. This covers Laravel IDs whose uploads rows were pruned.
func PhotoSQLWithUserFallback(photoCol, userIDCol string) string {
	return "COALESCE(NULLIF(" + PhotoSQL(photoCol) + ", ''), " + latestUploadSQL(userIDCol) + ")"
}

func latestUploadSQL(userIDCol string) string {
	return strings.ReplaceAll(latestUploadSQLTemplate, "{{user}}", userIDCol)
}

const photoSQLTemplate = `CASE
	WHEN COALESCE({{col}}, '') = '' THEN ''
	WHEN {{col}} ~ '^https?://' AND position('/public/uploads/' in {{col}}) > 0
		THEN '/uploads/' || substring({{col}} from position('/public/uploads/' in {{col}}) + 16)
	WHEN {{col}} ~ '^https?://' THEN {{col}}
	WHEN {{col}} ~ '^[0-9]+$' THEN COALESCE((
		SELECT CASE
			WHEN up.file_name ~ '^https?://' AND position('/public/uploads/' in up.file_name) > 0
				THEN '/uploads/' || substring(up.file_name from position('/public/uploads/' in up.file_name) + 16)
			WHEN up.file_name ~ '^https?://' THEN up.file_name
			WHEN up.file_name LIKE '/%' THEN replace(up.file_name, '/public/uploads/', '/uploads/')
			WHEN up.file_name LIKE 'public/uploads/%' THEN '/' || substring(up.file_name from 8)
			WHEN up.file_name LIKE 'uploads/%' THEN '/' || up.file_name
			WHEN up.file_name LIKE 'all/%' THEN '/uploads/' || up.file_name
			ELSE '/uploads/all/' || up.file_name
		END
		FROM uploads up
		WHERE up.id = NULLIF({{col}}, '')::bigint AND up.deleted_at IS NULL
	), '')
	WHEN {{col}} LIKE '/%' THEN replace({{col}}, '/public/uploads/', '/uploads/')
	WHEN {{col}} LIKE 'public/uploads/%' THEN '/' || substring({{col}} from 8)
	WHEN {{col}} LIKE 'uploads/%' THEN '/' || {{col}}
	WHEN {{col}} LIKE 'all/%' THEN '/uploads/' || {{col}}
	ELSE '/uploads/all/' || {{col}}
END`

const latestUploadSQLTemplate = `COALESCE((
	SELECT CASE
		WHEN up.file_name ~ '^https?://' AND position('/public/uploads/' in up.file_name) > 0
			THEN '/uploads/' || substring(up.file_name from position('/public/uploads/' in up.file_name) + 16)
		WHEN up.file_name ~ '^https?://' THEN up.file_name
		WHEN up.file_name LIKE '/%' THEN replace(up.file_name, '/public/uploads/', '/uploads/')
		WHEN up.file_name LIKE 'public/uploads/%' THEN '/' || substring(up.file_name from 8)
		WHEN up.file_name LIKE 'uploads/%' THEN '/' || up.file_name
		WHEN up.file_name LIKE 'all/%' THEN '/uploads/' || up.file_name
		ELSE '/uploads/all/' || up.file_name
	END
	FROM uploads up
	WHERE up.user_id = {{user}} AND up.deleted_at IS NULL
	ORDER BY up.id DESC
	LIMIT 1
), '')`
