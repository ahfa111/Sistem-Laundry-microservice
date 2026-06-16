FROM golang:1.22-alpine

WORKDIR /app

COPY go.mod ./
RUN go mod download || true

COPY . .
RUN go mod tidy

RUN go build -o main .

EXPOSE 5000

CMD ["./main"]
