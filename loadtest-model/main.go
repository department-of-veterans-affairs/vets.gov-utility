package main

import (
	"fmt"
	"log"
	"net/http"
	"net/url"
	"time"

	"github.com/prometheus/client_golang/api/prometheus"
	"github.com/prometheus/common/model"
	"golang.org/x/net/context"

	"github.com/gonum/plot"
	"github.com/gonum/plot/plotter"
	"github.com/gonum/plot/vg"
	"gonum.org/v1/gonum/stat"
)

//round(sum(rate(api_rack_request[1m])) * 60)
func main() {
	data, labels, err := getData("round(sum(rate(api_rack_request[1m])) * 60)")
	if err != nil {
		log.Fatalln("Error getting data from monitoring system:", err)
	}
	for i, d := range data {
		fmt.Println(labels[i], d)
	}

	err = plotHistogram(data)
	if err != nil {
		log.Fatalln("Error plotting histrogram:", err)
	}
}

func getData(query string) ([]float64, []string, error) {

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	proxyURL, err := url.Parse("socks5://localhost:2001")
	if err != nil {
		return nil, nil, err
	}

	// Only needed locally can remove for Jenkins
	tr := &http.Transport{
		Proxy: http.ProxyURL(proxyURL),
	}

	client, err := prometheus.New(prometheus.Config{"http://prometheus-prod.vetsgov-internal:9090/prometheus/", tr})
	if err != nil {
		return nil, nil, err
	}

	q := prometheus.NewQueryAPI(client)

	step, err := time.ParseDuration("1m")
	if err != nil {
		return nil, nil, err
	}

	// TODO: Make this eastern business hours only
	r := prometheus.Range{
		//Take past week of data
		Start: time.Now().AddDate(0, 0, -7),
		End:   time.Now().AddDate(0, 0, -1),
		Step:  step,
	}
	//sum(rate(api_rack_request[6h]) * 60) by (controller)
	value, err := q.QueryRange(ctx, query, r)

	//value, err := q.Query(ctx, query, time.Now())
	if err != nil {
		return nil, nil, err
	} else if value == nil {
		return nil, nil, fmt.Errorf("No data returned by Prometheus")
	}

	return processValue(value)
}

func processValue(v model.Value) ([]float64, []string, error) {
	switch v.Type() {
	case model.ValScalar:
		scalar := v.(*model.Scalar)
		return []float64{float64(scalar.Value)}, []string{"None"}, nil
	case model.ValVector:
		vector := v.(model.Vector)
		data := make([]float64, vector.Len())
		labels := make([]string, vector.Len())

		for i, elem := range vector {
			data[i] = float64(elem.Value)
			labels[i] = elem.Metric.String()
		}
		return data, labels, nil
	case model.ValMatrix:
		matrix := v.(model.Matrix)
		var (
			data   []float64
			labels []string
		)

		for _, elem := range matrix {
			for _, sample := range elem.Values {
				// Only keep samples for eastern business hours
				bh, err := isBusinessHours(sample.Timestamp.Time())
				if err != nil {
					return nil, nil, err
				}

				if bh {
					data = append(data, float64(sample.Value))
					labels = append(labels, elem.Metric.String()+sample.Timestamp.Time().String())
				}
			}
		}

		return data, labels, nil
	default:
		return nil, nil, fmt.Errorf("Unexpected data type returned by Prometheus: %v", v.Type())
	}
}

// Checks if time t is Monday-Friday from 8:00 am to 6:59pm Eastern Time (as defined by New York)
func isBusinessHours(t time.Time) (bool, error) {
	loc, err := time.LoadLocation("America/New_York")
	if err != nil {
		return false, err
	}
	eastern := t.In(loc)
	return (eastern.Weekday() >= time.Monday && eastern.Weekday() <= time.Friday && eastern.Hour() == 10), nil
}

func plotHistogram(data []float64) error {

	v := make(plotter.Values, len(data))
	for i := range v {
		v[i] = data[i]
	}

	// Make a plot and set its title.
	p, err := plot.New()
	if err != nil {
		return err
	}
	p.Title.Text = "Histogram"
	p.X.Label.Text = fmt.Sprintf("Mean: %.4f", stat.Mean(data, nil))

	// Create a histogram of our values drawn
	// from the standard normal.
	h, err := plotter.NewHist(v, 40)
	if err != nil {
		return err
	}
	// Normalize the area under the histogram to
	// sum to one.
	h.Normalize(1)
	p.Add(h)

	// TODO: Replace with actual mean
	// poisson := distuv.Poisson{
	// 	Lambda: 10,
	// }

	// Poisson distribution
	// poi := plotter.NewFunction(poisson.Prob)
	// poi := plotter.NewFunction(distuv.UnitNormal.Prob)
	// poi.Color = color.RGBA{R: 255, A: 255}
	// poi.Width = vg.Points(2)
	// p.Add(poi)

	// Save the plot to a PNG file.
	if err := p.Save(4*vg.Inch, 4*vg.Inch, "hist.png"); err != nil {
		panic(err)
	}

	return nil
}
