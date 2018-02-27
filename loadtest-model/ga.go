package main

import (
	"errors"
	"fmt"

	"golang.org/x/net/context"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/analytics/v3"
)

func getGAData() error {
	ctx := context.Background()
	gc, err := google.DefaultClient(ctx, analytics.AnalyticsReadonlyScope)
	if err != nil {
		return err
	}

	analyticsService, err := analytics.New(gc)
	if err != nil {
		return err
	}

	gaAPICall := analyticsService.Data.Ga.Get("ga:111433053", "14daysAgo", "yesterday", "ga:users")

	gaAPICall = gaAPICall.SamplingLevel("HIGHER_PRECISION")

	data, err := gaAPICall.Do()
	if err != nil {
		return err
	} else if data.TotalResults != 1 {
		return errors.New("Too many results returned by Google Analytics")
	}

	fmt.Println(data.Rows[0][0])

	return nil
}