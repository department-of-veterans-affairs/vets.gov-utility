package main

import (
	"fmt"
	"time"

	"github.com/gonum/plot"
	"github.com/gonum/plot/plotter"
	"github.com/gonum/plot/vg"
	"gonum.org/v1/gonum/stat"
)

// HTMLReporter creates an HTML file and associated graphics for the load model report
type HTMLReporter struct {
	filename string
}

func (h HTMLReporter) report(data []RequestCount) error {
	return createPlots(data)
}

func createPlots(data []RequestCount) error {
	var err error

	businessHours := filter(data, func(r RequestCount) bool { return isBusinessHours(r.ts) })
	if err = plotHistogram(businessHours, "business.png"); err != nil {
		return err
	}

	nonBusinessHours := filter(data, func(r RequestCount) bool { return !isBusinessHours(r.ts) })
	if err = plotHistogram(nonBusinessHours, "nonbiz.png"); err != nil {
		return err
	}

	for hour := 8; hour <= 18; hour++ {
		toPlot := filter(data, func(r RequestCount) bool { return isBusinessHour(r.ts, hour) })
		if err = plotHistogram(toPlot, fmt.Sprintf("hour-%d.png", hour)); err != nil {
			return err
		}
	}

	return nil
}

func filter(counts []RequestCount, lambda func(RequestCount) bool) []float64 {
	toPlot := make([]float64, 0)
	for _, c := range counts {
		if lambda(c) {
			toPlot = append(toPlot, c.count)
		}
	}
	return toPlot
}

// Checks if time t is Monday-Friday from 8:00 am to 6:59pm Eastern Time (as defined by New York)
// Panics if it cannot load the timezone database
func isBusinessHours(t time.Time) bool {
	loc, err := time.LoadLocation("America/New_York")
	if err != nil {
		panic(err)
	}
	eastern := t.In(loc)
	return (eastern.Weekday() >= time.Monday && eastern.Weekday() <= time.Friday && eastern.Hour() >= 8 && eastern.Hour() <= 18)
}

func isBusinessHour(t time.Time, h int) bool {
	loc, err := time.LoadLocation("America/New_York")
	if err != nil {
		panic(err)
	}
	eastern := t.In(loc)
	return (eastern.Weekday() >= time.Monday && eastern.Weekday() <= time.Friday && eastern.Hour() == h)
}

func plotHistogram(data []float64, filename string) error {

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
	if err := p.Save(4*vg.Inch, 4*vg.Inch, filename); err != nil {
		panic(err)
	}

	return nil
}
