package middleware

import (
	"fmt"
	"net"
	"net/http"
	"sync"
	"time"
)

// bucket implements a simple token bucket rate limiter.
type bucket struct {
	tokens     float64
	maxTokens  float64
	refillRate float64 // tokens per second
	lastRefill time.Time
	mu         sync.Mutex
}

func newBucket(maxTokens float64, refillRate float64) *bucket {
	return &bucket{
		tokens:     maxTokens,
		maxTokens:  maxTokens,
		refillRate: refillRate,
		lastRefill: time.Now(),
	}
}

// allow consumes one token and returns true, or returns false if empty.
func (b *bucket) allow() bool {
	b.mu.Lock()
	defer b.mu.Unlock()

	now := time.Now()
	elapsed := now.Sub(b.lastRefill).Seconds()
	b.tokens += elapsed * b.refillRate
	if b.tokens > b.maxTokens {
		b.tokens = b.maxTokens
	}
	b.lastRefill = now

	if b.tokens < 1 {
		return false
	}
	b.tokens--
	return true
}

// retryAfter returns seconds until at least 1 token is available.
func (b *bucket) retryAfter() int {
	b.mu.Lock()
	defer b.mu.Unlock()
	if b.tokens >= 1 {
		return 0
	}
	need := 1.0 - b.tokens
	secs := need / b.refillRate
	return int(secs) + 1
}

var (
	buckets sync.Map // key (string) -> *bucket
)

func init() {
	// Periodic cleanup of stale buckets every 5 minutes.
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			cutoff := time.Now().Add(-10 * time.Minute)
			buckets.Range(func(key, value any) bool {
				b := value.(*bucket)
				b.mu.Lock()
				stale := b.lastRefill.Before(cutoff)
				b.mu.Unlock()
				if stale {
					buckets.Delete(key)
				}
				return true
			})
		}
	}()
}

func getOrCreateBucket(key string, maxTokens, refillRate float64) *bucket {
	if v, ok := buckets.Load(key); ok {
		return v.(*bucket)
	}
	b := newBucket(maxTokens, refillRate)
	actual, _ := buckets.LoadOrStore(key, b)
	return actual.(*bucket)
}

func clientIP(r *http.Request) string {
	// Check X-Forwarded-For first (first entry)
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		// Take first IP
		for i := 0; i < len(xff); i++ {
			if xff[i] == ',' {
				return xff[:i]
			}
		}
		return xff
	}
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return xri
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

// RateLimit returns middleware that applies token-bucket rate limiting.
// Authenticated requests (with driver_id in context) get 100 req/min.
// Unauthenticated requests are limited to 20 req/min per IP.
func RateLimit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var key string
		var maxTokens, refillRate float64

		driverID := DriverID(r)
		if driverID != "" {
			// Authenticated: 100 requests per minute
			key = "auth:" + driverID
			maxTokens = 100
			refillRate = 100.0 / 60.0
		} else {
			// Unauthenticated: 20 requests per minute per IP
			key = "ip:" + clientIP(r)
			maxTokens = 20
			refillRate = 20.0 / 60.0
		}

		b := getOrCreateBucket(key, maxTokens, refillRate)
		if !b.allow() {
			retry := b.retryAfter()
			w.Header().Set("Retry-After", fmt.Sprintf("%d", retry))
			http.Error(w, `{"code":"429","message":"too many requests"}`, http.StatusTooManyRequests)
			return
		}

		next.ServeHTTP(w, r)
	})
}
