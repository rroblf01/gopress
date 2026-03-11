package main

import (
	"encoding/json"
	"strings"
	"testing"
)

// TestSavePageData prueba el guardado de datos de página
func TestSavePageData(t *testing.T) {
	pageData := PageData{
		Slug:  "/test-page",
		Title: "Página de Prueba",
		Blocks: []Block{
			{
				ID:      1,
				Type:    "heading",
				Content: "Título de prueba",
			},
		},
		Styles: Styles{
			PrimaryColor:    "#2563eb",
			BackgroundColor: "#ffffff",
			TextColor:       "#1f2937",
		},
	}

	// Serializar a JSON
	jsonData, err := json.Marshal(pageData)
	if err != nil {
		t.Fatalf("Error al serializar PageData: %v", err)
	}

	// Verificar que el JSON contiene los datos esperados
	if !strings.Contains(string(jsonData), "Página de Prueba") {
		t.Error("El JSON debe contener el título de la página")
	}
	if !strings.Contains(string(jsonData), "Título de prueba") {
		t.Error("El JSON debe contener el contenido del bloque")
	}
}

// TestLoadPageData prueba la carga de datos de página
func TestLoadPageData(t *testing.T) {
	jsonString := `{
		"slug": "/test-page",
		"title": "Página de Prueba",
		"blocks": [
			{
				"id": 1,
				"type": "heading",
				"content": "Título de prueba",
				"level": 1
			}
		],
		"styles": {
			"primaryColor": "#2563eb",
			"backgroundColor": "#ffffff",
			"textColor": "#1f2937"
		}
	}`

	var pageData PageData
	err := json.Unmarshal([]byte(jsonString), &pageData)
	if err != nil {
		t.Fatalf("Error al deserializar PageData: %v", err)
	}

	if pageData.Slug != "/test-page" {
		t.Errorf("El slug debe ser /test-page, got: %s", pageData.Slug)
	}
	if pageData.Title != "Página de Prueba" {
		t.Errorf("El título debe ser Página de Prueba, got: %s", pageData.Title)
	}
	if len(pageData.Blocks) != 1 {
		t.Errorf("Debe haber 1 bloque, got: %d", len(pageData.Blocks))
	}
	if pageData.Blocks[0].Type != "heading" {
		t.Errorf("El tipo de bloque debe ser heading, got: %s", pageData.Blocks[0].Type)
	}
}

// TestSavePageWithResponsiveBlocks prueba guardado con bloques responsive
func TestSavePageWithResponsiveBlocks(t *testing.T) {
	pageData := PageData{
		Slug:  "/responsive-page",
		Title: "Página Responsive",
		Blocks: []Block{
			{
				ID:               1,
				Type:             "flex",
				DirectionDesktop: "row",
				DirectionTablet:  "column",
				DirectionMobile:  "column",
				GapDesktop:       "24",
				GapTablet:        "20",
				GapMobile:        "16",
			},
		},
	}

	jsonData, err := json.Marshal(pageData)
	if err != nil {
		t.Fatalf("Error al serializar PageData: %v", err)
	}

	// Verificar propiedades responsive (JSON usa lowercase)
	if !strings.Contains(string(jsonData), "directionDesktop") {
		t.Error("El JSON debe contener directionDesktop")
	}
	if !strings.Contains(string(jsonData), "directionTablet") {
		t.Error("El JSON debe contener directionTablet")
	}
	if !strings.Contains(string(jsonData), "directionMobile") {
		t.Error("El JSON debe contener directionMobile")
	}
}

// TestLoadPageWithResponsiveBlocks prueba carga con bloques responsive
func TestLoadPageWithResponsiveBlocks(t *testing.T) {
	jsonString := `{
		"slug": "/responsive-page",
		"title": "Página Responsive",
		"blocks": [
			{
				"id": 1,
				"type": "flex",
				"directionDesktop": "row",
				"directionTablet": "column",
				"directionMobile": "column",
				"gapDesktop": "24",
				"gapTablet": "20",
				"gapMobile": "16"
			}
		]
	}`

	var pageData PageData
	err := json.Unmarshal([]byte(jsonString), &pageData)
	if err != nil {
		t.Fatalf("Error al deserializar PageData: %v", err)
	}

	block := pageData.Blocks[0]
	if block.DirectionDesktop != "row" {
		t.Errorf("DirectionDesktop debe ser row, got: %s", block.DirectionDesktop)
	}
	if block.DirectionTablet != "column" {
		t.Errorf("DirectionTablet debe ser column, got: %s", block.DirectionTablet)
	}
	if block.DirectionMobile != "column" {
		t.Errorf("DirectionMobile debe ser column, got: %s", block.DirectionMobile)
	}
}

// TestSavePageWithNestedBlocks prueba guardado con bloques anidados
func TestSavePageWithNestedBlocks(t *testing.T) {
	pageData := PageData{
		Slug:  "/nested-page",
		Title: "Página con Bloques Anidados",
		Blocks: []Block{
			{
				ID:   1,
				Type: "container",
				Children: []Block{
					{
						ID:      2,
						Type:    "heading",
						Content: "Encabezado anidado",
					},
					{
						ID:   3,
						Type: "flex",
						Children: []Block{
							{
								ID:      4,
								Type:    "paragraph",
								Content: "Párrafo en flex",
							},
						},
					},
				},
			},
		},
	}

	jsonData, err := json.Marshal(pageData)
	if err != nil {
		t.Fatalf("Error al serializar PageData: %v", err)
	}

	// Verificar estructura anidada
	if !strings.Contains(string(jsonData), "container") {
		t.Error("El JSON debe contener container")
	}
	if !strings.Contains(string(jsonData), "flex") {
		t.Error("El JSON debe contener flex")
	}
	if !strings.Contains(string(jsonData), "Encabezado anidado") {
		t.Error("El JSON debe contener el contenido anidado")
	}
}

// TestLoadPageWithNestedBlocks prueba carga con bloques anidados
func TestLoadPageWithNestedBlocks(t *testing.T) {
	jsonString := `{
		"slug": "/nested-page",
		"title": "Página con Bloques Anidados",
		"blocks": [
			{
				"id": 1,
				"type": "container",
				"children": [
					{
						"id": 2,
						"type": "heading",
						"content": "Encabezado anidado"
					},
					{
						"id": 3,
						"type": "flex",
						"children": [
							{
								"id": 4,
								"type": "paragraph",
								"content": "Párrafo en flex"
							}
						]
					}
				]
			}
		]
	}`

	var pageData PageData
	err := json.Unmarshal([]byte(jsonString), &pageData)
	if err != nil {
		t.Fatalf("Error al deserializar PageData: %v", err)
	}

	if len(pageData.Blocks) != 1 {
		t.Errorf("Debe haber 1 bloque raíz, got: %d", len(pageData.Blocks))
	}

	container := pageData.Blocks[0]
	if len(container.Children) != 2 {
		t.Errorf("El container debe tener 2 hijos, got: %d", len(container.Children))
	}

	flex := container.Children[1]
	if flex.Type != "flex" {
		t.Errorf("El segundo hijo debe ser flex, got: %s", flex.Type)
	}
	if len(flex.Children) != 1 {
		t.Errorf("El flex debe tener 1 hijo, got: %d", len(flex.Children))
	}
}

// TestSavePageWithAllBlockTypes prueba guardado con todos los tipos de bloques
func TestSavePageWithAllBlockTypes(t *testing.T) {
	pageData := PageData{
		Slug:  "/all-blocks",
		Title: "Página con Todos los Bloques",
		Blocks: []Block{
			{ID: 1, Type: "container"},
			{ID: 2, Type: "hero", Content: "Hero"},
			{ID: 3, Type: "heading", Content: "Heading"},
			{ID: 4, Type: "paragraph", Content: "Paragraph"},
			{ID: 5, Type: "image", Src: "test.jpg"},
			{ID: 6, Type: "icon", Emoji: "😀"},
			{ID: 7, Type: "button", Text: "Button"},
			{ID: 8, Type: "divider"},
			{ID: 9, Type: "flex"},
			{ID: 10, Type: "grid"},
			{ID: 11, Type: "cards"},
			{ID: 12, Type: "carousel"},
		},
	}

	jsonData, err := json.Marshal(pageData)
	if err != nil {
		t.Fatalf("Error al serializar PageData: %v", err)
	}

	// Verificar que todos los tipos están presentes
	blockTypes := []string{"container", "hero", "heading", "paragraph", "image", "icon", "button", "divider", "flex", "grid", "cards", "carousel"}
	for _, blockType := range blockTypes {
		if !strings.Contains(string(jsonData), blockType) {
			t.Errorf("El JSON debe contener el tipo de bloque: %s", blockType)
		}
	}
}

// TestSavePageWithStyles prueba guardado con estilos globales
func TestSavePageWithStyles(t *testing.T) {
	pageData := PageData{
		Slug:  "/styled-page",
		Title: "Página con Estilos",
		Styles: Styles{
			PrimaryColor:    "#ff5722",
			BackgroundColor: "#f5f5f5",
			TextColor:       "#333333",
			FontFamily:      "Arial, sans-serif",
			MaxWidth:        "1200",
			Padding:         "40",
			GlobalCSS:       "body { font-size: 16px; }",
		},
	}

	jsonData, err := json.Marshal(pageData)
	if err != nil {
		t.Fatalf("Error al serializar PageData: %v", err)
	}

	if !strings.Contains(string(jsonData), "#ff5722") {
		t.Error("El JSON debe contener primaryColor")
	}
	if !strings.Contains(string(jsonData), "Arial, sans-serif") {
		t.Error("El JSON debe contener fontFamily")
	}
	if !strings.Contains(string(jsonData), "body { font-size: 16px; }") {
		t.Error("El JSON debe contener globalCSS")
	}
}

// TestLoadPageWithStyles prueba carga con estilos globales
func TestLoadPageWithStyles(t *testing.T) {
	jsonString := `{
		"slug": "/styled-page",
		"title": "Página con Estilos",
		"styles": {
			"primaryColor": "#ff5722",
			"backgroundColor": "#f5f5f5",
			"textColor": "#333333",
			"fontFamily": "Arial, sans-serif",
			"maxWidth": "1200",
			"padding": "40",
			"globalCSS": "body { font-size: 16px; }"
		}
	}`

	var pageData PageData
	err := json.Unmarshal([]byte(jsonString), &pageData)
	if err != nil {
		t.Fatalf("Error al deserializar PageData: %v", err)
	}

	if pageData.Styles.PrimaryColor != "#ff5722" {
		t.Errorf("PrimaryColor debe ser #ff5722, got: %s", pageData.Styles.PrimaryColor)
	}
	if pageData.Styles.FontFamily != "Arial, sans-serif" {
		t.Errorf("FontFamily debe ser Arial, sans-serif, got: %s", pageData.Styles.FontFamily)
	}
}

// TestSavePageWithHiddenVisibility prueba guardado con visibilidad oculta
func TestSavePageWithHiddenVisibility(t *testing.T) {
	pageData := PageData{
		Slug:  "/hidden-page",
		Title: "Página con Visibilidad",
		Blocks: []Block{
			{
				ID:            1,
				Type:          "container",
				HiddenDesktop: true,
				HiddenTablet:  false,
				HiddenMobile:  true,
			},
		},
	}

	jsonData, err := json.Marshal(pageData)
	if err != nil {
		t.Fatalf("Error al serializar PageData: %v", err)
	}

	// Verificar propiedades de visibilidad
	if !strings.Contains(string(jsonData), "hiddenDesktop") {
		t.Error("El JSON debe contener hiddenDesktop")
	}
	if !strings.Contains(string(jsonData), "hiddenMobile") {
		t.Error("El JSON debe contener hiddenMobile")
	}
}

// TestLoadEmptyPage prueba carga de página vacía
func TestLoadEmptyPage(t *testing.T) {
	jsonString := `{
		"slug": "/empty-page",
		"title": "Página Vacía",
		"blocks": [],
		"styles": {}
	}`

	var pageData PageData
	err := json.Unmarshal([]byte(jsonString), &pageData)
	if err != nil {
		t.Fatalf("Error al deserializar PageData: %v", err)
	}

	if len(pageData.Blocks) != 0 {
		t.Errorf("La página vacía debe tener 0 bloques, got: %d", len(pageData.Blocks))
	}
}

// TestSavePageWithSectionId prueba guardado con ID de sección
func TestSavePageWithSectionId(t *testing.T) {
	pageData := PageData{
		Slug:  "/section-page",
		Title: "Página con Secciones",
		Blocks: []Block{
			{
				ID:        1,
				Type:      "container",
				SectionId: "contacto",
			},
			{
				ID:        2,
				Type:      "container",
				SectionId: "servicios",
			},
		},
	}

	jsonData, err := json.Marshal(pageData)
	if err != nil {
		t.Fatalf("Error al serializar PageData: %v", err)
	}

	if !strings.Contains(string(jsonData), "contacto") {
		t.Error("El JSON debe contener sectionId: contacto")
	}
	if !strings.Contains(string(jsonData), "servicios") {
		t.Error("El JSON debe contener sectionId: servicios")
	}
}

// TestSavePageWithScrollToId prueba guardado con scroll a sección
func TestSavePageWithScrollToId(t *testing.T) {
	pageData := PageData{
		Slug:  "/scroll-page",
		Title: "Página con Scroll",
		Blocks: []Block{
			{
				ID:         1,
				Type:       "button",
				Text:       "Ir a contacto",
				ScrollToId: "contacto",
			},
		},
	}

	jsonData, err := json.Marshal(pageData)
	if err != nil {
		t.Fatalf("Error al serializar PageData: %v", err)
	}

	if !strings.Contains(string(jsonData), "scrollToId") {
		t.Error("El JSON debe contener scrollToId")
	}
	if !strings.Contains(string(jsonData), "contacto") {
		t.Error("El JSON debe contener el valor de scrollToId")
	}
}

// TestSavePageWithComponent prueba guardado con componente
func TestSavePageWithComponent(t *testing.T) {
	pageData := PageData{
		Slug:  "/component-page",
		Title: "Página con Componente",
		Blocks: []Block{
			{
				ID:            1,
				Type:          "component",
				ComponentName: "Header",
				ComponentId:   42,
			},
		},
	}

	jsonData, err := json.Marshal(pageData)
	if err != nil {
		t.Fatalf("Error al serializar PageData: %v", err)
	}

	if !strings.Contains(string(jsonData), "Header") {
		t.Error("El JSON debe contener ComponentName")
	}
	if !strings.Contains(string(jsonData), "42") {
		t.Error("El JSON debe contener ComponentId")
	}
}

// TestSavePageWithToggleTargetId prueba guardado con toggle
func TestSavePageWithToggleTargetId(t *testing.T) {
	pageData := PageData{
		Slug:  "/toggle-page",
		Title: "Página con Toggle",
		Blocks: []Block{
			{
				ID:             1,
				Type:           "button",
				Text:           "Mostrar/Ocultar",
				ToggleTargetId: 2,
			},
			{
				ID:   2,
				Type: "paragraph",
				Content: "Contenido toggleable",
			},
		},
	}

	jsonData, err := json.Marshal(pageData)
	if err != nil {
		t.Fatalf("Error al serializar PageData: %v", err)
	}

	if !strings.Contains(string(jsonData), "toggleTargetId") {
		t.Error("El JSON debe contener toggleTargetId")
	}
}
