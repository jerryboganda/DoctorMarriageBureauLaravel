package notifications

import (
	"fmt"
	"strings"
)

func dataString(data map[string]interface{}, keys ...string) string {
	if data == nil {
		return ""
	}
	for _, key := range keys {
		raw, ok := data[key]
		if !ok || raw == nil {
			continue
		}
		value := strings.TrimSpace(fmt.Sprint(raw))
		if value == "" || value == "<nil>" {
			continue
		}
		return value
	}
	return ""
}

func isPHPClass(value string) bool {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return false
	}
	return strings.Contains(trimmed, `\`) ||
		strings.Contains(trimmed, "App/Notifications") ||
		strings.Contains(trimmed, "DbStoreNotification")
}

func humanizeType(value string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return "system"
	}
	if isPHPClass(trimmed) {
		parts := strings.FieldsFunc(trimmed, func(r rune) bool {
			return r == '\\' || r == '/'
		})
		if len(parts) > 0 {
			trimmed = parts[len(parts)-1]
		}
		if strings.EqualFold(trimmed, "DbStoreNotification") {
			return "system"
		}
	}
	return strings.ToLower(strings.ReplaceAll(strings.TrimSpace(trimmed), " ", "_"))
}

func friendlyTitle(typ string) string {
	switch typ {
	case "express_interest":
		return "New Proposal"
	case "accepted_interest", "interest_accepted":
		return "Proposal Accepted"
	case "rejected_interest", "interest_rejected":
		return "Proposal Declined"
	case "profile_picture_view":
		return "Photo Request"
	case "gallery_image_view":
		return "Gallery Request"
	case "chat_message", "message", "chat":
		return "New Message"
	case "system":
		return "Notification"
	default:
		label := strings.TrimSpace(strings.ReplaceAll(typ, "_", " "))
		if label == "" {
			return "Notification"
		}
		return strings.ToUpper(label[:1]) + label[1:]
	}
}

func dashboardPath(route string) string {
	trimmed := strings.TrimSpace(route)
	if trimmed == "" {
		return ""
	}
	lower := strings.ToLower(trimmed)
	if strings.HasPrefix(lower, "http://") || strings.HasPrefix(lower, "https://") || strings.HasPrefix(trimmed, "/") {
		return trimmed
	}
	switch {
	case strings.Contains(lower, "interest") || strings.Contains(lower, "proposal"):
		return "/proposals/"
	case strings.Contains(lower, "chat") || strings.Contains(lower, "message"):
		return "/messages/"
	case strings.Contains(lower, "wallet"):
		return "/wallet/"
	case strings.Contains(lower, "profile"):
		return "/profile/"
	case strings.Contains(lower, "package"):
		return "/packages/"
	case strings.Contains(lower, "notif"):
		return ""
	default:
		return ""
	}
}

// Present fills human-readable title, body, type, and action URL from Laravel
// or native Go notification payloads. PHP class names are never returned as titles.
func Present(n Notification) Notification {
	message := dataString(n.Data, "message")
	title := strings.TrimSpace(n.Title)
	if title == "" {
		title = dataString(n.Data, "title")
	}
	innerType := humanizeType(dataString(n.Data, "type"))
	if title == "" || isPHPClass(title) {
		if message != "" {
			title = message
		} else {
			title = friendlyTitle(innerType)
		}
	}

	body := strings.TrimSpace(n.Body)
	if body == "" {
		body = dataString(n.Data, "body", "message")
	}

	typ := strings.TrimSpace(n.Type)
	if typ == "" || isPHPClass(typ) {
		if dataString(n.Data, "type") != "" {
			typ = innerType
		} else {
			typ = "system"
		}
	}

	action := strings.TrimSpace(n.ActionURL)
	if action == "" {
		action = dashboardPath(dataString(n.Data, "action_url", "route"))
	}

	n.Title = title
	n.Body = body
	n.Type = typ
	n.ActionURL = action
	return n
}
