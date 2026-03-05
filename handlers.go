package main

import (
	"database/sql"
	"fmt"

	"github.com/gofiber/fiber/v3"
)

func ServeEditor(db *sql.DB) fiber.Handler {
	return func(c fiber.Ctx) error {
		return c.SendFile("./static/index.html")
	}
}

func SavePageHandler(db *sql.DB) fiber.Handler {
	return func(c fiber.Ctx) error {

		var pageData PageData

		if err := c.Bind().JSON(&pageData); err != nil {
			fmt.Println("Error al parsear JSON:", err)
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Datos inválidos: " + err.Error(),
			})
		}

		pageID, err := SavePageToDB(db, pageData)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		return c.JSON(fiber.Map{
			"id":      pageID,
			"message": "Página guardada correctamente",
		})
	}
}

func GetPageHandler(db *sql.DB) fiber.Handler {
	return func(c fiber.Ctx) error {
		pageData, err := GetPageFromDB(db)
		if err != nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		return c.JSON(pageData)
	}
}

func RenderPageHandler(db *sql.DB) fiber.Handler {
	return func(c fiber.Ctx) error {
		pageData, err := GetPageFromDB(db)
		if err != nil {
			return c.Status(fiber.StatusNotFound).SendString("No hay página guardada")
		}

		html := BuildPageHTML(*pageData)

		c.Set("Content-Type", "text/html; charset=utf-8")
		return c.SendString(html)
	}
}