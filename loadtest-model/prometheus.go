package main

import (
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/prometheus/client_golang/api"
	promapi "github.com/prometheus/client_golang/api/prometheus/v1"
	"github.com/prometheus/common/model"
	"golang.org/x/net/context"
)

// Prometheus is an instance of that monitoring system
type Prometheus struct {
	proxyURL      *url.URL //url.Parse("socks5://localhost:2001")
	prometheusURL string   // "http://prometheus-prod.vetsgov-internal:9090/prometheus/"
	query         string   //
}

func (p Prometheus) getData() ([]RequestCount, error) {

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	config := api.Config{Address: p.prometheusURL}
	if p.proxyURL != nil {
		// Only needed locally can remove for Jenkins
		tr := &http.Transport{
			Proxy: http.ProxyURL(p.proxyURL),
		}
		config.RoundTripper = tr
	}

	client, err := api.NewClient(config)
	if err != nil {
		return nil, err
	}

	q := promapi.NewAPI(client)

	step, err := time.ParseDuration("1m")
	if err != nil {
		return nil, err
	}

	r := promapi.Range{
		//Take past week of data
		Start: time.Now().AddDate(0, 0, -7),
		End:   time.Now().AddDate(0, 0, -1),
		Step:  step,
	}
	value, err := q.QueryRange(ctx, p.query, r)

	if err != nil {
		return nil, err
	} else if value == nil {
		return nil, fmt.Errorf("No data returned by Prometheus")
	}

	return processValue(value)
}

func processValue(v model.Value) ([]RequestCount, error) {
	switch v.Type() {
	case model.ValMatrix:
		matrix := v.(model.Matrix)
		var data []RequestCount

		for _, elem := range matrix {
			for _, sample := range elem.Values {
				data = append(data, RequestCount{float64(sample.Value), sample.Timestamp.Time()})
			}
		}
		return data, nil
	default:
		return nil, fmt.Errorf("Unexpected data type returned by Prometheus: %v", v.Type())
	}
}
