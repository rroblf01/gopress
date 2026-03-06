package main

import (
	"database/sql"
	"fmt"
	"strconv"

	"github.com/gofiber/fiber/v3"
)

func ServeEditor(db *sql.DB) fiber.Handler {
	return func(c fiber.Ctx) error {
		return c.SendFile("./static/index.html")
	}
}

func ServePreview(db *sql.DB) fiber.Handler {
	return func(c fiber.Ctx) error {
		return c.SendFile("./static/preview.html")
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

// Template handlers
func SaveTemplateHandler(db *sql.DB) fiber.Handler {
	return func(c fiber.Ctx) error {
		var req struct {
			Name string `json:"name"`
			PageData
		}

		if err := c.Bind().JSON(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Datos inválidos: " + err.Error(),
			})
		}

		if req.Name == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "El nombre de la plantilla es requerido",
			})
		}

		templateID, err := SaveTemplateToDB(db, req.Name, req.PageData)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		return c.JSON(fiber.Map{
			"id":      templateID,
			"message": "Plantilla guardada correctamente",
		})
	}
}

func GetTemplatesHandler(db *sql.DB) fiber.Handler {
	return func(c fiber.Ctx) error {
		templates, err := GetTemplatesFromDB(db)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		return c.JSON(templates)
	}
}

func GetTemplateHandler(db *sql.DB) fiber.Handler {
	return func(c fiber.Ctx) error {
		idStr := c.Params("id")
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "ID de plantilla inválido",
			})
		}

		pageData, err := GetTemplateFromDB(db, id)
		if err != nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		return c.JSON(pageData)
	}
}

func DeleteTemplateHandler(db *sql.DB) fiber.Handler {
	return func(c fiber.Ctx) error {
		idStr := c.Params("id")
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "ID de plantilla inválido",
			})
		}

		if err := DeleteTemplateFromDB(db, id); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		return c.JSON(fiber.Map{
			"message": "Plantilla eliminada correctamente",
		})
	}
}