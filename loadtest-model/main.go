package main

import (
	"log"
	"os"
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
	getPerMinute() ([]RequestCount, error)
	getTotal() (float64, error)
}

// RequestCount is the number of requests (count) that occured in a given minute (ts).
type RequestCount struct {
	count float64
	ts    time.Time
}

// Reporter outputs a report based on the monitoring data
type Reporter interface {
	report(data []RequestCount, total float64) error
}

func main() {
	c := getConfig()
	monitoring := configureMonitoring(c)
	data, err := monitoring.getPerMinute()
	if err != nil {
		log.Fatalln("Error getting data from monitoring system:", err)
	}

	total, err := monitoring.getTotal()
	if err != nil {
		log.Fatalln("Error getting data from monitoring system:", err)
	}

	reporting := configureReporting(c)
	err = reporting.report(data, total)
	if err != nil {
		log.Fatalln("Error creating output:", err)
	}
}

func getConfig() loadModelConfig {
	return loadModelConfig{
		monitoringURL: os.Getenv("PROM_URL"),
		requestQuery:  os.Getenv("PROM_QUERY"),
		reportFile:    "loadmodel.html",
	}
}

func configureMonitoring(c loadModelConfig) MonitoringSystem {
	return Prometheus{
		prometheusURL: c.monitoringURL,
		query:         c.requestQuery,
	}
}

func configureReporting(c loadModelConfig) Reporter {
	return HTMLReporter{filename: c.reportFile}
}
