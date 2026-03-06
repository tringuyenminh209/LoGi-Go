FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod .
COPY *.go .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /service .

FROM alpine:3.19
RUN apk add --no-cache ca-certificates tzdata
COPY --from=builder /service /service
CMD ["/service"]
