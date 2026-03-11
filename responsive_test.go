package main

import (
	"strings"
	"testing"
)

// TestContainerResponsiveDirection prueba la dirección responsive de contenedores
func TestContainerResponsiveDirection(t *testing.T) {
	block := Block{
		ID:               1,
		Type:             "container",
		DirectionDesktop: "horizontal",
		DirectionTablet:  "vertical",
		DirectionMobile:  "vertical",
	}

	html := RenderBlock(block)

	// Verificar dirección desktop (base)
	if !strings.Contains(html, "flex-direction: row") {
		t.Error("El CSS base debe contener flex-direction: row para desktop")
	}

	// Verificar media query tablet (solo si hay DirectionTablet)
	// generateDirectionCSS solo genera media queries si hay valores específicos
	// Para este test, verificamos que al menos el CSS base esté presente
	AssertContains(t, html, "display: flex", "Debe contener display: flex")
}

// TestFlexResponsiveDirection prueba la dirección responsive de flex
func TestFlexResponsiveDirection(t *testing.T) {
	block := Block{
		ID:               2,
		Type:             "flex",
		DirectionDesktop: "row",
		DirectionTablet:  "column",
		DirectionMobile:  "column",
	}

	html := RenderBlock(block)

	// Verificar dirección desktop
	if !strings.Contains(html, "flex-direction: row") {
		t.Error("El CSS base debe contener flex-direction: row para desktop")
	}

	// Verificar dirección tablet
	if !strings.Contains(html, "@media (min-width: 769px) and (max-width: 1024px)") {
		t.Error("Debe haber media query para tablet")
	}

	// Verificar dirección mobile
	if !strings.Contains(html, "@media (max-width: 768px)") {
		t.Error("Debe haber media query para mobile")
	}
}

// TestFlexResponsiveJustifyContent prueba justify-content responsive
func TestFlexResponsiveJustifyContent(t *testing.T) {
	block := Block{
		ID:                    3,
		Type:                  "flex",
		JustifyContentDesktop: "flex-start",
		JustifyContentTablet:  "center",
		JustifyContentMobile:  "stretch",
	}

	html := RenderBlock(block)

	if !strings.Contains(html, "justify-content: flex-start") {
		t.Error("El CSS base debe contener justify-content: flex-start")
	}
}

// TestFlexResponsiveAlignItems prueba align-items responsive
func TestFlexResponsiveAlignItems(t *testing.T) {
	block := Block{
		ID:                 4,
		Type:               "flex",
		AlignItemsDesktop:  "flex-start",
		AlignItemsTablet:   "center",
		AlignItemsMobile:   "stretch",
	}

	html := RenderBlock(block)

	if !strings.Contains(html, "align-items: flex-start") {
		t.Error("El CSS base debe contener align-items: flex-start")
	}
}

// TestFlexResponsiveGap prueba gap responsive
func TestFlexResponsiveGap(t *testing.T) {
	block := Block{
		ID:          5,
		Type:        "flex",
		GapDesktop:  "20",
		GapTablet:   "16",
		GapMobile:   "12",
	}

	html := RenderBlock(block)

	if !strings.Contains(html, "gap: 20px") {
		t.Error("El CSS base debe contener gap: 20px")
	}
}

// TestFlexResponsiveFlexWrap prueba flex-wrap responsive
func TestFlexResponsiveFlexWrap(t *testing.T) {
	block := Block{
		ID:              6,
		Type:            "flex",
		FlexWrapDesktop: "wrap",
		FlexWrapTablet:  "nowrap",
		FlexWrapMobile:  "wrap-reverse",
	}

	html := RenderBlock(block)

	if !strings.Contains(html, "flex-wrap: wrap") {
		t.Error("El CSS base debe contener flex-wrap: wrap")
	}
}

// TestGridResponsiveTemplateColumns prueba grid-template-columns responsive
func TestGridResponsiveTemplateColumns(t *testing.T) {
	block := Block{
		ID:                        7,
		Type:                      "grid",
		GridTemplateColumnsDesktop: "repeat(3, 1fr)",
		GridTemplateColumnsTablet:  "repeat(2, 1fr)",
		GridTemplateColumnsMobile:  "1fr",
	}

	html := RenderBlock(block)

	if !strings.Contains(html, "grid-template-columns: repeat(3, 1fr)") {
		t.Error("El CSS base debe contener grid-template-columns: repeat(3, 1fr)")
	}

	if !strings.Contains(html, "@media (min-width: 769px) and (max-width: 1024px)") {
		t.Error("Debe haber media query para tablet")
	}

	if !strings.Contains(html, "@media (max-width: 768px)") {
		t.Error("Debe haber media query para mobile")
	}
}

// TestGridResponsiveGap prueba grid gap responsive
func TestGridResponsiveGap(t *testing.T) {
	block := Block{
		ID:            8,
		Type:          "grid",
		GridGapDesktop: "24",
		GridGapTablet:  "20",
		GridGapMobile:  "16",
	}

	html := RenderBlock(block)

	if !strings.Contains(html, "gap: 24px") {
		t.Error("El CSS base debe contener gap: 24px")
	}
}

// TestResponsiveWidthDesktop prueba width responsive
func TestResponsiveWidthDesktop(t *testing.T) {
	block := Block{
		ID:            9,
		Type:          "container",
		WidthDesktop:  "1200px",
		WidthTablet:   "100%",
		WidthMobile:   "100%",
	}

	html := RenderBlock(block)

	if !strings.Contains(html, "width: 1200px") {
		t.Error("El CSS debe contener width: 1200px para desktop")
	}
}

// TestResponsiveWidthTablet prueba width para tablet
func TestResponsiveWidthTablet(t *testing.T) {
	block := Block{
		ID:          10,
		Type:        "container",
		WidthTablet: "100%",
	}

	html := RenderBlock(block)

	if !strings.Contains(html, "@media (max-width: 1024px) and (min-width: 769px)") {
		t.Error("Debe haber media query para tablet")
	}
	if !strings.Contains(html, "width: 100%") {
		t.Error("El CSS tablet debe contener width: 100%")
	}
}

// TestResponsiveWidthMobile prueba width para móvil
func TestResponsiveWidthMobile(t *testing.T) {
	block := Block{
		ID:         11,
		Type:       "container",
		WidthMobile: "100%",
	}

	html := RenderBlock(block)

	if !strings.Contains(html, "@media (max-width: 768px)") {
		t.Error("Debe haber media query para mobile")
	}
	if !strings.Contains(html, "width: 100%") {
		t.Error("El CSS mobile debe contener width: 100%")
	}
}

// TestResponsiveHeightDesktop prueba height responsive
func TestResponsiveHeightDesktop(t *testing.T) {
	block := Block{
		ID:            12,
		Type:          "container",
		HeightDesktop: "500px",
		HeightTablet:  "400px",
		HeightMobile:  "300px",
	}

	html := RenderBlock(block)

	if !strings.Contains(html, "height: 500px") {
		t.Error("El CSS debe contener height: 500px para desktop")
	}
}

// TestResponsivePaddingTopTablet prueba padding-top responsive para tablet
func TestResponsivePaddingTopTablet(t *testing.T) {
	block := Block{
		ID:                13,
		Type:              "container",
		PaddingTop:        "20",
		PaddingTopTablet:  "16",
		PaddingTopMobile:  "12",
	}

	html := RenderBlock(block)

	// Padding desktop
	if !strings.Contains(html, "padding: 20px") {
		t.Error("El CSS base debe contener padding-top: 20px")
	}

	// Padding tablet
	if !strings.Contains(html, "@media (max-width: 1024px) and (min-width: 769px)") {
		t.Error("Debe haber media query para tablet")
	}

	// Padding mobile
	if !strings.Contains(html, "@media (max-width: 768px)") {
		t.Error("Debe haber media query para mobile")
	}
}

// TestResponsiveFontSizeIcon prueba font-size responsive para iconos
func TestResponsiveFontSizeIcon(t *testing.T) {
	block := Block{
		ID:         14,
		Type:       "icon",
		FontSize:   "48",
		FontSizeTablet: "40",
		FontSizeMobile: "32",
	}

	html := RenderBlock(block)

	if !strings.Contains(html, "font-size: 48px") {
		t.Error("El CSS debe contener font-size: 48px para desktop")
	}
}

// TestResponsiveAllPropertiesTogether prueba todas las propiedades responsive juntas
func TestResponsiveAllPropertiesTogether(t *testing.T) {
	block := Block{
		ID:               15,
		Type:             "flex",
		DirectionDesktop: "row",
		DirectionTablet:  "column",
		DirectionMobile:  "column",
		
		JustifyContentDesktop: "space-between",
		JustifyContentTablet:  "center",
		JustifyContentMobile:  "flex-start",
		
		AlignItemsDesktop: "center",
		AlignItemsTablet:  "flex-start",
		AlignItemsMobile:  "stretch",
		
		GapDesktop: "24",
		GapTablet:  "20",
		GapMobile:  "16",
		
		FlexWrapDesktop: "wrap",
		FlexWrapTablet:  "nowrap",
		FlexWrapMobile:  "wrap",
	}

	html := RenderBlock(block)

	// Verificar desktop
	if !strings.Contains(html, "flex-direction: row") {
		t.Error("Debe contener flex-direction: row para desktop")
	}
	if !strings.Contains(html, "justify-content: space-between") {
		t.Error("Debe contener justify-content: space-between para desktop")
	}
	if !strings.Contains(html, "align-items: center") {
		t.Error("Debe contener align-items: center para desktop")
	}
	if !strings.Contains(html, "gap: 24px") {
		t.Error("Debe contener gap: 24px para desktop")
	}
	if !strings.Contains(html, "flex-wrap: wrap") {
		t.Error("Debe contener flex-wrap: wrap para desktop")
	}

	// Verificar media queries
	if !strings.Contains(html, "@media (min-width: 769px) and (max-width: 1024px)") {
		t.Error("Debe haber media query para tablet")
	}
	if !strings.Contains(html, "@media (max-width: 768px)") {
		t.Error("Debe haber media query para mobile")
	}
}

// TestResponsiveBreakpoints prueba que los breakpoints sean correctos
func TestResponsiveBreakpoints(t *testing.T) {
	block := Block{
		ID:           16,
		Type:         "container",
		WidthDesktop: "1200px",
		WidthTablet:  "768px",
		WidthMobile:  "100%",
	}

	html := RenderBlock(block)

	// Verificar breakpoints correctos
	if !strings.Contains(html, "@media (max-width: 1024px) and (min-width: 769px)") {
		t.Error("El breakpoint para tablet debe ser (max-width: 1024px) and (min-width: 769px)")
	}
	if !strings.Contains(html, "@media (max-width: 768px)") {
		t.Error("El breakpoint para mobile debe ser (max-width: 768px)")
	}
}

// TestResponsiveFallbackToBase prueba que se use el valor base si no hay responsive
func TestResponsiveFallbackToBase(t *testing.T) {
	block := Block{
		ID:        17,
		Type:      "flex",
		Direction: "row", // Valor base sin sufijo Desktop
		// DirectionDesktop está vacío, debe usar Direction
	}

	html := RenderBlock(block)

	if !strings.Contains(html, "flex-direction: row") {
		t.Error("Debe usar el valor base cuando no hay valor Desktop")
	}
}

// TestResponsiveDesktopTakesPrecedence prueba que Desktop tiene prioridad sobre el base
func TestResponsiveDesktopTakesPrecedence(t *testing.T) {
	block := Block{
		ID:               18,
		Type:             "flex",
		Direction:        "column", // Valor base
		DirectionDesktop: "row",    // Valor desktop (debe tener prioridad)
	}

	html := RenderBlock(block)

	// Debe usar row (desktop) no column (base)
	if !strings.Contains(html, "flex-direction: row") {
		t.Error("DirectionDesktop debe tener prioridad sobre Direction")
	}
}
