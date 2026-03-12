package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v3"
)

// Auth middleware
func AuthMiddleware(db *sql.DB) fiber.Handler {
	return func(c fiber.Ctx) error {
		// Check if user is authenticated via cookie
		session := c.Cookies("session")
		if session == "" {
			// No session cookie, redirect to login
			log.Println("⚠️ AuthMiddleware: No session cookie")
			return c.Redirect().To("/login")
		}

		// Validate session by checking if user exists
		userID, err := strconv.ParseInt(session, 10, 64)
		if err != nil {
			log.Println("⚠️ AuthMiddleware: Invalid session ID:", session)
			return c.Redirect().To("/login")
		}

		user, err := GetUserByID(db, userID)
		if err != nil {
			log.Println("⚠️ AuthMiddleware: User not found:", userID)
			return c.Redirect().To("/login")
		}

		log.Printf("✓ AuthMiddleware: User authenticated (ID: %d, Username: %s)", user.ID, user.Username)
		return c.Next()
	}
}

// Check if first user needs to be created
func NeedsFirstUser(db *sql.DB) fiber.Handler {
	return func(c fiber.Ctx) error {
		count, err := GetUserCount(db)
		if err != nil {
			log.Println("⚠️ NeedsFirstUser: Error getting user count:", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		if count == 0 {
			// No users exist, redirect to first user setup
			log.Println("⚠️ NeedsFirstUser: No users, redirecting to /first-user")
			return c.Redirect().To("/first-user")
		}

		log.Printf("✓ NeedsFirstUser: Users exist (count: %d), continuing", count)
		return c.Next()
	}
}

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
			fmt.Println("❌ [BACKEND] Error al parsear JSON:", err)
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Datos inválidos: " + err.Error(),
			})
		}

		fmt.Println("💾 [BACKEND] Recibido POST /cms:")
		fmt.Println("   - Slug:", pageData.Slug)
		fmt.Println("   - Title:", pageData.Title)
		fmt.Println("   - Blocks count:", len(pageData.Blocks))
		
		// Log detallado de cada bloque
		for i, block := range pageData.Blocks {
			fmt.Printf("   - Block[%d]: ID=%d, Type=%s, Children=%d\n", i, block.ID, block.Type, len(block.Children))
			// Log recursivo de children
			logBlockChildren(block.Children, 2)
		}

		pageID, err := SavePageToDB(db, pageData)
		if err != nil {
			fmt.Println("❌ [BACKEND] Error al guardar en DB:", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		fmt.Println("✅ [BACKEND] Página guardada correctamente, pageID:", pageID)

		return c.JSON(fiber.Map{
			"id":      pageID,
			"message": "Página guardada correctamente",
		})
	}
}

// Función auxiliar para loggear children recursivamente
func logBlockChildren(children []Block, indent int) {
	for i, child := range children {
		prefix := strings.Repeat("   ", indent)
		fmt.Printf("%s- Child[%d]: ID=%d, Type=%s, Children=%d\n", prefix, i, child.ID, child.Type, len(child.Children))
		if len(child.Children) > 0 {
			logBlockChildren(child.Children, indent+1)
		}
	}
}

func GetPageHandler(db *sql.DB) fiber.Handler {
	return func(c fiber.Ctx) error {
		// Obtener el slug de la query string (por defecto "/")
		slug := c.Query("slug", "/")
		
		pageData, err := GetPageBySlugFromDB(db, slug)
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
		// Obtener el slug de la URL (por defecto "/")
		slug := c.Params("slug")
		if slug == "" {
			slug = "/"
		}
		
		pageData, err := GetPageBySlugFromDB(db, slug)
		if err != nil {
			return c.Status(fiber.StatusNotFound).SendString("Página no encontrada: " + slug)
		}

		html := BuildPageHTMLWithComponents(*pageData, db)

		c.Set("Content-Type", "text/html; charset=utf-8")
		return c.SendString(html)
	}
}

func GetPagesHandler(db *sql.DB) fiber.Handler {
	return func(c fiber.Ctx) error {
		pages, err := GetAllPagesFromDB(db)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		return c.JSON(pages)
	}
}

func CreatePageHandler(db *sql.DB) fiber.Handler {
	return func(c fiber.Ctx) error {
		var req struct {
			Slug  string `json:"slug"`
			Title string `json:"title"`
		}

		if err := c.Bind().JSON(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Datos inválidos: " + err.Error(),
			})
		}

		// Validar slug
		if req.Slug == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "El slug es requerido",
			})
		}

		// Verificar si el slug ya existe
		existingPage, _ := GetPageBySlugFromDB(db, req.Slug)
		if existingPage != nil {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Ya existe una página con este slug",
			})
		}

		// Crear página vacía
		pageData := PageData{
			Slug:   req.Slug,
			Title:  req.Title,
			Blocks: []Block{},
			Styles: Styles{
				PrimaryColor:    "#2563eb",
				BackgroundColor: "#ffffff",
				TextColor:       "#1f2937",
				FontFamily:      "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
				MaxWidth:        "900",
				Padding:         "40",
			},
		}

		pageID, err := SavePageToDB(db, pageData)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		return c.JSON(fiber.Map{
			"id":      pageID,
			"slug":    req.Slug,
			"message": "Página creada correctamente",
		})
	}
}

func DeletePageHandler(db *sql.DB) fiber.Handler {
	return func(c fiber.Ctx) error {
		idStr := c.Params("id")
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "ID de página inválido",
			})
		}

		err = DeletePageFromDB(db, id)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		return c.JSON(fiber.Map{
			"message": "Página eliminada correctamente",
		})
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
		disableDeletion := os.Getenv("DISABLE_TEMPLATE_DELETION")
		if disableDeletion == "true" {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Eliminación de plantillas no permitida",
			})
		}

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

// Component handlers
func SaveComponentHandler(db *sql.DB) fiber.Handler {
	return func(c fiber.Ctx) error {
		var req struct {
			Name   string `json:"name"`
			Blocks []Block `json:"blocks"`
			Styles Styles  `json:"styles"`
		}

		if err := c.Bind().JSON(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Datos inválidos: " + err.Error(),
			})
		}

		if req.Name == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "El nombre del componente es requerido",
			})
		}

		componentID, err := SaveComponentToDB(db, req.Name, req.Blocks, req.Styles)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		return c.JSON(fiber.Map{
			"id":      componentID,
			"message": "Componente guardado correctamente",
		})
	}
}

func GetComponentsHandler(db *sql.DB) fiber.Handler {
	return func(c fiber.Ctx) error {
		components, err := GetComponentsFromDB(db)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		return c.JSON(components)
	}
}

func GetComponentHandler(db *sql.DB) fiber.Handler {
	return func(c fiber.Ctx) error {
		idStr := c.Params("id")
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "ID de componente inválido",
			})
		}

		component, err := GetComponentFromDB(db, id)
		if err != nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		return c.JSON(component)
	}
}

func UpdateComponentHandler(db *sql.DB) fiber.Handler {
	return func(c fiber.Ctx) error {
		idStr := c.Params("id")
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "ID de componente inválido",
			})
		}

		var req struct {
			Name   string `json:"name"`
			Blocks []Block `json:"blocks"`
			Styles Styles  `json:"styles"`
		}

		if err := c.Bind().JSON(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Datos inválidos: " + err.Error(),
			})
		}

		if err := UpdateComponentInDB(db, id, req.Name, req.Blocks, req.Styles); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		return c.JSON(fiber.Map{
			"message": "Componente actualizado correctamente",
		})
	}
}

func DeleteComponentHandler(db *sql.DB) fiber.Handler {
	return func(c fiber.Ctx) error {
		idStr := c.Params("id")
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "ID de componente inválido",
			})
		}

		if err := DeleteComponentFromDB(db, id); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		return c.JSON(fiber.Map{
			"message": "Componente eliminado correctamente",
		})
	}
}

// Auth handlers
func ServeLoginPage() fiber.Handler {
	return func(c fiber.Ctx) error {
		return c.SendFile("./static/login.html")
	}
}

func ServeFirstUserPage() fiber.Handler {
	return func(c fiber.Ctx) error {
		return c.SendFile("./static/first-user.html")
	}
}

func LoginHandler(db *sql.DB) fiber.Handler {
	return func(c fiber.Ctx) error {
		var req LoginRequest

		if err := c.Bind().JSON(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Datos inválidos",
			})
		}

		if req.Username == "" || req.Password == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Usuario y contraseña son requeridos",
			})
		}

		user, err := ValidateUser(db, req.Username, req.Password)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		// Set session cookie (simple implementation - in production use proper sessions)
		c.Cookie(&fiber.Cookie{
			Name:     "session",
			Value:    fmt.Sprintf("%d", user.ID),
			Path:     "/",
			MaxAge:   86400 * 7, // 7 days
			HTTPOnly: true,
			SameSite: "Lax",
		})

		return c.JSON(fiber.Map{
			"message": "Login exitoso",
			"user": fiber.Map{
				"id":       user.ID,
				"username": user.Username,
			},
		})
	}
}

func LogoutHandler() fiber.Handler {
	return func(c fiber.Ctx) error {
		c.Cookie(&fiber.Cookie{
			Name:   "session",
			Value:  "",
			Path:   "/",
			MaxAge: -1,
		})
		return c.JSON(fiber.Map{
			"message": "Logout exitoso",
		})
	}
}

func CreateFirstUserHandler(db *sql.DB) fiber.Handler {
	return func(c fiber.Ctx) error {
		// Check if users already exist
		count, err := GetUserCount(db)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		if count > 0 {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Ya existe un usuario. Usa el login normal.",
			})
		}

		var req LoginRequest

		if err := c.Bind().JSON(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Datos inválidos",
			})
		}

		if req.Username == "" || req.Password == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Usuario y contraseña son requeridos",
			})
		}

		if len(req.Username) < 3 {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "El usuario debe tener al menos 3 caracteres",
			})
		}

		if len(req.Password) < 6 {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "La contraseña debe tener al menos 6 caracteres",
			})
		}

		userID, err := CreateUser(db, req.Username, req.Password)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		// Set session cookie directly with the new user ID
		c.Cookie(&fiber.Cookie{
			Name:     "session",
			Value:    fmt.Sprintf("%d", userID),
			Path:     "/",
			MaxAge:   86400 * 7, // 7 days
			HTTPOnly: true,
			SameSite: "Lax",
		})

		log.Printf("✓ Primer usuario creado (ID: %d): %s", userID, req.Username)

		return c.JSON(fiber.Map{
			"message": "Usuario creado exitosamente",
			"user": fiber.Map{
				"id":       userID,
				"username": req.Username,
			},
		})
	}
}

func CheckAuthStatus(db *sql.DB) fiber.Handler {
	return func(c fiber.Ctx) error {
		session := c.Cookies("session")
		if session == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"authenticated": false,
			})
		}

		userID, err := strconv.ParseInt(session, 10, 64)
		if err != nil {
			c.Cookie(&fiber.Cookie{
				Name:   "session",
				Value:  "",
				Path:   "/",
				MaxAge: -1,
			})
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"authenticated": false,
			})
		}

		user, err := GetUserByID(db, userID)
		if err != nil {
			c.Cookie(&fiber.Cookie{
				Name:   "session",
				Value:  "",
				Path:   "/",
				MaxAge: -1,
			})
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"authenticated": false,
			})
		}

		return c.JSON(fiber.Map{
			"authenticated": true,
			"user": fiber.Map{
				"id":       user.ID,
				"username": user.Username,
			},
		})
	}
}

// Check if first user setup is needed (public endpoint, no redirect)
func CheckNeedsFirstUser(db *sql.DB) fiber.Handler {
	return func(c fiber.Ctx) error {
		count, err := GetUserCount(db)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		return c.JSON(fiber.Map{
			"needsSetup": count == 0,
		})
	}
}