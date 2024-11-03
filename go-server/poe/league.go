package poe

import (
	"encoding/json"
	"fmt"
	"html"
	"io"
	"log"
	"net/http"
	"time"
)

type League struct {
	ID          string    `json:"id"`
	Realm       string    `json:"realm"`
	URL         string    `json:"url"`
	StartAt     time.Time `json:"startAt"`
	EndAt       time.Time `json:"endAt"`
	Description string    `json:"description"`
	Category    struct {
		ID      string `json:"id"`
		Current bool   `json:"current"`
	} `json:"category"`
	RegisterAt time.Time `json:"registerAt"`
	DelveEvent bool      `json:"delveEvent"`
	Rules      []struct {
		ID          string `json:"id"`
		Name        string `json:"name"`
		Description string `json:"description"`
	} `json:"rules"`
}

type Ladder struct {
	Total       int       `json:"total"`
	CachedSince time.Time `json:"cached_since"`
	Entries     []struct {
		Rank      int  `json:"rank"`
		Dead      bool `json:"dead"`
		Retired   bool `json:"retired"`
		Character struct {
			ID         string `json:"id"`
			Name       string `json:"name"`
			Level      int    `json:"level"`
			Class      string `json:"class"`
			Experience int64  `json:"experience"`
		} `json:"character"`
		Account struct {
			Name       string `json:"name"`
			Realm      string `json:"realm"`
			Challenges struct {
				Set       string `json:"set"`
				Completed int    `json:"completed"`
				Max       int    `json:"max"`
			} `json:"challenges"`
			Twitch struct {
				Name string `json:"name"`
			} `json:"twitch"`
		} `json:"account"`
	} `json:"entries"`
}

type LeagueResponse struct {
	League League `json:"league"`
	Ladder Ladder `json:"ladder"`
}

func GetPrivateLeague(tokenResponse TokenResponse, leagueName string) LeagueResponse {
	var leagueResponse LeagueResponse

	bearer := fmt.Sprintf("bearer %v", tokenResponse.AccessToken)

	leaguesUrl := fmt.Sprintf("https://api.pathofexile.com/league/%v/ladder?limit=500", html.EscapeString(leagueName))

	req, httpReqConstructErr := http.NewRequest("GET", leaguesUrl, nil)

	if httpReqConstructErr != nil {
		log.Println("Error constructing HTTP request:", httpReqConstructErr)
	}

	req.Header.Set("Authorization", bearer)
	req.Header.Set("User-Agent", "OAuth smolapp/1.0 (contact: hevans9000@gmail.com)")

	client := &http.Client{}
	resp, err := client.Do(req)

	if err != nil {
		log.Println("Error on response:", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Println("Error while reading the response bytes:", err)
	}

	err2 := json.Unmarshal(body, &leagueResponse)
	if err2 != nil {
		fmt.Printf("There was an error decoding the json: %s", err2)
		panic(err2)
	}

	return leagueResponse
}
