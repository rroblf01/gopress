package main

import (
	"fmt"
	"log"
	"os"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/static"
	_ "github.com/lib/pq"
)

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL no está configurada")
	}

	db, err := InitDB(dbURL)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	if err := CreateTable(db); err != nil {
		log.Fatal(err)
	}

	app := fiber.New()

	app.Get("/cms", ServeEditor(db))
	app.Post("/cms", SavePageHandler(db))
	app.Get("/", RenderPageHandler(db))
	app.Get("/api/page", GetPageHandler(db))
	app.Use("/static", static.New("./static"))

	fmt.Println("🚀 Servidor iniciado en http://localhost:3000")
	log.Fatal(app.Listen(":3000"))
}