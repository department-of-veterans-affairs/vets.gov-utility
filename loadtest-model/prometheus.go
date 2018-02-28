package main

import (
	"errors"
	"fmt"
	"net/url"
	"time"

	"github.com/prometheus/client_golang/api"
	promapi "github.com/prometheus/client_golang/api/prometheus/v1"
	"github.com/prometheus/common/model"
	"golang.org/x/net/context"
)

// Prometheus is an instance of that monitoring system
type Prometheus struct {
	proxyURL      *url.URL
	prometheusURL string
	query         string
}

func (p Prometheus) getPerMinute() ([]RequestCount, error) {

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	client, err := api.NewClient(api.Config{Address: p.prometheusURL})
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
	value, err := q.QueryRange(ctx, fmt.Sprintf("round(sum(rate(%s[1m])) * 60)", p.query), r)

	if err != nil {
		return nil, err
	} else if value == nil {
		return nil, errors.New("No data returned by Prometheus")
	}

	return processRates(value)
}

func processRates(v model.Value) ([]RequestCount, error) {
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

func (p Prometheus) getTotal() (float64, error) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	client, err := api.NewClient(api.Config{Address: p.prometheusURL})
	if err != nil {
		return -1, err
	}

	q := promapi.NewAPI(client)

	value, err := q.Query(ctx, fmt.Sprintf("sum(rate(%s[1d]) * 60*60*24)", p.query), time.Now())

	if err != nil {
		return -1, err
	} else if value == nil {
		return -1, errors.New("No data returned by Prometheus")
	}

	return processTotal(value)
}

func processTotal(v model.Value) (float64, error) {
	switch v.Type() {
	case model.ValVector:
		vector := v.(model.Vector)
		return float64(vector[0].Value), nil
	default:
		return -1, fmt.Errorf("Unexpected data type returned by Prometheus: %v", v.Type())
	}
}
