FROM golang:1.9
WORKDIR /go/src/github.com/department-of-veterans-affairs/vets.gov-utility/loadtest-model
RUN go get -u github.com/golang/dep/cmd/dep
COPY . .
RUN dep ensure
RUN CGO_ENABLED=0 GOOS=linux go build -a -o loadtest-model .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /bin/
COPY --from=0 /go/src/github.com/department-of-veterans-affairs/vets.gov-utility/loadtest-model/loadtest-model .
WORKDIR /report
CMD ["loadtest-model"]