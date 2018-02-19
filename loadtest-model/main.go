package main

import (
	"log"
	"net/url"
	"time"
)

type loadModelConfig struct {
	proxy         string
	monitoringURL string
	requestQuery  string
	reportFile    string
}

// MonitoringSystem provides timeseries data on requests per minute.
type MonitoringSystem interface {
	getData() ([]RequestCount, error)
}

// RequestCount is the number of requests (count) that occured in a given minute (ts).
type RequestCount struct {
	count float64
	ts    time.Time
}

// Reporter outputs a report based on the monitoring data
type Reporter interface {
	report(data []RequestCount) error
}

func main() {
	c := getConfig()
	monitoring := configureMonitoring(c)
	data, err := monitoring.getData()
	if err != nil {
		log.Fatalln("Error getting data from monitoring system:", err)
	}

	reporting := configureReporting(c)
	err = reporting.report(data)
	if err != nil {
		log.Fatalln("Error creating output:", err)
	}
}

func getConfig() loadModelConfig {
	return loadModelConfig{
		proxy:         "socks5://localhost:2001",
		monitoringURL: "http://prometheus-prod.vetsgov-internal:9090/prometheus/",
		requestQuery:  "round(sum(rate(api_rack_request[1m])) * 60)", //sum(rate(api_rack_request[6h]) * 60) by (controller)
		reportFile:    "loadmodel.html",
	}
}

func configureMonitoring(c loadModelConfig) MonitoringSystem {
	p, err := url.Parse(c.proxy)
	if err != nil {
		log.Fatalln("Error setting up proxy:", err)
	}
	return Prometheus{
		proxyURL:      p,
		prometheusURL: c.monitoringURL,
		query:         c.requestQuery,
	}
}

func configureReporting(c loadModelConfig) Reporter {
	return HTMLReporter{filename: c.reportFile}
}
