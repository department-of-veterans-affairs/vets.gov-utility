FROM golang:1.9.2
WORKDIR /go/src/github.com/department-of-veterans-affairs/vets.gov-utility/feedbackexport
RUN go get -u github.com/golang/dep/cmd/dep
COPY . .
RUN dep ensure
RUN CGO_ENABLED=0 GOOS=linux go build -a -o feedbackexport .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /bin/
COPY --from=0 /go/src/github.com/department-of-veterans-affairs/vets.gov-utility/feedbackexport/feedbackexport .
WORKDIR /data
CMD ["feedbackexport"]