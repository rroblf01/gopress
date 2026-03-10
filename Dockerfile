FROM golang:1.26.1-alpine3.23 AS builder

WORKDIR /app

COPY go.mod .
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o gopress .

FROM scratch

COPY --from=builder /app/gopress /gopress
COPY --from=builder /app/static /static

EXPOSE 3000

ENTRYPOINT ["/gopress"]
