package main

import (
	"io"
	"log"
	"os"
	"time"
)

type loadModelConfig struct {
	monitoringURL string
	requestQuery  string
	reportOutput  io.Writer
	viewID        string
	metric        string
}

// MonitoringSystem provides timeseries data on requests per minute.
type RequestMonitoring interface {
	getPerMinute() ([]RequestCount, error)
	getTotal() (float64, error)
}

// RequestCount is the number of requests (count) that occured in a given minute (ts).
type RequestCount struct {
	count float64
	ts    time.Time
}

type GrowthMonitoring interface {
	getWeeklyGrowth() (float64, error)
	getMonthlyGrowth() (float64, error)
	getYearlyGrowth() (float64, error)
}

// Reporter outputs a report based on the monitoring data
type Reporter interface {
	report(req RequestMonitoring, grow GrowthMonitoring) error
}

func main() {
	f, err := os.Create("report.html")
	if err != nil {
		return err
	}
	defer f.Close()

	c := getConfig(f)
	requests := configureMonitoring(c)
	growth := configureGrowth(c)

	reporting := configureReporting(c)
	err = reporting.report(requests, growth)
	if err != nil {
		log.Fatalln("Error creating output:", err)
	}
}

func getConfig(w io.Writer) loadModelConfig {
	return loadModelConfig{
		monitoringURL: os.Getenv("PROM_URL"),
		requestQuery:  os.Getenv("PROM_QUERY"),
		reportOutput:  w,
		viewID:        "111433053",
		metric:        "users",
	}
}

func configureMonitoring(c loadModelConfig) RequestMonitoring {
	return Prometheus{
		prometheusURL: c.monitoringURL,
		query:         c.requestQuery,
	}
}

func configureGrowth(c loadModelConfig) GrowthMonitoring {
	return GoogleAnalytics{
		ViewID: c.viewID,
		Metric: c.metric,
	}
}

func configureReporting(c loadModelConfig) Reporter {
	return HTMLReporter{w: c.reportOutput}
}
