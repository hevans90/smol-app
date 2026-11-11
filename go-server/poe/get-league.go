package poe

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
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
		Public    bool `json:"public"`
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

// GetLeague fetches a league and its ladder. Like GetToken, it returns every
// failure instead of panicking, so a bad response from GGG skips one sweep
// rather than crashing the server.
func GetLeague(tokenResponse TokenResponse, leagueName string) (LeagueResponse, error) {
	var leagueResponse LeagueResponse

	leagueUrl := fmt.Sprintf("%s/league/%s/ladder?limit=500", apiBaseURL, url.PathEscape(leagueName))

	req, err := http.NewRequest("GET", leagueUrl, nil)
	if err != nil {
		return leagueResponse, err
	}
	req.Header.Set("Authorization", "Bearer "+tokenResponse.AccessToken)
	req.Header.Set("User-Agent", userAgent)

	resp, err := httpClient.Do(req)
	if err != nil {
		return leagueResponse, fmt.Errorf("ladder request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return leagueResponse, fmt.Errorf("reading ladder response: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		return leagueResponse, fmt.Errorf("ladder request returned status %d", resp.StatusCode)
	}
	if err := json.Unmarshal(body, &leagueResponse); err != nil {
		return leagueResponse, fmt.Errorf("decoding ladder response: %w", err)
	}

	return leagueResponse, nil
}
