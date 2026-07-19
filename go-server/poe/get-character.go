package poe

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"time"
)

// The character-window endpoints are the public website API (no OAuth token);
// they only return data for accounts with a public profile.
var (
	ErrProfilePrivate    = errors.New("profile is private")
	ErrCharacterNotFound = errors.New("character not found")
)

type RateLimitedError struct {
	RetryAfter time.Duration
}

func (e *RateLimitedError) Error() string {
	return fmt.Sprintf("rate limited, retry after %v", e.RetryAfter)
}

func getCharacterWindow(endpoint, accountName, characterName string) (json.RawMessage, error) {
	params := url.Values{
		"accountName": {accountName}, // includes the #1234 discriminator
		"character":   {characterName},
		"realm":       {"pc"},
	}
	reqUrl := fmt.Sprintf("https://www.pathofexile.com/character-window/%s?%s", endpoint, params.Encode())

	req, err := http.NewRequest("GET", reqUrl, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "OAuth smolapp/1.0 (contact: hevans9000@gmail.com)")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	switch resp.StatusCode {
	case http.StatusOK:
		// fall through to read the body
	case http.StatusForbidden:
		return nil, ErrProfilePrivate
	case http.StatusNotFound:
		return nil, ErrCharacterNotFound
	case http.StatusTooManyRequests:
		retryAfter := 60 * time.Second
		if seconds, err := strconv.Atoi(resp.Header.Get("Retry-After")); err == nil {
			retryAfter = time.Duration(seconds) * time.Second
		}
		return nil, &RateLimitedError{RetryAfter: retryAfter}
	default:
		return nil, fmt.Errorf("%s returned status %d", endpoint, resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if !json.Valid(body) {
		return nil, fmt.Errorf("%s returned invalid JSON", endpoint)
	}
	return body, nil
}

// GetCharacterItems fetches the raw character-window/get-items payload
// (items + character info) for one character on a public profile.
func GetCharacterItems(accountName, characterName string) (json.RawMessage, error) {
	return getCharacterWindow("get-items", accountName, characterName)
}

// GetCharacterPassives fetches the raw character-window/get-passive-skills
// payload (tree hashes + socketed jewels) for one character on a public profile.
func GetCharacterPassives(accountName, characterName string) (json.RawMessage, error) {
	return getCharacterWindow("get-passive-skills", accountName, characterName)
}
