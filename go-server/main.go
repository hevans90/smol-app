package main

import (
	"embed"
	"encoding/json"
	"html/template"
	"net/http"
	"os"

	"github.com/joho/godotenv"

	"poe"
	"smoldata"
)

//go:embed templates/*
var resources embed.FS

// Function to encode data as JSON
func jsonMarshal(v interface{}) string {
	bytes, err := json.MarshalIndent(v, "", "    ") // Indent with 4 spaces
	if err != nil {
		return "{}" // Return an empty JSON object in case of an error
	}
	return string(bytes)
}

func main() {

	// Create a template function map
	funcMap := template.FuncMap{
		"json": jsonMarshal, // Add the json function to the template
	}

	t := template.Must(template.New("").Funcs(funcMap).ParseFS(resources, "templates/*"))

	// try to load .env for local dev
	godotenv.Load("../.env")

	port := os.Getenv("GO_PORT")
	if port == "" {
		port = "8080"
	}

	smoldata.Connect()
	tokenResponse := poe.GetToken()

	var leagueResponse = poe.GetPrivateLeague(tokenResponse, "Smoldew Valley (PL49469)")

	// Set up the HTTP handler
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		data := map[string]interface{}{
			"Region": os.Getenv("FLY_REGION"),
			"League": leagueResponse,
		}

		t.ExecuteTemplate(w, "index.html.tmpl", data)
	})

	// Start the HTTP server and listen on the specified port
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		// Log any error that occurs when starting the server
		panic(err)
	}

}
