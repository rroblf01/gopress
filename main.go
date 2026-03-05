package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/static"
	_ "github.com/lib/pq"
)

type Block struct {
	ID              int64                 `json:"id"`
	Type            string                `json:"type"`
	Content         string                `json:"content"`
	SubContent      string                `json:"subContent"`
	Level           interface{}           `json:"level"`
	Src             string                `json:"src"`
	Alt             string                `json:"alt"`
	Width           string                `json:"width"`
	Height          string                `json:"height"`
	Text            string                `json:"text"`
	Link            string                `json:"link"`
	Items           []map[string]string   `json:"items"`
	Slides          []map[string]string   `json:"slides"`
	Images          []string              `json:"images"`
	BorderColor     string                `json:"borderColor"`
	BackgroundColor string                `json:"backgroundColor"`
	TextColor       string                `json:"textColor"`
	CustomCSS       string                `json:"customCSS"`
}

type Styles struct {
	PrimaryColor    string `json:"primaryColor"`
	BackgroundColor string `json:"backgroundColor"`
	TextColor       string `json:"textColor"`
	FontFamily      string `json:"fontFamily"`
	MaxWidth        string `json:"maxWidth"`
	Padding         string `json:"padding"`
	GlobalCSS       string `json:"globalCSS"`
}

type PageData struct {
	Title     string  `json:"title"`
	Blocks    []Block `json:"blocks"`
	Styles    Styles  `json:"styles"`
	CreatedAt string  `json:"createdAt"`
}

var db *sql.DB

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL no está configurada")
	}

	var err error
	db, err = sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatal("Error conectando a la base de datos:", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatal("Error al hacer ping a la base de datos:", err)
	}
	fmt.Println("✓ Conectado a PostgreSQL")

	createTable()

	app := fiber.New()

	app.Get("/cms", ServeEditor)
	app.Post("/cms", SavePage)
	app.Get("/", RenderPage)
	app.Get("/api/page", GetPageData)
	app.Use("/static", static.New("./static"))

	log.Fatal(app.Listen(":3000"))
}

func createTable() {
	createTableSQL := `
	CREATE TABLE IF NOT EXISTS pages (
		id SERIAL PRIMARY KEY,
		title VARCHAR(255),
		blocks JSONB,
		styles JSONB,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	CREATE INDEX IF NOT EXISTS idx_pages_created_at ON pages(created_at);
	`

	if _, err := db.Exec(createTableSQL); err != nil {
		log.Fatal("Error creando tabla:", err)
	}
	fmt.Println("✓ Tabla de páginas lista")
}

func ServeEditor(c fiber.Ctx) error {
	return c.SendFile("./static/index.html")
}

func SavePage(c fiber.Ctx) error {
	fmt.Println("Recibiendo datos de la página...")

	var pageData PageData

	if err := c.Bind().JSON(&pageData); err != nil {
		fmt.Println("Error al parsear JSON:", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Datos inválidos: " + err.Error(),
		})
	}

	blocksJSON, _ := json.Marshal(pageData.Blocks)
	stylesJSON, _ := json.Marshal(pageData.Styles)

	var count int
	db.QueryRow("SELECT COUNT(*) FROM pages").Scan(&count)

	var pageID int64

	if count == 0 {
		err := db.QueryRow(`
		INSERT INTO pages (title, blocks, styles, created_at, updated_at) 
		VALUES ($1, $2, $3, NOW(), NOW())
		RETURNING id
		`, pageData.Title, string(blocksJSON), string(stylesJSON)).Scan(&pageID)

		if err != nil {
			fmt.Println("Error insertando página:", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Error guardando en la base de datos",
			})
		}
		fmt.Printf("✓ Página creada (ID: %d): %s (%d bloques)\n", pageID, pageData.Title, len(pageData.Blocks))
	} else {
		err := db.QueryRow(`
		UPDATE pages 
		SET title = $1, blocks = $2, styles = $3, updated_at = NOW() 
		WHERE id = (SELECT MAX(id) FROM pages)
		RETURNING id
		`, pageData.Title, string(blocksJSON), string(stylesJSON)).Scan(&pageID)

		if err != nil {
			fmt.Println("Error actualizando página:", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Error guardando en la base de datos",
			})
		}
		fmt.Printf("✓ Página actualizada (ID: %d): %s (%d bloques)\n", pageID, pageData.Title, len(pageData.Blocks))
	}

	return c.JSON(fiber.Map{
		"id":      pageID,
		"message": "Página guardada correctamente",
	})
}

func GetPageData(c fiber.Ctx) error {
	query := `
	SELECT title, blocks, styles, created_at 
	FROM pages 
	ORDER BY updated_at DESC 
	LIMIT 1
	`

	var title string
	var blocksJSON, stylesJSON []byte
	var createdAt string

	err := db.QueryRow(query).Scan(&title, &blocksJSON, &stylesJSON, &createdAt)

	if err == sql.ErrNoRows {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "No hay página guardada",
		})
	} else if err != nil {
		fmt.Println("Error obteniendo página:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error obteniendo la página",
		})
	}

	var pageData PageData
	pageData.Title = title
	pageData.CreatedAt = createdAt

	if err := json.Unmarshal(blocksJSON, &pageData.Blocks); err != nil {
		fmt.Println("Error decodificando bloques:", err)
		pageData.Blocks = []Block{}
	}

	if err := json.Unmarshal(stylesJSON, &pageData.Styles); err != nil {
		fmt.Println("Error decodificando estilos:", err)
		pageData.Styles = Styles{}
	}

	return c.JSON(pageData)
}

func RenderPage(c fiber.Ctx) error {
	query := `
	SELECT title, blocks, styles 
	FROM pages 
	ORDER BY updated_at DESC 
	LIMIT 1
	`

	var title string
	var blocksJSON, stylesJSON []byte

	err := db.QueryRow(query).Scan(&title, &blocksJSON, &stylesJSON)

	if err == sql.ErrNoRows {
		return c.Status(fiber.StatusNotFound).SendString("No hay página guardada")
	} else if err != nil {
		fmt.Println("Error obteniendo página:", err)
		return c.Status(fiber.StatusInternalServerError).SendString("Error obteniendo la página")
	}

	var page PageData
	page.Title = title

	if err := json.Unmarshal(blocksJSON, &page.Blocks); err != nil {
		page.Blocks = []Block{}
	}

	if err := json.Unmarshal(stylesJSON, &page.Styles); err != nil {
		page.Styles = Styles{}
	}

	html := buildPageHTML(page)

	c.Set("Content-Type", "text/html; charset=utf-8")
	return c.SendString(html)
}

func buildPageHTML(page PageData) string {
	var html strings.Builder

	html.WriteString(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>`)
	html.WriteString(escapeHTML(page.Title))
	html.WriteString(`</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: `)
	html.WriteString(page.Styles.FontFamily)
	html.WriteString(`;
            line-height: 1.6;
            color: `)
	html.WriteString(page.Styles.TextColor)
	html.WriteString(`;
            background: `)
	html.WriteString(page.Styles.BackgroundColor)
	html.WriteString(`;
        }
        .container {
            max-width: `)
	html.WriteString(page.Styles.MaxWidth)
	html.WriteString(`px;
            margin: 0 auto;
            padding: `)
	html.WriteString(page.Styles.Padding)
	html.WriteString(`px;
        }
        h1 { font-size: 36px; margin-bottom: 32px; }
        h2 { font-size: 28px; margin: 24px 0 16px; }
        h3 { font-size: 24px; margin: 20px 0 12px; }
        h4 { font-size: 20px; margin: 16px 0 8px; }
        p { margin-bottom: 16px; line-height: 1.8; }
        img { max-width: 100%; height: auto; border-radius: 4px; margin: 20px 0; }
        a { color: `)
	html.WriteString(page.Styles.PrimaryColor)
	html.WriteString(`; text-decoration: none; }
        a:hover { text-decoration: underline; }
        button { padding: 12px 24px; cursor: pointer; border: none; border-radius: 4px; font-weight: 500; }
        hr { border: none; border-top: 1px solid #e5e7eb; margin: 32px 0; }
        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin: 24px 0; }
        .grid-auto { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px; margin: 24px 0; }
        .card { border: 1px solid #e5e7eb; padding: 20px; border-radius: 4px; }
        `)
	html.WriteString(page.Styles.GlobalCSS)
	html.WriteString(`
    </style>
</head>
<body>
    <div class="container">
        <h1>`)
	html.WriteString(escapeHTML(page.Title))
	html.WriteString(`</h1>`)

	for _, block := range page.Blocks {
		html.WriteString(renderBlock(block))
	}

	html.WriteString(`
    </div>
</body>
</html>`)

	return html.String()
}

func renderBlock(block Block) string {
	var html strings.Builder
	blockClass := fmt.Sprintf("block-%d", block.ID)

	if block.CustomCSS != "" {
		html.WriteString(`<style>.`)
		html.WriteString(blockClass)
		html.WriteString(` { `)
		html.WriteString(block.CustomCSS)
		html.WriteString(` }</style>`)
	}

	switch block.Type {
	case "hero":
		html.WriteString(`<div class="`)
		html.WriteString(blockClass)
		html.WriteString(`" style="background: `)
		html.WriteString(block.BackgroundColor)
		html.WriteString(`; color: `)
		html.WriteString(block.TextColor)
		html.WriteString(`; padding: 60px 40px; border-radius: 4px; height: `)
		html.WriteString(block.Height)
		html.WriteString(`; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; margin: 24px 0;">
            <h1 style="font-size: 48px; margin-bottom: 16px;">`)
		html.WriteString(escapeHTML(block.Content))
		html.WriteString(`</h1>
            <p style="font-size: 18px;">`)
		html.WriteString(escapeHTML(block.SubContent))
		html.WriteString(`</p>
        </div>`)

	case "heading":
		level := 2
		switch v := block.Level.(type) {
		case float64:
			level = int(v)
		case string:
			fmt.Sscanf(v, "%d", &level)
		}
		if level < 1 || level > 6 {
			level = 2
		}
		html.WriteString(`<h`)
		html.WriteString(fmt.Sprintf("%d", level))
		html.WriteString(`" class="`)
		html.WriteString(blockClass)
		html.WriteString(`">`)
		html.WriteString(escapeHTML(block.Content))
		html.WriteString(`</h`)
		html.WriteString(fmt.Sprintf("%d", level))
		html.WriteString(`>`)

	case "paragraph":
		html.WriteString(`<p class="`)
		html.WriteString(blockClass)
		html.WriteString(`">`)
		html.WriteString(escapeHTML(block.Content))
		html.WriteString(`</p>`)

	case "image":
		html.WriteString(`<img class="`)
		html.WriteString(blockClass)
		html.WriteString(`" src="`)
		html.WriteString(block.Src)
		html.WriteString(`" alt="`)
		html.WriteString(escapeHTML(block.Alt))
		html.WriteString(`" style="width: `)
		html.WriteString(block.Width)
		html.WriteString(`;">`)

	case "button":
		html.WriteString(`<a class="`)
		html.WriteString(blockClass)
		html.WriteString(`" href="`)
		html.WriteString(block.Link)
		html.WriteString(`" style="display: inline-block; padding: 12px 24px; background: `)
		html.WriteString(block.BackgroundColor)
		html.WriteString(`; color: `)
		html.WriteString(block.TextColor)
		html.WriteString(`; border-radius: 4px; text-decoration: none; font-weight: 500;">`)
		html.WriteString(escapeHTML(block.Text))
		html.WriteString(`</a>`)

	case "cards":
		html.WriteString(`<div class="`)
		html.WriteString(blockClass)
		html.WriteString(` grid-3">`)
		for _, item := range block.Items {
			html.WriteString(`<div class="card"><h3>`)
			html.WriteString(escapeHTML(item["title"]))
			html.WriteString(`</h3><p>`)
			html.WriteString(escapeHTML(item["description"]))
			html.WriteString(`</p></div>`)
		}
		html.WriteString(`</div>`)

	case "carousel":
		html.WriteString(`<div class="`)
		html.WriteString(blockClass)
		html.WriteString(`" style="margin-bottom: 24px;"><style>.carousel-container { display: flex; gap: 16px; overflow-x: auto; padding: 16px 0; scroll-behavior: smooth; } .carousel-item { flex: 0 0 350px; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); } .carousel-item img { width: 100%; height: 250px; object-fit: cover; } .carousel-item-content { padding: 16px; } .carousel-item h3 { margin-bottom: 8px; font-size: 18px; color: #1f2937; } .carousel-item p { color: #6b7280; font-size: 14px; } .carousel-container::-webkit-scrollbar { height: 8px; } .carousel-container::-webkit-scrollbar-track { background: #f0f0f0; border-radius: 10px; } .carousel-container::-webkit-scrollbar-thumb { background: #2563eb; border-radius: 10px; } .carousel-container::-webkit-scrollbar-thumb:hover { background: #1e40af; }</style><div class="carousel-container">`)
		if len(block.Slides) > 0 {
			for _, slide := range block.Slides {
				html.WriteString(`<div class="carousel-item">`)
				if slide["image"] != "" {
					html.WriteString(`<img src="`)
					html.WriteString(slide["image"])
					html.WriteString(`" alt="`)
					html.WriteString(escapeHTML(slide["title"]))
					html.WriteString(`">`)
				} else {
					html.WriteString(`<div style="width: 100%; height: 250px; background: #e5e7eb; display: flex; align-items: center; justify-content: center; color: #6b7280;">Sin imagen</div>`)
				}
				html.WriteString(`<div class="carousel-item-content"><h3>`)
				html.WriteString(escapeHTML(slide["title"]))
				html.WriteString(`</h3>`)
				if slide["description"] != "" {
					html.WriteString(`<p>`)
					html.WriteString(escapeHTML(slide["description"]))
					html.WriteString(`</p>`)
				}
				html.WriteString(`</div></div>`)
			}
		} else {
			html.WriteString(`<div style="padding: 40px; text-align: center; color: #6b7280;">Carrusel vacío</div>`)
		}
		html.WriteString(`</div></div>`)

	case "divider":
		html.WriteString(`<hr class="`)
		html.WriteString(blockClass)
		html.WriteString(`" style="border-top: 2px solid `)
		html.WriteString(block.BorderColor)
		html.WriteString(`;">`)
	}

	return html.String()
}

func escapeHTML(s string) string {
	s = strings.ReplaceAll(s, "&", "&amp;")
	s = strings.ReplaceAll(s, "<", "&lt;")
	s = strings.ReplaceAll(s, ">", "&gt;")
	s = strings.ReplaceAll(s, "\"", "&quot;")
	s = strings.ReplaceAll(s, "'", "&#39;")
	return s
}