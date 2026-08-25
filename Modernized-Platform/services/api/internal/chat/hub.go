package chat

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

// WSMessage represents a real-time event frame.
type WSMessage struct {
	Event     string      `json:"event"`      // e.g. "message:new", "typing:start", "typing:stop", "presence:change", "thread:update"
	Channel   string      `json:"channel"`    // e.g. "chat.10", "user.1"
	SenderID  int64       `json:"sender_id,omitempty"`
	Payload   interface{} `json:"payload"`
	Timestamp int64       `json:"timestamp,omitempty"`
}

// redisPubSubEnvelope wraps a WSMessage for cross-instance Redis delivery.
type redisPubSubEnvelope struct {
	Instance string    `json:"instance"`
	Msg      *WSMessage `json:"msg"`
}

// Hub maintains the set of active WebSocket clients and broadcasts messages to channels.
// When a Redis client is attached, broadcast messages are also fanned out across API
// instances via Redis pub/sub; presence is tracked in Redis so it survives instance restarts.
// Without Redis the hub degrades gracefully to in-process delivery (single instance).
type Hub struct {
	mu          sync.RWMutex
	clients     map[*Client]bool
	channels    map[string]map[*Client]bool // [channelName][Client]
	userClients map[int64]map[*Client]bool  // [userID][Client]
	register    chan *Client
	unregister  chan *Client
	broadcast   chan *WSMessage

	redis      *redis.Client
	ctx        context.Context
	instanceID string
}

// NewHub creates a new WebSocket Hub.
func NewHub() *Hub {
	return &Hub{
		clients:     make(map[*Client]bool),
		channels:    make(map[string]map[*Client]bool),
		userClients: make(map[int64]map[*Client]bool),
		register:    make(chan *Client),
		unregister:  make(chan *Client),
		broadcast:   make(chan *WSMessage, 1024),
		ctx:         context.Background(),
		instanceID:  generateInstanceID(),
	}
}

// SetRedis attaches a Redis client for cross-instance fan-out and presence.
func (h *Hub) SetRedis(rdb *redis.Client) {
	if rdb == nil {
		return
	}
	h.redis = rdb
	go h.redisSubscriber()
}

func (h *Hub) redisSubscriber() {
	if h.redis == nil {
		return
	}
	pubsub := h.redis.PSubscribe(h.ctx, "dmb:ws:*")
	defer pubsub.Close()
	ch := pubsub.Channel()
	for msg := range ch {
		var env redisPubSubEnvelope
		if err := json.Unmarshal([]byte(msg.Payload), &env); err != nil {
			continue
		}
		if env.Instance == h.instanceID {
			// Originated from this instance; local subscribers already got it.
			continue
		}
		if env.Msg == nil {
			continue
		}
		h.deliverLocally(env.Msg)
	}
}

func (h *Hub) publishRedis(channel string, msg *WSMessage) {
	if h.redis == nil {
		return
	}
	env := redisPubSubEnvelope{Instance: h.instanceID, Msg: msg}
	b, err := json.Marshal(env)
	if err != nil {
		return
	}
	_ = h.redis.Publish(h.ctx, "dmb:ws:"+channel, string(b)).Err()
}

// MarkPresence records a connection in Redis-backed presence (TTL refreshed by heartbeat).
func (h *Hub) MarkPresence(userID int64, connID string) {
	if h.redis == nil {
		return
	}
	key := fmt.Sprintf("dmb:presence:user:%d", userID)
	member := h.instanceID + ":" + connID
	ctx, cancel := context.WithTimeout(h.ctx, 2*time.Second)
	defer cancel()
	_ = h.redis.SAdd(ctx, key, member)
	_ = h.redis.Expire(ctx, key, 90*time.Second)
}

// ClearPresence removes a connection from Redis-backed presence.
func (h *Hub) ClearPresence(userID int64, connID string) {
	if h.redis == nil {
		return
	}
	key := fmt.Sprintf("dmb:presence:user:%d", userID)
	member := h.instanceID + ":" + connID
	ctx, cancel := context.WithTimeout(h.ctx, 2*time.Second)
	defer cancel()
	_ = h.redis.SRem(ctx, key, member)
}

// IsOnlineRedis reports whether any connection for the user is present in Redis.
func (h *Hub) IsOnlineRedis(userID int64) bool {
	if h.redis == nil {
		return false
	}
	key := fmt.Sprintf("dmb:presence:user:%d", userID)
	ctx, cancel := context.WithTimeout(h.ctx, 2*time.Second)
	defer cancel()
	n, err := h.redis.SCard(ctx, key).Result()
	return err == nil && n > 0
}

// Run starts the event loop for the Hub.
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			if client.UserID > 0 {
				if h.userClients[client.UserID] == nil {
					h.userClients[client.UserID] = make(map[*Client]bool)
				}
				h.userClients[client.UserID][client] = true
				// Auto-subscribe user to their private channel "user.{userId}"
				userChan := fmt.Sprintf("user.%d", client.UserID)
				if h.channels[userChan] == nil {
					h.channels[userChan] = make(map[*Client]bool)
				}
				h.channels[userChan][client] = true
			}
			h.MarkPresence(client.UserID, client.ConnID)
			h.mu.Unlock()

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)

				if client.UserID > 0 && h.userClients[client.UserID] != nil {
					delete(h.userClients[client.UserID], client)
					if len(h.userClients[client.UserID]) == 0 {
						delete(h.userClients, client.UserID)
					}
				}

				for chName, clientMap := range h.channels {
					delete(clientMap, client)
					if len(clientMap) == 0 {
						delete(h.channels, chName)
					}
				}
				h.ClearPresence(client.UserID, client.ConnID)
			}
			h.mu.Unlock()

		case msg := <-h.broadcast:
			h.deliverLocally(msg)
		}
	}
}

// deliverLocally pushes a message to this instance's subscribers of the channel.
func (h *Hub) deliverLocally(msg *WSMessage) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	if clients, ok := h.channels[msg.Channel]; ok {
		if msgBytes, err := json.Marshal(msg); err == nil {
			for client := range clients {
				select {
				case client.send <- msgBytes:
				default:
					// buffer full, skip
				}
			}
		}
	}
}

// Subscribe subscribes a client to a channel (e.g. "chat.101").
func (h *Hub) Subscribe(client *Client, channel string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.channels[channel] == nil {
		h.channels[channel] = make(map[*Client]bool)
	}
	h.channels[channel][client] = true
}

// Unsubscribe removes a client from a channel.
func (h *Hub) Unsubscribe(client *Client, channel string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if clientMap, ok := h.channels[channel]; ok {
		delete(clientMap, client)
		if len(clientMap) == 0 {
			delete(h.channels, channel)
		}
	}
}

// BroadcastToChannel sends a message to all subscribers of a channel. It delivers
// locally and fans out to other API instances via Redis pub/sub when configured.
func (h *Hub) BroadcastToChannel(channel string, event string, senderID int64, payload interface{}) {
	msg := &WSMessage{
		Event:    event,
		Channel:  channel,
		SenderID: senderID,
		Payload:  payload,
	}
	h.deliverLocally(msg)
	h.publishRedis(channel, msg)
}

// BroadcastToUser sends a message directly to a user's active connections.
func (h *Hub) BroadcastToUser(userID int64, event string, payload interface{}) {
	channel := fmt.Sprintf("user.%d", userID)
	h.BroadcastToChannel(channel, event, 0, payload)
}

// GetChannelSubscribersCount returns number of subscribers to a channel.
func (h *Hub) GetChannelSubscribersCount(channel string) int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.channels[channel])
}

// IsUserConnected reports whether the user has at least one active socket.
func (h *Hub) IsUserConnected(userID int64) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.userClients[userID]) > 0
}

// generateInstanceID returns a short random identifier for this API instance.
func generateInstanceID() string {
	buf := make([]byte, 8)
	_, _ = rand.Read(buf)
	return hex.EncodeToString(buf)
}
