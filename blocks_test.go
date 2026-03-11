package main

import (
	"strings"
	"testing"
)

// TestRenderBlockContainer prueba el renderizado de contenedores
func TestRenderBlockContainer(t *testing.T) {
	block := Block{
		ID:   1,
		Type: "container",
	}

	html := RenderBlock(block)

	if !strings.Contains(html, "block-1") {
		t.Error("El HTML debe contener la clase block-1")
	}
	if !strings.Contains(html, "display: flex") {
		t.Error("El contenedor debe tener display: flex")
	}
}

// TestRenderBlockHero prueba el renderizado de bloques hero
func TestRenderBlockHero(t *testing.T) {
	block := Block{
		ID:        2,
		Type:      "hero",
		Content:   "Título Principal",
		SubContent: "Subtítulo del hero",
	}

	html := RenderBlock(block)

	if !strings.Contains(html, "Título Principal") {
		t.Error("El HTML debe contener el contenido del hero")
	}
	if !strings.Contains(html, "Subtítulo del hero") {
		t.Error("El HTML debe contener el subtítulo")
	}
}

// TestRenderBlockHeading prueba el renderizado de encabezados
func TestRenderBlockHeading(t *testing.T) {
	block := Block{
		ID:      3,
		Type:    "heading",
		Content: "Encabezado de prueba",
		Level:   float64(1),
	}

	html := RenderBlock(block)

	if !strings.Contains(html, "<h1") {
		t.Error("El HTML debe contener un h1")
	}
	if !strings.Contains(html, "Encabezado de prueba") {
		t.Error("El HTML debe contener el contenido del heading")
	}
}

// TestRenderBlockParagraph prueba el renderizado de párrafos
func TestRenderBlockParagraph(t *testing.T) {
	block := Block{
		ID:      4,
		Type:    "paragraph",
		Content: "Este es un párrafo de prueba con texto de ejemplo.",
	}

	html := RenderBlock(block)

	if !strings.Contains(html, "<p") {
		t.Error("El HTML debe contener un párrafo")
	}
	if !strings.Contains(html, "Este es un párrafo de prueba") {
		t.Error("El HTML debe contener el contenido del párrafo")
	}
}

// TestRenderBlockImage prueba el renderizado de imágenes
func TestRenderBlockImage(t *testing.T) {
	block := Block{
		ID:   5,
		Type: "image",
		Src:  "https://example.com/image.jpg",
		Alt:  "Imagen de prueba",
	}

	html := RenderBlock(block)

	if !strings.Contains(html, "<img") {
		t.Error("El HTML debe contener una etiqueta img")
	}
	if !strings.Contains(html, "https://example.com/image.jpg") {
		t.Error("El HTML debe contener la URL de la imagen")
	}
	if !strings.Contains(html, "Imagen de prueba") {
		t.Error("El HTML debe contener el texto alt")
	}
}

// TestRenderBlockButton prueba el renderizado de botones
func TestRenderBlockButton(t *testing.T) {
	block := Block{
		ID:            6,
		Type:          "button",
		Text:          "Click aquí",
		Link:          "https://example.com",
		BackgroundColor: "#2563eb",
		TextColor:     "#ffffff",
	}

	html := RenderBlock(block)

	if !strings.Contains(html, "Click aquí") {
		t.Error("El HTML debe contener el texto del botón")
	}
	if !strings.Contains(html, "https://example.com") {
		t.Error("El HTML debe contener el link")
	}
}

// TestRenderBlockDivider prueba el renderizado de divisores
func TestRenderBlockDivider(t *testing.T) {
	block := Block{
		ID:   7,
		Type: "divider",
	}

	html := RenderBlock(block)

	if !strings.Contains(html, "<hr") {
		t.Error("El HTML debe contener un hr")
	}
}

// TestRenderBlockWithChildren prueba el renderizado de bloques con hijos
func TestRenderBlockWithChildren(t *testing.T) {
	childBlock := Block{
		ID:      9,
		Type:    "paragraph",
		Content: "Párrafo hijo",
	}

	parentBlock := Block{
		ID:       8,
		Type:     "container",
		Children: []Block{childBlock},
	}

	html := RenderBlock(parentBlock)

	if !strings.Contains(html, "block-8") {
		t.Error("El HTML debe contener la clase del padre")
	}
	if !strings.Contains(html, "block-9") {
		t.Error("El HTML debe contener la clase del hijo")
	}
	if !strings.Contains(html, "Párrafo hijo") {
		t.Error("El HTML debe contener el contenido del hijo")
	}
}

// TestRenderBlockWithCustomCSS prueba el CSS personalizado
func TestRenderBlockWithCustomCSS(t *testing.T) {
	block := Block{
		ID:        10,
		Type:      "container",
		CustomCSS: "background: red; color: white;",
	}

	html := RenderBlock(block)

	if !strings.Contains(html, "background: red") {
		t.Error("El HTML debe contener el CSS personalizado")
	}
}

// TestRenderBlockWithHiddenDesktop prueba la visibilidad en desktop
func TestRenderBlockWithHiddenDesktop(t *testing.T) {
	block := Block{
		ID:            11,
		Type:          "container",
		HiddenDesktop: true,
	}

	html := RenderBlock(block)

	if !strings.Contains(html, "@media (min-width: 1025px)") {
		t.Error("El HTML debe contener media query para desktop")
	}
	if !strings.Contains(html, "display: none") {
		t.Error("El HTML debe contener display: none para hidden")
	}
}

// TestRenderBlockWithHiddenTablet prueba la visibilidad en tablet
func TestRenderBlockWithHiddenTablet(t *testing.T) {
	block := Block{
		ID:           12,
		Type:         "container",
		HiddenTablet: true,
	}

	html := RenderBlock(block)

	if !strings.Contains(html, "@media (max-width: 1024px) and (min-width: 769px)") {
		t.Error("El HTML debe contener media query para tablet")
	}
}

// TestRenderBlockWithHiddenMobile prueba la visibilidad en móvil
func TestRenderBlockWithHiddenMobile(t *testing.T) {
	block := Block{
		ID:          13,
		Type:        "container",
		HiddenMobile: true,
	}

	html := RenderBlock(block)

	if !strings.Contains(html, "@media (max-width: 768px)") {
		t.Error("El HTML debe contener media query para móvil")
	}
}

// TestRenderBlockWithPadding prueba el padding
func TestRenderBlockWithPadding(t *testing.T) {
	block := Block{
		ID:          14,
		Type:        "container",
		PaddingTop:    "20",
		PaddingRight:  "40",
		PaddingBottom: "20",
		PaddingLeft:   "40",
	}

	html := RenderBlock(block)

	if !strings.Contains(html, "padding: 20px 40px 20px 40px") {
		t.Error("El HTML debe contener el padding correcto")
	}
}

// TestRenderBlockWithWidthHeight prueba dimensiones
func TestRenderBlockWithWidthHeight(t *testing.T) {
	block := Block{
		ID:     15,
		Type:   "container",
		Width:  "100%",
		Height: "400px",
	}

	html := RenderBlock(block)

	if !strings.Contains(html, "width: 100%") {
		t.Error("El HTML debe contener el width")
	}
	if !strings.Contains(html, "height: 400px") {
		t.Error("El HTML debe contener el height")
	}
}

// TestRenderBlockWithHoverStyles prueba los estilos hover
func TestRenderBlockWithHoverStyles(t *testing.T) {
	block := Block{
		ID:                 16,
		Type:               "container",
		HoverBackgroundColor: "#ff0000",
		HoverTextColor:     "#ffffff",
	}

	html := RenderBlock(block)

	if !strings.Contains(html, ":hover") {
		t.Error("El HTML debe contener estilos hover")
	}
	if !strings.Contains(html, "#ff0000") {
		t.Error("El HTML debe contener el color de fondo hover")
	}
}
