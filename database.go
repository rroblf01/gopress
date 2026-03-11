package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"

	"golang.org/x/crypto/bcrypt"
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
	// Crear tablas sin la columna slug (se añade después)
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
	CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		username VARCHAR(255) NOT NULL UNIQUE,
		password VARCHAR(255) NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	CREATE INDEX IF NOT EXISTS idx_pages_created_at ON pages(created_at);
	CREATE INDEX IF NOT EXISTS idx_templates_created_at ON templates(created_at);
	CREATE INDEX IF NOT EXISTS idx_components_created_at ON components(created_at);
	CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
	`

	if _, err := db.Exec(createTableSQL); err != nil {
		return fmt.Errorf("error creando tablas: %w", err)
	}
	log.Println("✓ Tabla de páginas lista")
	log.Println("✓ Tabla de plantillas lista")

	// Añadir columnas e índices para múltiples páginas
	alterTableSQL := `
	ALTER TABLE pages
	ADD COLUMN IF NOT EXISTS slug VARCHAR(255);
	
	UPDATE pages SET slug = '/' WHERE slug IS NULL OR slug = '';
	
	CREATE UNIQUE INDEX IF NOT EXISTS idx_pages_slug_unique ON pages(slug);
	CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
	`

	if _, err := db.Exec(alterTableSQL); err != nil {
		log.Println("Nota: algunos índices ya existen:", err)
	} else {
		log.Println("✓ Columna slug e índices añadidos")
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

	// Usar slug si está disponible, sino usar '/'
	slug := pageData.Slug
	if slug == "" {
		slug = "/"
	}

	var pageID int64
	
	// Verificar si ya existe una página con este slug
	var existingID int64
	err := db.QueryRow(`SELECT id FROM pages WHERE slug = $1`, slug).Scan(&existingID)
	
	if err == sql.ErrNoRows {
		// No existe, crear nueva página
		err := db.QueryRow(`
		INSERT INTO pages (slug, title, blocks, styles, favicon, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		RETURNING id
		`, slug, pageData.Title, string(blocksJSON), string(stylesJSON), pageData.Favicon).Scan(&pageID)

		if err != nil {
			return 0, fmt.Errorf("error insertando página: %w", err)
		}
		log.Printf("✓ Página creada (ID: %d): %s (slug: %s, %d bloques)", pageID, pageData.Title, slug, len(pageData.Blocks))
	} else if err != nil {
		return 0, fmt.Errorf("error buscando página existente: %w", err)
	} else {
		// Ya existe, actualizar
		err := db.QueryRow(`
		UPDATE pages
		SET title = $1, blocks = $2, styles = $3, favicon = $4, updated_at = NOW()
		WHERE slug = $5
		RETURNING id
		`, pageData.Title, string(blocksJSON), string(stylesJSON), pageData.Favicon, slug).Scan(&pageID)

		if err != nil {
			return 0, fmt.Errorf("error actualizando página: %w", err)
		}
		log.Printf("✓ Página actualizada (ID: %d): %s (slug: %s, %d bloques)", pageID, pageData.Title, slug, len(pageData.Blocks))
	}

	return pageID, nil
}

func GetPageFromDB(db *sql.DB) (*PageData, error) {
	return GetPageBySlugFromDB(db, "/")
}

func GetPageBySlugFromDB(db *sql.DB, slug string) (*PageData, error) {
	query := `
	SELECT slug, title, blocks, styles, favicon, created_at
	FROM pages
	WHERE slug = $1
	`

	var pageSlug, title string
	var blocksJSON, stylesJSON []byte
	var favicon sql.NullString
	var createdAt string

	err := db.QueryRow(query, slug).Scan(&pageSlug, &title, &blocksJSON, &stylesJSON, &favicon, &createdAt)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("no hay página guardada para el slug: %s", slug)
	} else if err != nil {
		return nil, fmt.Errorf("error obteniendo página: %w", err)
	}

	pageData := &PageData{
		Slug:      pageSlug,
		Title:     title,
		Favicon:   favicon.String,
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

func GetAllPagesFromDB(db *sql.DB) ([]PageInfo, error) {
	query := `
	SELECT id, slug, title, created_at, updated_at
	FROM pages
	ORDER BY created_at ASC
	`

	rows, err := db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("error obteniendo páginas: %w", err)
	}
	defer rows.Close()

	pages := []PageInfo{}
	for rows.Next() {
		var p PageInfo
		if err := rows.Scan(&p.ID, &p.Slug, &p.Title, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, fmt.Errorf("error escaneando página: %w", err)
		}
		pages = append(pages, p)
	}
	return pages, nil
}

func DeletePageFromDB(db *sql.DB, id int64) error {
	// No permitir eliminar la página principal (/)
	var slug string
	err := db.QueryRow(`SELECT slug FROM pages WHERE id = $1`, id).Scan(&slug)
	if err != nil {
		return fmt.Errorf("error buscando página: %w", err)
	}
	if slug == "/" {
		return fmt.Errorf("no se puede eliminar la página principal")
	}
	
	_, err = db.Exec(`DELETE FROM pages WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("error eliminando página: %w", err)
	}
	log.Printf("✓ Página eliminada (ID: %d, slug: %s)", id, slug)
	return nil
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

// User functions
func GetUserCount(db *sql.DB) (int, error) {
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("error counting users: %w", err)
	}
	return count, nil
}

func CreateUser(db *sql.DB, username, password string) (int64, error) {
	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return 0, fmt.Errorf("error hashing password: %w", err)
	}

	var userID int64
	err = db.QueryRow(`
		INSERT INTO users (username, password, created_at)
		VALUES ($1, $2, NOW())
		RETURNING id
	`, username, string(hashedPassword)).Scan(&userID)

	if err != nil {
		return 0, fmt.Errorf("error creating user: %w", err)
	}
	log.Printf("✓ Usuario creado (ID: %d): %s", userID, username)
	return userID, nil
}

func ValidateUser(db *sql.DB, username, password string) (*User, error) {
	query := `
	SELECT id, username, password, created_at
	FROM users
	WHERE username = $1
	`

	var user User
	var hashedPassword string

	err := db.QueryRow(query, username).Scan(&user.ID, &user.Username, &hashedPassword, &user.CreatedAt)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("usuario no encontrado")
	} else if err != nil {
		return nil, fmt.Errorf("error obteniendo usuario: %w", err)
	}

	// Verify password
	err = bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
	if err != nil {
		return nil, fmt.Errorf("contraseña incorrecta")
	}

	return &user, nil
}

func GetUserByID(db *sql.DB, id int64) (*User, error) {
	query := `
	SELECT id, username, created_at
	FROM users
	WHERE id = $1
	`

	var user User
	err := db.QueryRow(query, id).Scan(&user.ID, &user.Username, &user.CreatedAt)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("usuario no encontrado")
	} else if err != nil {
		return nil, fmt.Errorf("error obteniendo usuario: %w", err)
	}

	return &user, nil
}