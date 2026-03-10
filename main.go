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
	app.Get("/preview", ServePreview(db))
	app.Get("/", RenderPageHandler(db))
	app.Get("/api/page", GetPageHandler(db))
	
	// Template routes
	app.Post("/api/templates", SaveTemplateHandler(db))
	app.Get("/api/templates", GetTemplatesHandler(db))
	app.Get("/api/templates/:id", GetTemplateHandler(db))
	app.Delete("/api/templates/:id", DeleteTemplateHandler(db))

	// Component routes
	app.Post("/api/components", SaveComponentHandler(db))
	app.Get("/api/components", GetComponentsHandler(db))
	app.Get("/api/components/:id", GetComponentHandler(db))
	app.Put("/api/components/:id", UpdateComponentHandler(db))
	app.Delete("/api/components/:id", DeleteComponentHandler(db))
	
	app.Use("/static", static.New("./static"))

	fmt.Println("🚀 Servidor iniciado en http://localhost:3000")
	log.Fatal(app.Listen(":3000"))
}