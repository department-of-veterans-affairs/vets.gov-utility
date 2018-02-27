package main

import (
	"fmt"
	"html/template"
	"io"
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

const overallSiteGrowth = `
<h1>Forecasting overall site growth</h1>
<p>To forecast future site rates, we apply the user growth numbers from Google Analytics because we do not have historical request rates. For each rate, we project three scenarios for the percentage
of the overall rate. This models a service growing in importance.</p>
<p>The choice of which rate in each table to pick is based on estimates for the growth of the site and the requests that will vary depending on what is modeled.</p>
<p><img src="{{.}}"></p>
`

type siteGrowth struct {
	Period string
	WoWRate string
	WoWThree int64
	WoWSix int64
	WoWTwelve int64
	MoMRate string
	MoMThree int64
	MoMSix int64
	MoMTwelve int64
	YoYRate string
	YoYThree int64
	YoYSix int64
	YoYTwelve int64
}

const siteGrowthSection = `
<h3>Daily Request Traffic</h3>
<table>
<tr>
<th><b>Overall Traffic Growth</b></th>
<th>Three Months</th>
<th>Six Months</th>
<th>Twelve Months</th>
</tr>
<tr>
<td>Week over Week Rate ({{.WoWRate}})</td>
<td>{{.WoWThree}}</td>
<td>{{.WoWSix}}</td>
<td>{{.WoWTwelve}}</td>
</tr>
<tr>
<td>Month over Month Rate ({{.MoMRate}})</td>
<td>{{.MoMThree}}</td>
<td>{{.MoMSix}}</td>
<td>{{.MoMTwelve}}</td>
</tr>
<tr>
<td>Year over Year Rate ({{.YoYRate}})</td>
<td>{{.YoYThree}}</td>
<td>{{.YoYSix}}</td>
<td>{{.YoYTwelve}}</td>
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

	weeklyRate, err := grow.getWeeklyGrowth()
	if err != nil {
		return err
	}

	monthlyRate, err := grow.getMonthlyGrowth()
	if err != nil {
		return err
	}

	yearlyRate, err := grow.getYearlyGrowth()
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

	if err = createSiteGrowth(weeklyRate, monthlyRate, yearlyRate, total, h.w); err != nil {
		return err
	}

	if err = createPlots(data, h.w); err != nil {
		return err
	}

	tmpl = template.New("Footer")
	tmpl.Execute(h.w, template.HTML("<html>\n<body>"))

	return nil
}

func createSiteGrowth(weekly, monthly, yearly, dailyRate float64, w io.Writer) error {

	tmpl := template.Must(template.New("Site Growth Overall").Parse(overallSiteGrowth))
	if err := tmpl.Execute(w, "GrowthChart.png"); err != nil {
		return err
	}

	dailyRate * math.Pow(weekly, 12)

	g := &siteGrowth{
		Period:    "Three Months",
		WoWRate:   fmt.Sprintf("%.2f", weekly),
		WoWThree:  int64(dailyRate*math.Pow(weekly, 12)),
		WoWSix:    int64(dailyRate*math.Pow(weekly, 28)),
		WoWTwelve: int64(dailyRate*math.Pow(weekly, 52)),
		MoMRate:   fmt.Sprintf("%.2f", monthly),
		MoMThree:  int64(dailyRate*math.Pow(monthly, 12)),
		MoMSix:    int64(dailyRate*math.Pow(monthly, 28)),
		MoMTwelve: int64(dailyRate*math.Pow(monthly, 52)),
		YoYRate:   fmt.Sprintf("%.2f", yearly),
		YoYThree:  int64(dailyRate*math.Pow(yearly, 12)),
		YoYSix:    int64(dailyRate*math.Pow(yearly, 28)),
		YoYTwelve: int64(dailyRate*math.Pow(yearly, 52)),
	}

	tmpl := template.Must(template.New("Site Growth Section").Parse(siteGrowthSection))
	if err := tmpl.Execute(w, g); err != nil {
		return err
	}

	//TODO make overall GrowthChart.png
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
