FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod .
RUN go mod download 2>/dev/null || true
COPY *.go .
RUN go mod tidy && CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /service .

FROM alpine:3.19
RUN apk add --no-cache ca-certificates tzdata
COPY --from=builder /service /service
CMD ["/service"]
