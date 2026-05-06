package websocket

import (
	"log/slog"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // restreindre en production via CORS
	},
}

type Client struct {
	conn   *websocket.Conn
	send   chan []byte
	userID string
}

type Hub struct {
	mu      sync.RWMutex
	clients map[*Client]bool
}

func NewHub() *Hub {
	return &Hub{
		clients: make(map[*Client]bool),
	}
}

func (h *Hub) Register(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.clients[client] = true
}

func (h *Hub) Unregister(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if _, ok := h.clients[client]; ok {
		delete(h.clients, client)
		close(client.send)
	}
}

func (h *Hub) Broadcast(message []byte) {
	// Collecter les clients morts séparément pour éviter de modifier la map sous RLock
	h.mu.RLock()
	dead := make([]*Client, 0)
	for client := range h.clients {
		select {
		case client.send <- message:
		default:
			dead = append(dead, client)
		}
	}
	h.mu.RUnlock()

	if len(dead) > 0 {
		h.mu.Lock()
		for _, client := range dead {
			if _, ok := h.clients[client]; ok {
				close(client.send)
				delete(h.clients, client)
			}
		}
		h.mu.Unlock()
	}
}

func (h *Hub) ServeWS(w http.ResponseWriter, r *http.Request, userID string) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		slog.Error("websocket upgrade failed", "error", err)
		return
	}

	client := &Client{
		conn:   conn,
		send:   make(chan []byte, 256),
		userID: userID,
	}

	h.Register(client)
	go client.writePump(h)
	go client.readPump(h)
}

func (c *Client) writePump(h *Hub) {
	defer func() {
		c.conn.Close()
		h.Unregister(c)
	}()

	for msg := range c.send {
		if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
			return
		}
	}
}

func (c *Client) readPump(h *Hub) {
	defer func() {
		h.Unregister(c)
		c.conn.Close()
	}()

	for {
		_, _, err := c.conn.ReadMessage()
		if err != nil {
			return
		}
	}
}
