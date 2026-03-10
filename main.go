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

	// Public routes (no auth required)
	app.Get("/login", ServeLoginPage())
	app.Get("/first-user", ServeFirstUserPage())
	app.Post("/api/login", LoginHandler(db))
	app.Post("/api/first-user", CreateFirstUserHandler(db))
	app.Get("/api/auth/status", CheckAuthStatus(db))

	// Public website
	app.Get("/", RenderPageHandler(db))

	// Static files (public)
	app.Use("/static", static.New("./static"))

	// Protected routes (auth required)
	cmsGroup := app.Group("/cms")
	cmsGroup.Use(NeedsFirstUser(db))  // Check if first user exists FIRST
	cmsGroup.Use(AuthMiddleware(db))   // Then check auth
	cmsGroup.Get("/", ServeEditor(db))
	cmsGroup.Post("/", SavePageHandler(db))

	previewGroup := app.Group("/preview")
	previewGroup.Use(AuthMiddleware(db))
	previewGroup.Get("/", ServePreview(db))

	// Protected API routes
	apiGroup := app.Group("/api")
	apiGroup.Use(NeedsFirstUser(db))  // Check if first user exists FIRST
	apiGroup.Use(AuthMiddleware(db))   // Then check auth
	apiGroup.Get("/page", GetPageHandler(db))
	apiGroup.Post("/logout", LogoutHandler())

	// Template routes (protected)
	templatesGroup := app.Group("/api/templates")
	templatesGroup.Use(NeedsFirstUser(db))
	templatesGroup.Use(AuthMiddleware(db))
	templatesGroup.Post("/", SaveTemplateHandler(db))
	templatesGroup.Get("/", GetTemplatesHandler(db))
	templatesGroup.Get("/:id", GetTemplateHandler(db))
	templatesGroup.Delete("/:id", DeleteTemplateHandler(db))

	// Component routes (protected)
	componentsGroup := app.Group("/api/components")
	componentsGroup.Use(NeedsFirstUser(db))
	componentsGroup.Use(AuthMiddleware(db))
	componentsGroup.Post("/", SaveComponentHandler(db))
	componentsGroup.Get("/", GetComponentsHandler(db))
	componentsGroup.Get("/:id", GetComponentHandler(db))
	componentsGroup.Put("/:id", UpdateComponentHandler(db))
	componentsGroup.Delete("/:id", DeleteComponentHandler(db))

	fmt.Println("🚀 Servidor iniciado en http://localhost:3000")
	log.Fatal(app.Listen(":3000"))
}