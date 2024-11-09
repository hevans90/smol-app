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

	"github.com/fatih/color"
)

type TokenResponse struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   string `json:"expires_in"`
	TokenType   string `json:"token_type"`
	Username    string `json:"username"`
	Sub         string `json:"sub"`
	Scope       string `json:"scope"`
}

func GetToken() TokenResponse {
	var tokenResponse TokenResponse

	clientSecret := os.Getenv("POE_CLIENT_SECRET")
	if clientSecret == "" {
		msg := "no poe client secret found"
		panic(errors.New(msg))
	}

	client := &http.Client{}

	form := url.Values{
		"client_id":     {"smolapp"},
		"client_secret": {clientSecret},
		"grant_type":    {"client_credentials"},
		"scope":         {"service:leagues service:leagues:ladder service:psapi"},
	}

	req, err := http.NewRequest("POST", "https://www.pathofexile.com/oauth/token", strings.NewReader(form.Encode()))
	if err != nil {
		panic(err)
	}
	req.Header.Set("User-Agent", "OAuth smolapp/1.0 (contact: hevans9000@gmail.com)")
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		panic(err)
	}

	err2 := json.Unmarshal(body, &tokenResponse)
	if err2 != nil {
		fmt.Printf("There was an error decoding the json. err = %s", err2)
		panic(err2)
	}

	_, err3 := json.MarshalIndent(tokenResponse, "", "    ") // 4 spaces for indentation
	if err3 != nil {
		fmt.Println("Error marshaling JSON:", err3)
		os.Exit(1)
	}

	green := color.New(color.FgGreen)

	fmt.Print("POE API: ")
	green.Print("connected succesfully\n\n")

	return tokenResponse
}
