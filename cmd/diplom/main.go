package main

import (
	"diplom/cmd/diplom/application"
	"log"
)

func main() {
	app, err := application.InitApplication()
	if err != nil {
		log.Fatalf("failed to init app: %v", err)
		return
	}

	if err := app.Server.Run(":8080"); err != nil {
		log.Fatalf("failed to serve app: %v", err)
	}
}
