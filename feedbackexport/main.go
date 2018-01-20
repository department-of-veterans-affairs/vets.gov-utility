package main

import (
	"context"
	"encoding/csv"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/shurcooL/githubql"
	"golang.org/x/oauth2"
)

const label = "UserVoice"

type issue struct {
	CreatedAt githubql.DateTime
	//BodyText  githubql.String
	Title githubql.String
}

var q struct {
	Repository struct {
		Issue struct {
			Nodes    []issue
			PageInfo struct {
				EndCursor   githubql.String
				HasNextPage githubql.Boolean
			}
		} `graphql:"issues(first:50, after: $issueCursor, labels: $labels, orderBy: {field: CREATED_AT, direction: DESC})"`
	} `graphql:"repository(owner:\"department-of-veterans-affairs\", name:\"vets.gov-team\")"`
}

func main() {
	src := oauth2.StaticTokenSource(
		&oauth2.Token{AccessToken: os.Getenv("GITHUB_TOKEN")},
	)
	httpClient := oauth2.NewClient(context.Background(), src)

	client := githubql.NewClient(httpClient)

	variables := map[string]interface{}{
		"labels":      [1]githubql.String{githubql.String(label)},
		"issueCursor": (*githubql.String)(nil), // Null to get first page.
	}

	starttime, _ := time.Parse("2006-01-02", "2018-01-08")

	var issues []issue
	for {
		err := client.Query(context.Background(), &q, variables)
		if err != nil {
			log.Fatalln("error querying github:", err)
		}

		issues = append(issues, q.Repository.Issue.Nodes...)

		if bool(!q.Repository.Issue.PageInfo.HasNextPage) || issues[len(issues)-1].CreatedAt.Before(starttime) {
			break
		}
		variables["issueCursor"] = githubql.NewString(q.Repository.Issue.PageInfo.EndCursor)
	}

	var rows [][]string
	rows = append(rows, []string{"Date", "Title", "Response Requested"})

	for _, issue := range issues {

		title := string(issue.Title)

		if issue.CreatedAt.Before(starttime) || strings.HasPrefix(title, "UserVoice Idea:") {
			break
		}

		date := issue.CreatedAt.Format("Jan 2, 2006")
		rr := strings.HasSuffix(title, " - Response Requested")

		rows = append(rows, []string{date, title, strconv.FormatBool(rr)})
	}

	w := csv.NewWriter(os.Stdout)
	w.WriteAll(rows)

	if err := w.Error(); err != nil {
		log.Fatalln("error writing csv:", err)
	}
}
