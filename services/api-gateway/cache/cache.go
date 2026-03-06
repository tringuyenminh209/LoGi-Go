package cache

import (
	"context"
	"os"

	"github.com/redis/go-redis/v9"
)

var Client *redis.Client

func Init(ctx context.Context) error {
	addr := os.Getenv("REDIS_ADDR")
	if addr == "" {
		addr = "localhost:6379"
	}
	Client = redis.NewClient(&redis.Options{Addr: addr})
	return Client.Ping(ctx).Err()
}
