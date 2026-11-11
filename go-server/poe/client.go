package poe

import (
	"net/http"
	"time"
)

// GGG requires every API client to send an identifiable User-Agent in this
// exact "OAuth {clientId}/{version} (contact: {email})" form.
const userAgent = "OAuth smolapp/1.0 (contact: hevans9000@gmail.com)"

// Variables rather than constants so tests can point them at a local server.
var (
	oauthTokenURL = "https://www.pathofexile.com/oauth/token"
	apiBaseURL    = "https://api.pathofexile.com"
)

// Shared by every request in this package. The timeout matters: a request
// with none can hang forever and stall the stats sweep with it.
var httpClient = &http.Client{Timeout: 30 * time.Second}
