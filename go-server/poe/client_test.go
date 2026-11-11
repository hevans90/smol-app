package poe

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// Every way GGG can misbehave must come back as an error. These used to
// panic (or dereference a nil response) and take the whole server down.

func serve(t *testing.T, status int, body string) {
	t.Helper()
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(status)
		w.Write([]byte(body))
	}))
	t.Cleanup(server.Close)

	previousToken, previousAPI := oauthTokenURL, apiBaseURL
	oauthTokenURL, apiBaseURL = server.URL, server.URL
	t.Cleanup(func() { oauthTokenURL, apiBaseURL = previousToken, previousAPI })
}

func unreachable(t *testing.T) {
	t.Helper()
	server := httptest.NewServer(http.NotFoundHandler())
	address := server.URL
	server.Close() // nothing listens here any more

	previousToken, previousAPI := oauthTokenURL, apiBaseURL
	oauthTokenURL, apiBaseURL = address, address
	t.Cleanup(func() { oauthTokenURL, apiBaseURL = previousToken, previousAPI })
}

func TestGetTokenReturnsErrors(t *testing.T) {
	t.Setenv("POE_CLIENT_SECRET", "test-secret")

	cases := map[string]func(*testing.T){
		"network failure":   unreachable,
		"html error page":   func(t *testing.T) { serve(t, http.StatusServiceUnavailable, "<html>down</html>") },
		"rate limited":      func(t *testing.T) { serve(t, http.StatusTooManyRequests, `{"error":"rate"}`) },
		"200 but not json":  func(t *testing.T) { serve(t, http.StatusOK, "<html>maintenance</html>") },
		"200 without token": func(t *testing.T) { serve(t, http.StatusOK, `{"error":"invalid_client"}`) },
	}
	for name, setup := range cases {
		t.Run(name, func(t *testing.T) {
			setup(t)
			if _, err := GetToken(); err == nil {
				t.Fatal("expected an error, got none")
			}
		})
	}
}

func TestGetTokenWithoutSecret(t *testing.T) {
	t.Setenv("POE_CLIENT_SECRET", "")
	if _, err := GetToken(); err == nil {
		t.Fatal("expected an error when the client secret is missing")
	}
}

func TestGetTokenSuccess(t *testing.T) {
	t.Setenv("POE_CLIENT_SECRET", "test-secret")
	// expires_in is null for client-credential tokens; it must not break decoding
	serve(t, http.StatusOK, `{"access_token":"abc","expires_in":null,"token_type":"bearer"}`)

	token, err := GetToken()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if token.AccessToken != "abc" {
		t.Fatalf("got access token %q", token.AccessToken)
	}
}

func TestGetLeagueReturnsErrors(t *testing.T) {
	cases := map[string]func(*testing.T){
		"network failure":  unreachable,
		"server error":     func(t *testing.T) { serve(t, http.StatusBadGateway, "<html>bad gateway</html>") },
		"unauthorized":     func(t *testing.T) { serve(t, http.StatusUnauthorized, `{"error":{"code":8}}`) },
		"200 but not json": func(t *testing.T) { serve(t, http.StatusOK, "<html>maintenance</html>") },
	}
	for name, setup := range cases {
		t.Run(name, func(t *testing.T) {
			setup(t)
			if _, err := GetLeague(TokenResponse{AccessToken: "abc"}, "Some League (PL1)"); err == nil {
				t.Fatal("expected an error, got none")
			}
		})
	}
}

func TestGetLeagueSuccessAndEscaping(t *testing.T) {
	var requestedPath string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestedPath = r.URL.EscapedPath()
		w.Write([]byte(`{"league":{"id":"Some League (PL1)"},"ladder":{"total":1,"entries":[{"rank":1,"public":true,"character":{"id":"c1","name":"Exile"},"account":{"name":"Someone#1234"}}]}}`))
	}))
	t.Cleanup(server.Close)
	previous := apiBaseURL
	apiBaseURL = server.URL
	t.Cleanup(func() { apiBaseURL = previous })

	response, err := GetLeague(TokenResponse{AccessToken: "abc"}, "Some League (PL1)")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(response.Ladder.Entries) != 1 || response.Ladder.Entries[0].Account.Name != "Someone#1234" {
		t.Fatalf("unexpected ladder: %+v", response.Ladder)
	}
	if !strings.Contains(requestedPath, "Some%20League") {
		t.Fatalf("league name was not path-escaped: %s", requestedPath)
	}
}
