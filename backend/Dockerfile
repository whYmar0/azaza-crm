FROM dockerhub.timeweb.cloud/library/alpine:3.19
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
COPY server.linux server
EXPOSE 8080
CMD ["./server"]
