package main

import (
	"embed"
	"html/template"
	"net/http"
	"os"

	"github.com/joho/godotenv"

	"poe"
	"smoldata"
)

//go:embed templates/*
var resources embed.FS

var t = template.Must(template.ParseFS(resources, "templates/*"))

func main() {

	// try to load .env for local dev
	godotenv.Load("../.env")

	port := os.Getenv("GO_PORT")
	if port == "" {
		port = "8080"
	}

	smoldata.Connect()
	tokenResponse := poe.GetToken()

	poe.GetPrivateLeague(tokenResponse, "Smoldew Valley (PL49469)")

	// fmt.Printf("%+v\n", league)

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		data := map[string]string{
			"Region": os.Getenv("FLY_REGION"),
		}

		t.ExecuteTemplate(w, "index.html.tmpl", data)
	})

}
