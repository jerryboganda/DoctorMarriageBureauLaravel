package notifications

import (
	"strings"
	"testing"
	"time"
)

func TestPresentHydratesLaravelDbStorePayload(t *testing.T) {
	created := time.Date(2026, 7, 12, 18, 43, 0, 0, time.UTC)
	n := Present(Notification{
		ID:   "n1",
		Type: `App\Notifications\DbStoreNotification`,
		Data: map[string]interface{}{
			"type":      "express_interest",
			"message":   "Dr Sara sent you a marriage proposal.",
			"route":     "member.express_interests",
			"notify_by": 42,
		},
		CreatedAt: created,
	})

	if n.Title != "Dr Sara sent you a marriage proposal." {
		t.Fatalf("title = %q, want message fallback", n.Title)
	}
	if n.Body != "Dr Sara sent you a marriage proposal." {
		t.Fatalf("body = %q, want message", n.Body)
	}
	if n.Type != "express_interest" {
		t.Fatalf("type = %q, want express_interest not PHP class", n.Type)
	}
	if n.ActionURL != "/proposals/" {
		t.Fatalf("action_url = %q, want /proposals/", n.ActionURL)
	}
	if strings.Contains(n.Title, `App\`) || strings.Contains(n.Type, `App\`) {
		t.Fatalf("leaked PHP class: title=%q type=%q", n.Title, n.Type)
	}
}

func TestPresentPrefersExplicitTitleOverMessage(t *testing.T) {
	n := Present(Notification{
		Type: `App\Notifications\DbStoreNotification`,
		Data: map[string]interface{}{
			"type":    "system",
			"title":   "Profile Picture Update Required",
			"message": "Please upload a clear professional photo.",
			"route":   "member.profile",
		},
	})
	if n.Title != "Profile Picture Update Required" {
		t.Fatalf("title = %q", n.Title)
	}
	if n.Body != "Please upload a clear professional photo." {
		t.Fatalf("body = %q", n.Body)
	}
	if n.ActionURL != "/profile/" {
		t.Fatalf("action_url = %q", n.ActionURL)
	}
}

func TestPresentNeverUsesPHPClassAsTitle(t *testing.T) {
	n := Present(Notification{
		Type:  `App\Notifications\DbStoreNotification`,
		Title: `App\Notifications\DbStoreNotification`,
		Data:  map[string]interface{}{"type": "accepted_interest"},
	})
	if strings.Contains(n.Title, `\`) || strings.Contains(n.Title, "DbStore") {
		t.Fatalf("title still a class name: %q", n.Title)
	}
	if n.Title == "" {
		t.Fatal("title empty")
	}
	if n.Type != "accepted_interest" {
		t.Fatalf("type = %q", n.Type)
	}
}

func TestPresentKeepsNativeGoNotification(t *testing.T) {
	n := Present(Notification{
		Type:  "chat_message",
		Title: "New message",
		Body:  "Assalamualaikum",
		Data:  map[string]interface{}{"action_url": "/messages/"},
	})
	if n.Title != "New message" || n.Body != "Assalamualaikum" || n.Type != "chat_message" {
		t.Fatalf("mutated native notification: %+v", n)
	}
	if n.ActionURL != "/messages/" {
		t.Fatalf("action_url = %q", n.ActionURL)
	}
}
