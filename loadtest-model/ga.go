package main

import (
	"errors"
	"fmt"
	"math"
	"strconv"

	"golang.org/x/net/context"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/analytics/v3"
)

type GoogleAnalytics struct {
	thisWeek int64
	ViewID   string
	Metric
}

func (ga GoogleAnalytics) updateThisWeek() error {
	if ga.thisWeek == 0 {
		users, err := ga.getGAData(-7, -1)
		if err != nil {
			return err
		}
		ga.thisWeek = users
	}
	return nil
}

func (ga GoogleAnalytics) getWeeklyGrowth() (float64, error) {
	if err := ga.updateThisWeek(); err != nil {
		return -1.0, err
	}

	lastWeek, err := ga.getGAData(-14, -8)
	if err != nil {
		return -1.0, nil
	}
	return float64(ga.thisWeek) / float64(lastWeek), nil
}

// Use 4 7-day weeks to keep the days of the week aligned. Returns average weekly growth rate for the past month
func (ga GoogleAnalytics) getMonthlyGrowth() (float64, error) {
	if err := ga.updateThisWeek(); err != nil {
		return -1.0, err
	}

	lastMonth, err := ga.getGAData(-28, -22)
	if err != nil {
		return -1.0, nil
	}
	return math.Pow(float64(ga.thisWeek)/float64(lastMonth), 1.0/4.0), nil
}

// Use 52 7-day weeks to keep day of week aligned. Returns avg weekly growth rate over the past year
func (ga GoogleAnalytics) getYearlyGrowth() (float64, error) {
	if err := ga.updateThisWeek(); err != nil {
		return -1.0, err
	}

	lastYear, err := ga.getGAData(-364, -358)
	if err != nil {
		return -1.0, nil
	}
	return math.Pow(float64(ga.thisWeek)/float64(lastYear), 1.0/52.0), nil
}

func (ga GoogleAnalytics) getGAData(start, end int64) (int64, error) {
	ctx := context.Background()
	gc, err := google.DefaultClient(ctx, analytics.AnalyticsReadonlyScope)
	if err != nil {
		return -1, err
	}

	analyticsService, err := analytics.New(gc)
	if err != nil {
		return -1, err
	}

	gaAPICall := analyticsService.Data.Ga.Get(fmt.Sprintf("ga:%s", ga.ViewID), fmt.Sprintf("%ddaysAgo", start), fmt.Sprintf("%ddaysAgo", end), fmt.Sprintf("ga:%s", ga.Metric))

	gaAPICall = gaAPICall.SamplingLevel("HIGHER_PRECISION")

	data, err := gaAPICall.Do()
	if err != nil {
		return -1, err
	} else if data.TotalResults != 1 {
		return -1, errors.New("Too many results returned by Google Analytics")
	}

	return strconv.Atoi(data.Rows[0][0]), nil
}
