package chat

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 64 * 1024 // 64 KB
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins in development/API monolith
	},
}

// InboundFrame represents frames sent by client.
type InboundFrame struct {
	Action  string          `json:"action"`  // "subscribe", "unsubscribe", "typing:start", "typing:stop", "heartbeat"
	Channel string          `json:"channel"` // e.g. "chat.101"
	Payload json.RawMessage `json:"payload,omitempty"`
}

// Client is a middleman between the WebSocket connection and the Hub.
type Client struct {
	Hub    *Hub
	Conn   *websocket.Conn
	UserID int64
	ConnID string
	send   chan []byte
	svc    Service
}

// NewClient creates a new Client instance.
func NewClient(hub *Hub, conn *websocket.Conn, userID int64, svc Service) *Client {
	buf := make([]byte, 8)
	_, _ = rand.Read(buf)
	return &Client{
		Hub:    hub,
		Conn:   conn,
		UserID: userID,
		ConnID: hex.EncodeToString(buf),
		send:   make(chan []byte, 256),
		svc:    svc,
	}
}

// ReadPump pumps messages from the websocket connection to the Hub.
func (c *Client) ReadPump() {
	defer func() {
		c.Hub.unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(maxMessageSize)
	_ = c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error {
		_ = c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		var frame InboundFrame
		if err := json.Unmarshal(message, &frame); err == nil {
			switch frame.Action {
			case "subscribe":
				if frame.Channel != "" {
					c.Hub.Subscribe(c, frame.Channel)
				}
			case "unsubscribe":
				if frame.Channel != "" {
					c.Hub.Unsubscribe(c, frame.Channel)
				}
			case "typing:start":
				if frame.Channel != "" {
					c.Hub.BroadcastToChannel(frame.Channel, "typing:start", c.UserID, map[string]interface{}{
						"user_id":   c.UserID,
						"is_typing": true,
					})
				}
			case "typing:stop":
				if frame.Channel != "" {
					c.Hub.BroadcastToChannel(frame.Channel, "typing:stop", c.UserID, map[string]interface{}{
						"user_id":   c.UserID,
						"is_typing": false,
					})
				}
			case "heartbeat":
				if c.svc != nil {
					_ = c.svc.RecordHeartbeat(c.UserID)
				}
			}
		}
	}
}

// WritePump pumps messages from the Hub to the websocket connection.
func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			_ = c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				_ = c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			_, _ = w.Write(message)

			// Add queued chat messages to the current websocket message
			n := len(c.send)
			for i := 0; i < n; i++ {
				_, _ = w.Write([]byte{'\n'})
				_, _ = w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			_ = c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
