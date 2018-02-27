package main

import (
	"fmt"
	"html/template"
	"io"
	"os"
	"time"

	"gonum.org/v1/gonum/stat"
	"gonum.org/v1/plot"
	"gonum.org/v1/plot/plotter"
	"gonum.org/v1/plot/vg"
)

// HTMLReporter creates an HTML file and associated graphics for the load model report
type HTMLReporter struct {
	w io.Writer
}

type dailyTrafficPeakRate struct {
	PeakRate     int64
	DailyTraffic int64
	Ratio        int64
}

const dailyTrafficTemplate = `
<h1>Extrapolating from daily traffic to peak request rate</h1>
<p>The 99.9th percentile per minute rate is: {{.PeakRate}}</p>
<p>Daily total requests: {{.DailyTraffic}}</p>
<p>Divide daily requests by <b>{{.Ratio}}</b> to get a peak per minute rate.</p>
`

type siteGrowth struct {
	WeeklyGrowth         string
	ThreeMonths          int64
	ThreeMonthPercentage string
	SixMonths            int64
	SixMonthPercentage   string
	OneYear              int64
	OneYearPercentage    string
	GrowthChart          string
}

const overallSiteGrowth = `
<h1>Forecasting overall site growth</h1>
<p>To forecast future site rates, we apply the user growth numbers from Google Analytics because we do not have historical request rates. For each rate, we project three scenarios for the percentage
of the overall rate. This models a service growing in importance.</p>
<p>The choice of which rate in each table to pick is based on estimates for the growth of the site and the requests that will vary depending on what is modeled.</p>

<p><img src="{{.GrowthChart}}"></p>

<h3>Traffic Three Months from now</h3>
<table>
<tr>
<th><b>Overall Traffic Growth</b></th>
<th>Request Percentage is the Same</th>
<th>Request Percentage Doubles</th>
<th>Request Percentage 10x</th>
</tr>
<tr>
<td>Week over Week Rate ({{.WoWRate}})</td>
<td>{{.SameRate}}</td>
<td>{{.TwiceRate}}</td>
<td>{{.10xRate}}</td>
</tr>
<tr>
<td>Month over Month Rate ({{.MoMRate}})</td>
<td>{{.SameRate}}</td>
<td>{{.TwiceRate}}</td>
<td>{{.10xRate}}</td>
</tr>
<tr>
<td>Year over Year Rate ({{.YoYRate}})</td>
<td>{{.SameRate}}</td>
<td>{{.TwiceRate}}</td>
<td>{{.10xRate}}</td>
</tr>
</table>
`

type chartReport struct {
	Name      string
	ImageFile string
}

const chartTemplate = `
<h1>{{.Name}} Request Distribution</h1>
<p><img src="{{.ImageFile}}"></p>
`

func (h *HTMLReporter) report(req RequestMonitoring, grow GrowthMonitoring) error {

	data, err := monitoring.getPerMinute()
	if err != nil {
		return err
	}

	total, err := monitoring.getTotal()
	if err != nil {
		return err
	}

	tmpl := template.New("Header")
	tmpl.Execute(h.w, template.HTML("<html>\n<body>"))

	tmpl = template.Must(template.New("Daily Traffic to Peak Request").Parse(dailyTrafficTemplate))

	// Strip down to just the values
	rates := filter(data, func(r RequestCount) bool { return true })
	stat.SortWeighted(rates, nil)
	peakRate := stat.Quantile(0.999, stat.Empirical, rates, nil)

	report := dailyTrafficPeakRate{
		PeakRate:     int64(peakRate),
		DailyTraffic: int64(total),
		Ratio:        int64(total / peakRate),
	}

	if err = tmpl.Execute(h.w, report); err != nil {
		return err
	}

	if err := createPlots(data, h.w); err != nil {
		return err
	}

	tmpl = template.New("Footer")
	tmpl.Execute(h.w, template.HTML("<html>\n<body>"))

	return nil
}

func createPlots(data []RequestCount, w io.Writer) error {
	var err error

	businessHours := filter(data, func(r RequestCount) bool { return isBusinessHours(r.ts) })
	if err = makeChartSection(businessHours, "Business Hours", "business.png", w); err != nil {
		return err
	}

	nonBusinessHours := filter(data, func(r RequestCount) bool { return !isBusinessHours(r.ts) })
	if err = makeChartSection(nonBusinessHours, "Non-Business Hours", "nonbiz.png", w); err != nil {
		return err
	}

	for hour := 9; hour <= 18; hour++ {
		toPlot := filter(data, func(r RequestCount) bool { return isBusinessHour(r.ts, hour) })
		if err = makeChartSection(toPlot, fmt.Sprintf("Eastern Hour: %d:00-%d:59", hour, hour), fmt.Sprintf("hour-%d.png", hour), w); err != nil {
			return err
		}
	}

	return nil
}

func makeChartSection(toPlot []float64, chartfile, reportname string, w io.Writer) error {
	if err := plotHistogram(toPlot, chartfile); err != nil {
		return err
	}
	tmpl := template.Must(template.New(reportname).Parse(chartTemplate))
	return tmpl.Execute(w, chartReport{reportname, chartfile})
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
// Panics if it cannot load the timezone database. Dockerfile includes it.
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

	mean := stat.Mean(data, nil)

	p.Title.Text = "Histogram"
	p.X.Label.Text = fmt.Sprintf("Mean: %.4f", mean)

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

	// Save the plot to a PNG file.
	if err := p.Save(4*vg.Inch, 4*vg.Inch, filename); err != nil {
		panic(err)
	}

	return nil
}
