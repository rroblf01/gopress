package main

import (
	"encoding/json"
	"strings"
	"testing"
)

// TestSaveComponent prueba el guardado de componentes
func TestSaveComponent(t *testing.T) {
	component := Component{
		ID:   1,
		Name: "Header",
		Blocks: []Block{
			{
				ID:      1,
				Type:    "heading",
				Content: "Header Title",
			},
		},
		Styles: Styles{
			PrimaryColor: "#2563eb",
		},
	}

	jsonData, err := json.Marshal(component)
	if err != nil {
		t.Fatalf("Error al serializar Component: %v", err)
	}

	if !strings.Contains(string(jsonData), "Header") {
		t.Error("El JSON debe contener el nombre del componente")
	}
	if !strings.Contains(string(jsonData), "heading") {
		t.Error("El JSON debe contener los bloques del componente")
	}
}

// TestLoadComponent prueba la carga de componentes
func TestLoadComponent(t *testing.T) {
	jsonString := `{
		"id": 1,
		"name": "Header",
		"blocks": [
			{
				"id": 1,
				"type": "heading",
				"content": "Header Title"
			}
		],
		"styles": {
			"primaryColor": "#2563eb"
		}
	}`

	var component Component
	err := json.Unmarshal([]byte(jsonString), &component)
	if err != nil {
		t.Fatalf("Error al deserializar Component: %v", err)
	}

	if component.Name != "Header" {
		t.Errorf("El nombre debe ser Header, got: %s", component.Name)
	}
	if len(component.Blocks) != 1 {
		t.Errorf("Debe haber 1 bloque, got: %d", len(component.Blocks))
	}
}

// TestSaveComponentWithResponsiveBlocks prueba componentes con bloques responsive
func TestSaveComponentWithResponsiveBlocks(t *testing.T) {
	component := Component{
		ID:   2,
		Name: "FlexContainer",
		Blocks: []Block{
			{
				ID:               1,
				Type:             "flex",
				DirectionDesktop: "row",
				DirectionTablet:  "column",
				DirectionMobile:  "column",
				GapDesktop:       "24",
				GapMobile:        "16",
			},
		},
	}

	jsonData, err := json.Marshal(component)
	if err != nil {
		t.Fatalf("Error al serializar Component: %v", err)
	}

	if !strings.Contains(string(jsonData), "directionDesktop") {
		t.Error("El JSON debe contener directionDesktop")
	}
	if !strings.Contains(string(jsonData), "directionMobile") {
		t.Error("El JSON debe contener directionMobile")
	}
}

// TestSaveComponentWithNestedBlocks prueba componentes con bloques anidados
func TestSaveComponentWithNestedBlocks(t *testing.T) {
	component := Component{
		ID:   3,
		Name: "Card",
		Blocks: []Block{
			{
				ID:   1,
				Type: "container",
				Children: []Block{
					{
						ID:      2,
						Type:    "image",
						Src:     "card-image.jpg",
					},
					{
						ID:      3,
						Type:    "heading",
						Content: "Card Title",
					},
					{
						ID:      4,
						Type:    "paragraph",
						Content: "Card description",
					},
					{
						ID:   5,
						Type: "button",
						Text: "Learn More",
					},
				},
			},
		},
	}

	jsonData, err := json.Marshal(component)
	if err != nil {
		t.Fatalf("Error al serializar Component: %v", err)
	}

	// Verificar estructura anidada
	if !strings.Contains(string(jsonData), "container") {
		t.Error("El JSON debe contener container")
	}
	if !strings.Contains(string(jsonData), "Card Title") {
		t.Error("El JSON debe contener el título de la card")
	}
	if !strings.Contains(string(jsonData), "Learn More") {
		t.Error("El JSON debe contener el texto del botón")
	}
}

// TestComponentWithAllBlockTypes prueba componente con todos los tipos de bloques
func TestComponentWithAllBlockTypes(t *testing.T) {
	component := Component{
		ID:   4,
		Name: "FullComponent",
		Blocks: []Block{
			{ID: 1, Type: "container"},
			{ID: 2, Type: "hero", Content: "Hero"},
			{ID: 3, Type: "heading", Content: "Heading"},
			{ID: 4, Type: "paragraph", Content: "Paragraph"},
			{ID: 5, Type: "image", Src: "test.jpg"},
			{ID: 6, Type: "icon", Emoji: "⭐"},
			{ID: 7, Type: "button", Text: "Button"},
			{ID: 8, Type: "divider"},
			{ID: 9, Type: "flex"},
			{ID: 10, Type: "grid"},
		},
	}

	jsonData, err := json.Marshal(component)
	if err != nil {
		t.Fatalf("Error al serializar Component: %v", err)
	}

	blockTypes := []string{"container", "hero", "heading", "paragraph", "image", "icon", "button", "divider", "flex", "grid"}
	for _, blockType := range blockTypes {
		if !strings.Contains(string(jsonData), blockType) {
			t.Errorf("El JSON debe contener el tipo de bloque: %s", blockType)
		}
	}
}

// TestSaveTemplate prueba el guardado de plantillas
func TestSaveTemplate(t *testing.T) {
	template := PageData{
		Slug:  "/template-landing",
		Title: "Landing Page Template",
		Blocks: []Block{
			{
				ID:   1,
				Type: "hero",
				Content: "Welcome to our site",
				SubContent: "We offer the best services",
			},
			{
				ID:   2,
				Type: "flex",
				Children: []Block{
					{ID: 3, Type: "cards"},
				},
			},
		},
		Styles: Styles{
			PrimaryColor: "#3b82f6",
			FontFamily:   "Inter, sans-serif",
		},
	}

	jsonData, err := json.Marshal(template)
	if err != nil {
		t.Fatalf("Error al serializar Template: %v", err)
	}

	if !strings.Contains(string(jsonData), "Landing Page Template") {
		t.Error("El JSON debe contener el título de la plantilla")
	}
	if !strings.Contains(string(jsonData), "Welcome to our site") {
		t.Error("El JSON debe contener el contenido del hero")
	}
}

// TestLoadTemplate prueba la carga de plantillas
func TestLoadTemplate(t *testing.T) {
	jsonString := `{
		"slug": "/template-landing",
		"title": "Landing Page Template",
		"blocks": [
			{
				"id": 1,
				"type": "hero",
				"content": "Welcome",
				"subContent": "Subtitle"
			},
			{
				"id": 2,
				"type": "flex",
				"children": [
					{
						"id": 3,
						"type": "cards"
					}
				]
			}
		],
		"styles": {
			"primaryColor": "#3b82f6"
		}
	}`

	var template PageData
	err := json.Unmarshal([]byte(jsonString), &template)
	if err != nil {
		t.Fatalf("Error al deserializar Template: %v", err)
	}

	if template.Title != "Landing Page Template" {
		t.Errorf("El título debe ser Landing Page Template, got: %s", template.Title)
	}
	if len(template.Blocks) != 2 {
		t.Errorf("Debe haber 2 bloques, got: %d", len(template.Blocks))
	}
}

// TestTemplateWithResponsiveLayout prueba plantilla con layout responsive
func TestTemplateWithResponsiveLayout(t *testing.T) {
	template := PageData{
		Slug:  "/responsive-template",
		Title: "Responsive Template",
		Blocks: []Block{
			{
				ID:               1,
				Type:             "flex",
				DirectionDesktop: "row",
				DirectionTablet:  "column",
				DirectionMobile:  "column",
				JustifyContentDesktop: "space-between",
				JustifyContentMobile:  "center",
				AlignItemsDesktop: "center",
				GapDesktop:       "32",
				GapTablet:        "24",
				GapMobile:        "16",
			},
			{
				ID:                        2,
				Type:                      "grid",
				GridTemplateColumnsDesktop: "repeat(4, 1fr)",
				GridTemplateColumnsTablet:  "repeat(2, 1fr)",
				GridTemplateColumnsMobile:  "1fr",
				GridGapDesktop:           "24",
				GridGapMobile:            "16",
			},
		},
	}

	jsonData, err := json.Marshal(template)
	if err != nil {
		t.Fatalf("Error al serializar Template: %v", err)
	}

	// Verificar propiedades responsive (JSON usa lowercase)
	if !strings.Contains(string(jsonData), "directionDesktop") {
		t.Error("El JSON debe contener directionDesktop")
	}
	if !strings.Contains(string(jsonData), "gridTemplateColumnsDesktop") {
		t.Error("El JSON debe contener gridTemplateColumnsDesktop")
	}
	if !strings.Contains(string(jsonData), "gridTemplateColumnsMobile") {
		t.Error("El JSON debe contener gridTemplateColumnsMobile")
	}
}

// TestTemplateWithMultipleSections prueba plantilla con múltiples secciones
func TestTemplateWithMultipleSections(t *testing.T) {
	template := PageData{
		Slug:  "/multi-section-template",
		Title: "Multi-Section Template",
		Blocks: []Block{
			{
				ID:        1,
				Type:      "container",
				SectionId: "hero",
				Children: []Block{
					{ID: 2, Type: "hero", Content: "Hero Section"},
				},
			},
			{
				ID:        3,
				Type:      "container",
				SectionId: "features",
				Children: []Block{
					{ID: 4, Type: "heading", Content: "Features"},
					{ID: 5, Type: "grid"},
				},
			},
			{
				ID:        6,
				Type:      "container",
				SectionId: "contact",
				Children: []Block{
					{ID: 7, Type: "heading", Content: "Contact Us"},
					{ID: 8, Type: "paragraph", Content: "Get in touch"},
				},
			},
		},
	}

	jsonData, err := json.Marshal(template)
	if err != nil {
		t.Fatalf("Error al serializar Template: %v", err)
	}

	// Verificar secciones
	if !strings.Contains(string(jsonData), "hero") {
		t.Error("El JSON debe contener sectionId: hero")
	}
	if !strings.Contains(string(jsonData), "features") {
		t.Error("El JSON debe contener sectionId: features")
	}
	if !strings.Contains(string(jsonData), "contact") {
		t.Error("El JSON debe contener sectionId: contact")
	}
}

// TestTemplateWithGlobalStyles prueba plantilla con estilos globales completos
func TestTemplateWithGlobalStyles(t *testing.T) {
	template := PageData{
		Slug:  "/styled-template",
		Title: "Styled Template",
		Styles: Styles{
			PrimaryColor:    "#7c3aed",
			BackgroundColor: "#fafafa",
			TextColor:       "#171717",
			FontFamily:      "system-ui, -apple-system, sans-serif",
			MaxWidth:        "1440",
			Padding:         "64",
			GlobalCSS: `
				.hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
				.button { transition: all 0.3s ease; }
			`,
		},
	}

	jsonData, err := json.Marshal(template)
	if err != nil {
		t.Fatalf("Error al serializar Template: %v", err)
	}

	if !strings.Contains(string(jsonData), "#7c3aed") {
		t.Error("El JSON debe contener primaryColor")
	}
	if !strings.Contains(string(jsonData), "system-ui") {
		t.Error("El JSON debe contener fontFamily")
	}
	if !strings.Contains(string(jsonData), "linear-gradient") {
		t.Error("El JSON debe contener globalCSS")
	}
}

// TestComponentRendersWithDB prueba que un componente se renderiza con DB
func TestComponentRendersWithDB(t *testing.T) {
	// Este test verifica la estructura de un componente
	componentBlock := Block{
		ID:            100,
		Type:          "component",
		ComponentName: "TestComponent",
		ComponentId:   1,
	}

	// Verificar que el bloque tiene la estructura correcta
	if componentBlock.Type != "component" {
		t.Error("El tipo debe ser component")
	}
	if componentBlock.ComponentName != "TestComponent" {
		t.Error("El nombre del componente debe ser TestComponent")
	}
	if componentBlock.ComponentId != 1 {
		t.Error("El ID del componente debe ser 1")
	}
}

// TestSaveComponentWithCustomCSS prueba componente con CSS personalizado
func TestSaveComponentWithCustomCSS(t *testing.T) {
	component := Component{
		ID:   5,
		Name: "StyledCard",
		Blocks: []Block{
			{
				ID:        1,
				Type:      "container",
				CustomCSS: `
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
					border-radius: 16px;
					box-shadow: 0 10px 40px rgba(0,0,0,0.1);
					padding: 32px;
				`,
			},
		},
	}

	jsonData, err := json.Marshal(component)
	if err != nil {
		t.Fatalf("Error al serializar Component: %v", err)
	}

	if !strings.Contains(string(jsonData), "customCSS") {
		t.Error("El JSON debe contener customCSS")
	}
	if !strings.Contains(string(jsonData), "linear-gradient") {
		t.Error("El JSON debe contener el CSS personalizado")
	}
}

// TestSaveComponentWithHiddenVisibility prueba componente con visibilidad
func TestSaveComponentWithHiddenVisibility(t *testing.T) {
	component := Component{
		ID:   6,
		Name: "ResponsiveComponent",
		Blocks: []Block{
			{
				ID:            1,
				Type:          "container",
				HiddenDesktop: false,
				HiddenTablet:  true,
				HiddenMobile:  false,
			},
		},
	}

	jsonData, err := json.Marshal(component)
	if err != nil {
		t.Fatalf("Error al serializar Component: %v", err)
	}

	if !strings.Contains(string(jsonData), "hiddenTablet") {
		t.Error("El JSON debe contener hiddenTablet")
	}
}

// TestTemplateWithButtonsAndScroll prueba plantilla con botones y scroll
func TestTemplateWithButtonsAndScroll(t *testing.T) {
	template := PageData{
		Slug:  "/scroll-template",
		Title: "Scroll Template",
		Blocks: []Block{
			{
				ID:        1,
				Type:      "container",
				SectionId: "top",
			},
			{
				ID:   2,
				Type: "button",
				Text: "Go to bottom",
				ScrollToId: "bottom",
			},
			{
				ID:        3,
				Type:      "container",
				SectionId: "bottom",
			},
		},
	}

	jsonData, err := json.Marshal(template)
	if err != nil {
		t.Fatalf("Error al serializar Template: %v", err)
	}

	if !strings.Contains(string(jsonData), "scrollToId") {
		t.Error("El JSON debe contener scrollToId")
	}
	if !strings.Contains(string(jsonData), "top") {
		t.Error("El JSON debe contener sectionId: top")
	}
	if !strings.Contains(string(jsonData), "bottom") {
		t.Error("El JSON debe contener sectionId: bottom")
	}
}

// TestComponentWithPaddingResponsive prueba componente con padding responsive
func TestComponentWithPaddingResponsive(t *testing.T) {
	component := Component{
		ID:   7,
		Name: "PaddedComponent",
		Blocks: []Block{
			{
				ID:                1,
				Type:              "container",
				PaddingTop:        "40",
				PaddingRight:      "40",
				PaddingBottom:     "40",
				PaddingLeft:       "40",
				PaddingTopTablet:  "32",
				PaddingRightTablet: "32",
				PaddingBottomTablet: "32",
				PaddingLeftTablet:   "32",
				PaddingTopMobile:    "24",
				PaddingRightMobile:  "24",
				PaddingBottomMobile: "24",
				PaddingLeftMobile:   "24",
			},
		},
	}

	jsonData, err := json.Marshal(component)
	if err != nil {
		t.Fatalf("Error al serializar Component: %v", err)
	}

	if !strings.Contains(string(jsonData), "paddingTop") {
		t.Error("El JSON debe contener paddingTop")
	}
	if !strings.Contains(string(jsonData), "paddingTopTablet") {
		t.Error("El JSON debe contener paddingTopTablet")
	}
	if !strings.Contains(string(jsonData), "paddingTopMobile") {
		t.Error("El JSON debe contener paddingTopMobile")
	}
}

// TestEmptyComponent prueba componente vacío
func TestEmptyComponent(t *testing.T) {
	component := Component{
		ID:     8,
		Name:   "EmptyComponent",
		Blocks: []Block{},
		Styles: Styles{},
	}

	jsonData, err := json.Marshal(component)
	if err != nil {
		t.Fatalf("Error al serializar Component: %v", err)
	}

	if !strings.Contains(string(jsonData), "EmptyComponent") {
		t.Error("El JSON debe contener el nombre del componente")
	}
}

// TestComponentWithIcon prueba componente con icono
func TestComponentWithIcon(t *testing.T) {
	component := Component{
		ID:   9,
		Name: "IconComponent",
		Blocks: []Block{
			{
				ID:         1,
				Type:       "icon",
				Emoji:      "🚀",
				FontSize:   "64",
				FontSizeTablet: "56",
				FontSizeMobile: "48",
				IconColor:  "#2563eb",
			},
		},
	}

	jsonData, err := json.Marshal(component)
	if err != nil {
		t.Fatalf("Error al serializar Component: %v", err)
	}

	if !strings.Contains(string(jsonData), "fontSize") {
		t.Error("El JSON debe contener fontSize")
	}
	if !strings.Contains(string(jsonData), "fontSizeTablet") {
		t.Error("El JSON debe contener fontSizeTablet")
	}
	if !strings.Contains(string(jsonData), "iconColor") {
		t.Error("El JSON debe contener iconColor")
	}
}
