package profiles

import (
	"strings"
	"testing"
)

func TestBasicsPhysicalSQLMatchesSchema(t *testing.T) {
	if strings.Contains(basicsPhysicalSQL, "marital_status_id") {
		t.Fatal("physical_attributes has no marital_status_id column")
	}
	if !strings.Contains(basicsPhysicalSQL, "height") || !strings.Contains(basicsPhysicalSQL, "weight") {
		t.Fatal("physical_attributes update must persist height/weight")
	}
}

func TestBasicsMemberSQLWritesMaritalStatus(t *testing.T) {
	if !strings.Contains(basicsMemberSQL, "marital_status_id") {
		t.Fatal("members.marital_status_id must be updated from basics")
	}
}

func TestProfileAuditSQLMatchesSchema(t *testing.T) {
	if strings.Contains(profileAuditSQL, "new_values") {
		t.Fatal("profile_audit_logs column is new_value, not new_values")
	}
	if !strings.Contains(profileAuditSQL, "field_name") {
		t.Fatal("profile_audit_logs.field_name is NOT NULL")
	}
	if !strings.Contains(profileAuditSQL, "new_value") {
		t.Fatal("profile_audit_logs must write new_value")
	}
}
