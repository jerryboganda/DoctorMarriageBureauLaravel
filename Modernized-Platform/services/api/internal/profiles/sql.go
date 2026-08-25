package profiles

const basicsMemberSQL = `
	UPDATE members SET
		gender = COALESCE(NULLIF($1, ''), gender),
		birthday = CASE WHEN $2::text IS NOT NULL AND $2::text != '' THEN $2::date ELSE birthday END,
		nationality = COALESCE(NULLIF($3, ''), nationality),
		marriage_timeline = COALESCE(NULLIF($4, ''), marriage_timeline),
		relocation_willingness = COALESCE(NULLIF($5, ''), relocation_willingness),
		seriousness_level = COALESCE(NULLIF($6, ''), seriousness_level),
		known_languages = $7,
		marital_status_id = COALESCE($8, marital_status_id),
		updated_at = $9
	WHERE user_id = $10
`

const basicsPhysicalSQL = `
	INSERT INTO physical_attributes (user_id, height, weight, created_at, updated_at)
	VALUES ($1, $2, $3, $4, $4)
	ON CONFLICT (user_id) DO UPDATE SET
		height = COALESCE(EXCLUDED.height, physical_attributes.height),
		weight = COALESCE(EXCLUDED.weight, physical_attributes.weight),
		updated_at = EXCLUDED.updated_at
`

const profileAuditSQL = `
	INSERT INTO profile_audit_logs (user_id, section, field_name, new_value, changed_at, created_at)
	VALUES ($1, $2, 'section', $3, $4, $4)
`
