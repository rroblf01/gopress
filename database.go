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

	log.Println("✓ Conectado a PostgreSQL")
	return db, nil
}

func CreateTable(db *sql.DB) error {
	createTableSQL := `
	CREATE TABLE IF NOT EXISTS pages (
		id SERIAL PRIMARY KEY,
		title VARCHAR(255),
		blocks JSONB,
		styles JSONB,
		favicon TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	CREATE TABLE IF NOT EXISTS templates (
		id SERIAL PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		blocks JSONB,
		styles JSONB,
		favicon TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	CREATE TABLE IF NOT EXISTS components (
		id SERIAL PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		blocks JSONB,
		styles JSONB,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	CREATE INDEX IF NOT EXISTS idx_pages_created_at ON pages(created_at);
	CREATE INDEX IF NOT EXISTS idx_templates_created_at ON templates(created_at);
	CREATE INDEX IF NOT EXISTS idx_components_created_at ON components(created_at);
	`

	if _, err := db.Exec(createTableSQL); err != nil {
		return fmt.Errorf("error creando tablas: %w", err)
	}
	log.Println("✓ Tabla de páginas lista")
	log.Println("✓ Tabla de plantillas lista")

	// Añadir columna favicon si no existe (para bases de datos existentes)
	alterTableSQL := `
	ALTER TABLE pages
	ADD COLUMN IF NOT EXISTS favicon TEXT;
	`

	if _, err := db.Exec(alterTableSQL); err != nil {
		log.Println("Nota: columna favicon ya existe o no se pudo añadir:", err)
	} else {
		log.Println("✓ Columna favicon añadida")
	}

	return nil
}

// Template functions
func SaveTemplateToDB(db *sql.DB, name string, pageData PageData) (int64, error) {
	blocksJSON, _ := json.Marshal(pageData.Blocks)
	stylesJSON, _ := json.Marshal(pageData.Styles)

	var templateID int64
	err := db.QueryRow(`
		INSERT INTO templates (name, blocks, styles, favicon, created_at)
		VALUES ($1, $2, $3, $4, NOW())
		RETURNING id
	`, name, string(blocksJSON), string(stylesJSON), pageData.Favicon).Scan(&templateID)

	if err != nil {
		return 0, fmt.Errorf("error guardando plantilla: %w", err)
	}
	log.Printf("✓ Plantilla guardada (ID: %d): %s", templateID, name)
	return templateID, nil
}

func GetTemplatesFromDB(db *sql.DB) ([]TemplateInfo, error) {
	query := `
	SELECT id, name, created_at
	FROM templates
	ORDER BY created_at DESC
	`

	rows, err := db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("error obteniendo plantillas: %w", err)
	}
	defer rows.Close()

	var templates []TemplateInfo
	for rows.Next() {
		var t TemplateInfo
		if err := rows.Scan(&t.ID, &t.Name, &t.CreatedAt); err != nil {
			return nil, fmt.Errorf("error escaneando plantilla: %w", err)
		}
		templates = append(templates, t)
	}
	return templates, nil
}

func GetTemplateFromDB(db *sql.DB, id int64) (*PageData, error) {
	query := `
	SELECT name, blocks, styles, favicon, created_at
	FROM templates
	WHERE id = $1
	`

	var name string
	var blocksJSON, stylesJSON []byte
	var favicon sql.NullString
	var createdAt string

	err := db.QueryRow(query, id).Scan(&name, &blocksJSON, &stylesJSON, &favicon, &createdAt)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("plantilla no encontrada")
	} else if err != nil {
		return nil, fmt.Errorf("error obteniendo plantilla: %w", err)
	}

	pageData := &PageData{
		Title:     name,
		Favicon:   favicon.String,
		CreatedAt: createdAt,
	}

	if err := json.Unmarshal(blocksJSON, &pageData.Blocks); err != nil {
		log.Println("Error decodificando bloques de plantilla:", err)
		pageData.Blocks = []Block{}
	}

	if stylesJSON != nil && len(stylesJSON) > 0 {
		if err := json.Unmarshal(stylesJSON, &pageData.Styles); err != nil {
			log.Println("Error decodificando estilos de plantilla:", err)
			pageData.Styles = Styles{}
		}
	} else {
		pageData.Styles = Styles{}
	}

	return pageData, nil
}

func DeleteTemplateFromDB(db *sql.DB, id int64) error {
	_, err := db.Exec(`DELETE FROM templates WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("error eliminando plantilla: %w", err)
	}
	log.Printf("✓ Plantilla eliminada (ID: %d)", id)
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
		INSERT INTO pages (title, blocks, styles, favicon, created_at, updated_at)
		VALUES ($1, $2, $3, $4, NOW(), NOW())
		RETURNING id
		`, pageData.Title, string(blocksJSON), string(stylesJSON), pageData.Favicon).Scan(&pageID)

		if err != nil {
			return 0, fmt.Errorf("error insertando página: %w", err)
		}
		log.Printf("✓ Página creada (ID: %d): %s (%d bloques)", pageID, pageData.Title, len(pageData.Blocks))
	} else {
		err := db.QueryRow(`
		UPDATE pages
		SET title = $1, blocks = $2, styles = $3, favicon = $4, updated_at = NOW()
		WHERE id = (SELECT MAX(id) FROM pages)
		RETURNING id
		`, pageData.Title, string(blocksJSON), string(stylesJSON), pageData.Favicon).Scan(&pageID)

		if err != nil {
			return 0, fmt.Errorf("error actualizando página: %w", err)
		}
		log.Printf("✓ Page updated (ID: %d): %s (%d blocks)", pageID, pageData.Title, len(pageData.Blocks))
	}

	return pageID, nil
}

func GetPageFromDB(db *sql.DB) (*PageData, error) {
	query := `
	SELECT title, blocks, styles, favicon, created_at
	FROM pages
	ORDER BY updated_at DESC
	LIMIT 1
	`

	var title string
	var blocksJSON, stylesJSON []byte
	var favicon string
	var createdAt string

	err := db.QueryRow(query).Scan(&title, &blocksJSON, &stylesJSON, &favicon, &createdAt)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("no hay página guardada")
	} else if err != nil {
		return nil, fmt.Errorf("error obteniendo página: %w", err)
	}

	pageData := &PageData{
		Title:     title,
		Favicon:   favicon,
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

// Component functions
func SaveComponentToDB(db *sql.DB, name string, blocks []Block, styles Styles) (int64, error) {
	blocksJSON, _ := json.Marshal(blocks)
	stylesJSON, _ := json.Marshal(styles)

	var componentID int64
	err := db.QueryRow(`
		INSERT INTO components (name, blocks, styles, created_at)
		VALUES ($1, $2, $3, NOW())
		RETURNING id
	`, name, string(blocksJSON), string(stylesJSON)).Scan(&componentID)

	if err != nil {
		return 0, fmt.Errorf("error guardando componente: %w", err)
	}
	log.Printf("✓ Componente guardado (ID: %d): %s", componentID, name)
	return componentID, nil
}

func GetComponentsFromDB(db *sql.DB) ([]ComponentInfo, error) {
	query := `
	SELECT id, name, created_at
	FROM components
	ORDER BY created_at DESC
	`

	rows, err := db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("error obteniendo componentes: %w", err)
	}
	defer rows.Close()

	components := []ComponentInfo{} // Inicializar como array vacío
	for rows.Next() {
		var c ComponentInfo
		if err := rows.Scan(&c.ID, &c.Name, &c.CreatedAt); err != nil {
			return nil, fmt.Errorf("error escaneando componente: %w", err)
		}
		components = append(components, c)
	}
	return components, nil
}

func GetComponentFromDB(db *sql.DB, id int64) (*Component, error) {
	query := `
	SELECT name, blocks, styles, created_at
	FROM components
	WHERE id = $1
	`

	var name string
	var blocksJSON, stylesJSON []byte
	var createdAt string

	err := db.QueryRow(query, id).Scan(&name, &blocksJSON, &stylesJSON, &createdAt)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("componente no encontrado")
	} else if err != nil {
		return nil, fmt.Errorf("error obteniendo componente: %w", err)
	}

	component := &Component{
		ID:        id,
		Name:      name,
		CreatedAt: createdAt,
	}

	if err := json.Unmarshal(blocksJSON, &component.Blocks); err != nil {
		log.Println("Error decodificando bloques de componente:", err)
		component.Blocks = []Block{}
	}

	if stylesJSON != nil && len(stylesJSON) > 0 {
		if err := json.Unmarshal(stylesJSON, &component.Styles); err != nil {
			log.Println("Error decodificando estilos de componente:", err)
			component.Styles = Styles{}
		}
	} else {
		component.Styles = Styles{}
	}

	return component, nil
}

func UpdateComponentInDB(db *sql.DB, id int64, name string, blocks []Block, styles Styles) error {
	blocksJSON, _ := json.Marshal(blocks)
	stylesJSON, _ := json.Marshal(styles)

	_, err := db.Exec(`
		UPDATE components
		SET name = $1, blocks = $2, styles = $3
		WHERE id = $4
	`, name, string(blocksJSON), string(stylesJSON), id)

	if err != nil {
		return fmt.Errorf("error actualizando componente: %w", err)
	}
	log.Printf("✓ Componente actualizado (ID: %d): %s", id, name)
	return nil
}

func DeleteComponentFromDB(db *sql.DB, id int64) error {
	_, err := db.Exec(`DELETE FROM components WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("error eliminando componente: %w", err)
	}
	log.Printf("✓ Componente eliminado (ID: %d)", id)
	return nil
}