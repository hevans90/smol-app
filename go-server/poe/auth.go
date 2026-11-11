package poe

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
)

type TokenResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	Username    string `json:"username"`
	Sub         string `json:"sub"`
	Scope       string `json:"scope"`
}

// GetToken fetches a service token with the app's client credentials.
//
// Every failure is returned, never panicked: GGG being briefly unreachable,
// rate-limiting us, or answering with an HTML error page must cost one sweep,
// not the whole process.
func GetToken() (TokenResponse, error) {
	var tokenResponse TokenResponse

	clientSecret := os.Getenv("POE_CLIENT_SECRET")
	if clientSecret == "" {
		return tokenResponse, errors.New("POE_CLIENT_SECRET is not set")
	}

	form := url.Values{
		"client_id":     {"smolapp"},
		"client_secret": {clientSecret},
		"grant_type":    {"client_credentials"},
		"scope":         {"service:leagues service:leagues:ladder service:psapi"},
	}

	req, err := http.NewRequest("POST", oauthTokenURL, strings.NewReader(form.Encode()))
	if err != nil {
		return tokenResponse, err
	}
	req.Header.Set("User-Agent", userAgent)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := httpClient.Do(req)
	if err != nil {
		return tokenResponse, fmt.Errorf("token request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return tokenResponse, fmt.Errorf("reading token response: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		return tokenResponse, fmt.Errorf("token request returned status %d", resp.StatusCode)
	}
	if err := json.Unmarshal(body, &tokenResponse); err != nil {
		return tokenResponse, fmt.Errorf("decoding token response: %w", err)
	}
	if tokenResponse.AccessToken == "" {
		return tokenResponse, errors.New("token response had no access token")
	}

	return tokenResponse, nil
}
