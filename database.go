package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
)

func InitDB(dbURL string) (*sql.DB, error) {
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		return nil, fmt.Errorf("error conectando a la base de datos: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("error al hacer ping a la base de datos: %w", err)
	}

	fmt.Println("✓ Conectado a PostgreSQL")
	return db, nil
}

func CreateTable(db *sql.DB) error {
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
		return fmt.Errorf("error creando tabla: %w", err)
	}
	fmt.Println("✓ Tabla de páginas lista")
	return nil
}

func SavePageToDB(db *sql.DB, pageData PageData) (int64, error) {
	blocksJSON, _ := json.Marshal(pageData.Blocks)
	stylesJSON, _ := json.Marshal(pageData.Styles)

	var count int
	if err := db.QueryRow("SELECT COUNT(*) FROM pages").Scan(&count); err != nil {
		return 0, fmt.Errorf("error contando páginas: %w", err)
	}

	var pageID int64

	if count == 0 {
		err := db.QueryRow(`
		INSERT INTO pages (title, blocks, styles, created_at, updated_at) 
		VALUES ($1, $2, $3, NOW(), NOW())
		RETURNING id
		`, pageData.Title, string(blocksJSON), string(stylesJSON)).Scan(&pageID)

		if err != nil {
			return 0, fmt.Errorf("error insertando página: %w", err)
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
			return 0, fmt.Errorf("error actualizando página: %w", err)
		}
		fmt.Printf("✓ Página actualizada (ID: %d): %s (%d bloques)\n", pageID, pageData.Title, len(pageData.Blocks))
	}

	return pageID, nil
}

func GetPageFromDB(db *sql.DB) (*PageData, error) {
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
		return nil, fmt.Errorf("no hay página guardada")
	} else if err != nil {
		return nil, fmt.Errorf("error obteniendo página: %w", err)
	}

	pageData := &PageData{
		Title:     title,
		CreatedAt: createdAt,
	}

	if err := json.Unmarshal(blocksJSON, &pageData.Blocks); err != nil {
		log.Println("Error decodificando bloques:", err)
		pageData.Blocks = []Block{}
	}

	if err := json.Unmarshal(stylesJSON, &pageData.Styles); err != nil {
		log.Println("Error decodificando estilos:", err)
		pageData.Styles = Styles{}
	}

	return pageData, nil
}