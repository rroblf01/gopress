package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
)

func BuildPageHTML(page PageData) string {
	return BuildPageHTMLWithComponents(page, nil)
}

func BuildPageHTMLWithComponents(page PageData, db *sql.DB) string {
	var html strings.Builder

	html.WriteString(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>`)
	html.WriteString(EscapeHTML(page.Title))
	html.WriteString(`</title>`)
	if page.Favicon != "" {
		html.WriteString(`<link rel="icon" href="`)
		html.WriteString(page.Favicon)
		html.WriteString(`">`)
	}
	html.WriteString(`
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
            margin: 0;
            padding: 0;
        }
        .container {
            width: 100%;
        }
        h1 { font-size: 36px; }
        h2 { font-size: 28px; }
        h3 { font-size: 24px; }
        h4 { font-size: 20px; }
        p { margin-bottom: 16px; line-height: 1.8; }
        a { color: `)
	html.WriteString(page.Styles.PrimaryColor)
	html.WriteString(`; text-decoration: none; }
        a:hover { text-decoration: underline; }
        button { cursor: pointer; border: none; border-radius: 4px; font-weight: 500; }
        hr { border: none; border-top: 1px solid #e5e7eb; margin: 32px 0; }
        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .grid-auto { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); }
        .card { border: 1px solid #e5e7eb; border-radius: 4px; }
        `)
	html.WriteString(page.Styles.GlobalCSS)
	html.WriteString(`
    </style>
</head>
<body>
    <script>
        // Función para toggle de visibilidad de elementos
        function toggleElementVisibility(targetId) {
            const targetElement = document.querySelector('[data-block-id="' + targetId + '"]');
            if (targetElement) {
                const currentDisplay = window.getComputedStyle(targetElement).display;
                targetElement.style.display = currentDisplay === 'none' ? '' : 'none';
            }
        }

        // Configurar event listeners para bloques interactivos
        document.addEventListener('DOMContentLoaded', function() {
            document.querySelectorAll('[data-toggle-target-id]').forEach(function(block) {
                block.style.cursor = 'pointer';
                block.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const targetId = block.getAttribute('data-toggle-target-id');
                    if (targetId) {
                        toggleElementVisibility(targetId);
                    }
                });
            });
        });
    </script>`)

	for _, block := range page.Blocks {
		html.WriteString(RenderBlockWithDB(block, db))
	}

	html.WriteString(`
</body>
</html>`)

	return html.String()
}

func RenderBlockWithDB(block Block, db *sql.DB) string {
	if block.Type == "component" && db != nil {
		return renderComponent(block, db)
	}
	return renderBlockInternal(block, db)
}

func renderComponent(block Block, db *sql.DB) string {
	// Si no hay DB o no hay ComponentId, mostrar placeholder
	if db == nil {
		fmt.Println("DB es nil, mostrando placeholder")
		return fmt.Sprintf(`<div style="background: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center; color: #666;">
			<p>🧩 %s (Componente)</p>
		</div>`, EscapeHTML(block.ComponentName))
	}

	if block.ComponentId == 0 {
		fmt.Println("ComponentId es 0, mostrando placeholder")
		return fmt.Sprintf(`<div style="background: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center; color: #666;">
			<p>🧩 %s (Sin ID)</p>
		</div>`, EscapeHTML(block.ComponentName))
	}

	// Cargar el componente desde la base de datos
	query := `SELECT blocks, styles FROM components WHERE id = $1`
	var blocksJSON, stylesJSON []byte
	err := db.QueryRow(query, block.ComponentId).Scan(&blocksJSON, &stylesJSON)
	if err != nil {
		fmt.Printf("Error al cargar componente %d: %v\n", block.ComponentId, err)
		// Si no se encuentra el componente, mostrar un placeholder
		return fmt.Sprintf(`<div style="background: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center; color: #666;">
			<p>Componente no encontrado: %s</p>
		</div>`, EscapeHTML(block.ComponentName))
	}

	// Decodificar los bloques del componente
	var componentBlocks []Block
	if err := json.Unmarshal(blocksJSON, &componentBlocks); err != nil {
		fmt.Printf("Error al decodificar bloques: %v\n", err)
		return fmt.Sprintf(`<div style="background: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center; color: #666;">
			<p>Error al cargar componente: %s</p>
		</div>`, EscapeHTML(block.ComponentName))
	}

	// Renderizar los bloques del componente envueltos en un contenedor con los atributos del componente
	var html strings.Builder
	blockClass := fmt.Sprintf("block-%d", block.ID)

	html.WriteString("<style>")
	html.WriteString(generateResponsiveCSS(block, blockClass))
	html.WriteString("</style>")

	html.WriteString(`<div class="`)
	html.WriteString(blockClass)
	html.WriteString(`" `)
	html.WriteString(getBlockDataAttributes(block))
	html.WriteString(` style="display: contents;">`)
	for _, childBlock := range componentBlocks {
		html.WriteString(RenderBlockWithDB(childBlock, db))
	}
	html.WriteString(`</div>`)

	return html.String()
}

// getBlockDataAttributes devuelve los atributos data-block-id y data-toggle-target-id
func getBlockDataAttributes(block Block) string {
	attrs := fmt.Sprintf(`data-block-id="%d"`, block.ID)
	if block.ToggleTargetId != 0 {
		attrs += fmt.Sprintf(` data-toggle-target-id="%d"`, block.ToggleTargetId)
	}
	return attrs
}

func renderBlockInternal(block Block, db *sql.DB) string {
	var html strings.Builder
	blockClass := fmt.Sprintf("block-%d", block.ID)

	// Para iconos
	if block.Type == "icon" {
		html.WriteString(`<style>`)
		if block.CustomCSS != "" {
			html.WriteString(`.`)
			html.WriteString(blockClass)
			html.WriteString(` { `)
			html.WriteString(block.CustomCSS)
			html.WriteString(` } `)
		}
		if block.PaddingTop != "" || block.PaddingRight != "" || block.PaddingBottom != "" || block.PaddingLeft != "" {
			paddingTop := block.PaddingTop
			if paddingTop == "" {
				paddingTop = "0"
			}
			paddingRight := block.PaddingRight
			if paddingRight == "" {
				paddingRight = "0"
			}
			paddingBottom := block.PaddingBottom
			if paddingBottom == "" {
				paddingBottom = "0"
			}
			paddingLeft := block.PaddingLeft
			if paddingLeft == "" {
				paddingLeft = "0"
			}
			html.WriteString(fmt.Sprintf(`.%s { padding: %spx %spx %spx %spx; } `, blockClass, paddingTop, paddingRight, paddingBottom, paddingLeft))
		}
		html.WriteString(`</style>`)
		html.WriteString(renderIconToString(block, blockClass))
		return html.String()
	}

	if block.CustomCSS != "" {
		html.WriteString(`<style>.`)
		html.WriteString(blockClass)
		html.WriteString(` { `)
		html.WriteString(block.CustomCSS)
		html.WriteString(` } `)
		html.WriteString(generateResponsiveCSS(block, blockClass))
		html.WriteString(`</style>`)
	} else {
		html.WriteString(`<style>`)
		html.WriteString(generateResponsiveCSS(block, blockClass))
		html.WriteString(`</style>`)
	}

	switch block.Type {
	case "container":
		return renderContainer(&html, block, blockClass, db)
	case "hero":
		renderHero(&html, block, blockClass)
	case "heading":
		renderHeading(&html, block, blockClass)
	case "paragraph":
		renderParagraph(&html, block, blockClass)
	case "image":
		renderImage(&html, block, blockClass)
	case "icon":
		renderIcon(&html, block, blockClass)
	case "button":
		renderButton(&html, block, blockClass)
	case "cards":
		renderCards(&html, block, blockClass)
	case "carousel":
		renderCarousel(&html, block, blockClass)
	case "divider":
		renderDivider(&html, block, blockClass)
	}

	return html.String()
}

func RenderBlock(block Block) string {
	return renderBlockInternal(block, nil)
}

func generateResponsiveCSS(block Block, blockClass string) string {
	var css strings.Builder

	// Desktop (base) - Colores base y padding
	css.WriteString(fmt.Sprintf(".%s { ", blockClass))
	if block.BackgroundColor != "" {
		css.WriteString(fmt.Sprintf("background: %s; ", block.BackgroundColor))
	}
	if block.TextColor != "" {
		css.WriteString(fmt.Sprintf("color: %s; ", block.TextColor))
	}
	// Padding desktop
	if block.PaddingTop != "" || block.PaddingRight != "" || block.PaddingBottom != "" || block.PaddingLeft != "" {
		paddingTop := block.PaddingTop
		if paddingTop == "" {
			paddingTop = "0"
		}
		paddingRight := block.PaddingRight
		if paddingRight == "" {
			paddingRight = "0"
		}
		paddingBottom := block.PaddingBottom
		if paddingBottom == "" {
			paddingBottom = "0"
		}
		paddingLeft := block.PaddingLeft
		if paddingLeft == "" {
			paddingLeft = "0"
		}
		css.WriteString(fmt.Sprintf("padding: %spx %spx %spx %spx; ", paddingTop, paddingRight, paddingBottom, paddingLeft))
	}
	css.WriteString("} ")

	// Dimensiones desktop
	desktopStyles := []string{}
	if block.WidthDesktop != "" && block.WidthDesktop != "auto" {
		desktopStyles = append(desktopStyles, fmt.Sprintf("width: %s", block.WidthDesktop))
	}
	if block.HeightDesktop != "" && block.HeightDesktop != "auto" {
		desktopStyles = append(desktopStyles, fmt.Sprintf("height: %s", block.HeightDesktop))
	}
	if block.Width != "" && block.Width != "auto" {
		desktopStyles = append(desktopStyles, fmt.Sprintf("width: %s", block.Width))
	}
	if block.Height != "" && block.Height != "auto" {
		desktopStyles = append(desktopStyles, fmt.Sprintf("height: %s", block.Height))
	}

	if len(desktopStyles) > 0 {
		css.WriteString(fmt.Sprintf(".%s { %s; } ", blockClass, strings.Join(desktopStyles, "; ")))
	}

	// Dirección para contenedores
	if block.Type == "container" {
		baseDirection := block.DirectionDesktop
		if baseDirection == "" {
			baseDirection = block.Direction
		}
		if baseDirection != "" {
			flexDir := "column"
			if baseDirection == "horizontal" {
				flexDir = "row"
			}
			css.WriteString(fmt.Sprintf(".%s { display: flex; flex-direction: %s; } ", blockClass, flexDir))
		} else {
			css.WriteString(fmt.Sprintf(".%s { display: flex; flex-direction: column; } ", blockClass))
		}
	}

	// Tablet (769px - 1024px)
	tabletStyles := []string{}
	if block.WidthTablet != "" && block.WidthTablet != "auto" {
		tabletStyles = append(tabletStyles, fmt.Sprintf("width: %s", block.WidthTablet))
	}
	if block.HeightTablet != "" && block.HeightTablet != "auto" {
		tabletStyles = append(tabletStyles, fmt.Sprintf("height: %s", block.HeightTablet))
	}

	if len(tabletStyles) > 0 {
		css.WriteString(fmt.Sprintf("@media (max-width: 1024px) and (min-width: 769px) { .%s { %s; } } ", blockClass, strings.Join(tabletStyles, "; ")))
	}

	// Dirección tablet para contenedores
	if block.Type == "container" && block.DirectionTablet != "" {
		flexDir := "column"
		if block.DirectionTablet == "horizontal" {
			flexDir = "row"
		}
		css.WriteString(fmt.Sprintf("@media (max-width: 1024px) and (min-width: 769px) { .%s { flex-direction: %s; } } ", blockClass, flexDir))
	}

	// Mobile (<= 768px)
	mobileStyles := []string{}
	if block.WidthMobile != "" && block.WidthMobile != "auto" {
		mobileStyles = append(mobileStyles, fmt.Sprintf("width: %s", block.WidthMobile))
	}
	if block.HeightMobile != "" && block.HeightMobile != "auto" {
		mobileStyles = append(mobileStyles, fmt.Sprintf("height: %s", block.HeightMobile))
	}

	if len(mobileStyles) > 0 {
		css.WriteString(fmt.Sprintf("@media (max-width: 768px) { .%s { %s; } } ", blockClass, strings.Join(mobileStyles, "; ")))
	}

	// Dirección móvil para contenedores
	if block.Type == "container" && block.DirectionMobile != "" {
		flexDir := "column"
		if block.DirectionMobile == "horizontal" {
			flexDir = "row"
		}
		css.WriteString(fmt.Sprintf("@media (max-width: 768px) { .%s { flex-direction: %s; } } ", blockClass, flexDir))
	}

	// Hidden para cada dispositivo con rangos específicos
	if block.HiddenDesktop {
		// Ocultar solo en desktop (pantallas grandes > 1024px)
		css.WriteString(fmt.Sprintf("@media (min-width: 1025px) { .%s { display: none !important; } } ", blockClass))
	}
	if block.HiddenTablet {
		// Ocultar solo en tablet (entre 769px y 1024px)
		css.WriteString(fmt.Sprintf("@media (max-width: 1024px) and (min-width: 769px) { .%s { display: none !important; } } ", blockClass))
	}
	if block.HiddenMobile {
		// Ocultar solo en móvil (<= 768px)
		css.WriteString(fmt.Sprintf("@media (max-width: 768px) { .%s { display: none !important; } } ", blockClass))
	}

	// Hover styles
	if block.HoverBackgroundColor != "" || block.HoverTextColor != "" {
		css.WriteString(fmt.Sprintf(".%s:hover { ", blockClass))
		if block.HoverBackgroundColor != "" {
			css.WriteString(fmt.Sprintf("background: %s !important; ", block.HoverBackgroundColor))
		}
		if block.HoverTextColor != "" {
			css.WriteString(fmt.Sprintf("color: %s !important; ", block.HoverTextColor))
		}
		css.WriteString("} ")
	}

	// Padding responsive - Tablet
	if block.PaddingTopTablet != "" || block.PaddingRightTablet != "" || block.PaddingBottomTablet != "" || block.PaddingLeftTablet != "" {
		paddingTop := block.PaddingTopTablet
		if paddingTop == "" {
			paddingTop = block.PaddingTop
			if paddingTop == "" {
				paddingTop = "0"
			}
		}
		paddingRight := block.PaddingRightTablet
		if paddingRight == "" {
			paddingRight = block.PaddingRight
			if paddingRight == "" {
				paddingRight = "0"
			}
		}
		paddingBottom := block.PaddingBottomTablet
		if paddingBottom == "" {
			paddingBottom = block.PaddingBottom
			if paddingBottom == "" {
				paddingBottom = "0"
			}
		}
		paddingLeft := block.PaddingLeftTablet
		if paddingLeft == "" {
			paddingLeft = block.PaddingLeft
			if paddingLeft == "" {
				paddingLeft = "0"
			}
		}
		css.WriteString(fmt.Sprintf("@media (max-width: 1024px) and (min-width: 769px) { .%s { padding: %spx %spx %spx %spx; } } ", blockClass, paddingTop, paddingRight, paddingBottom, paddingLeft))
	}

	// Padding responsive - Mobile
	if block.PaddingTopMobile != "" || block.PaddingRightMobile != "" || block.PaddingBottomMobile != "" || block.PaddingLeftMobile != "" {
		paddingTop := block.PaddingTopMobile
		if paddingTop == "" {
			paddingTop = block.PaddingTop
			if paddingTop == "" {
				paddingTop = "0"
			}
		}
		paddingRight := block.PaddingRightMobile
		if paddingRight == "" {
			paddingRight = block.PaddingRight
			if paddingRight == "" {
				paddingRight = "0"
			}
		}
		paddingBottom := block.PaddingBottomMobile
		if paddingBottom == "" {
			paddingBottom = block.PaddingBottom
			if paddingBottom == "" {
				paddingBottom = "0"
			}
		}
		paddingLeft := block.PaddingLeftMobile
		if paddingLeft == "" {
			paddingLeft = block.PaddingLeft
			if paddingLeft == "" {
				paddingLeft = "0"
			}
		}
		css.WriteString(fmt.Sprintf("@media (max-width: 768px) { .%s { padding: %spx %spx %spx %spx; } } ", blockClass, paddingTop, paddingRight, paddingBottom, paddingLeft))
	}

	return css.String()
}

func renderContainer(html *strings.Builder, block Block, blockClass string, db *sql.DB) string {
	var innerHTML strings.Builder

	for _, child := range block.Children {
		if db != nil {
			innerHTML.WriteString(RenderBlockWithDB(child, db))
		} else {
			innerHTML.WriteString(RenderBlock(child))
		}
	}

	html.WriteString(`<div class="`)
	html.WriteString(blockClass)
	html.WriteString(`" `)
	html.WriteString(getBlockDataAttributes(block))
	html.WriteString(` style="`)
	if block.Width != "" {
		html.WriteString(`width: `)
		html.WriteString(block.Width)
		html.WriteString(`; `)
	}
	if block.Height != "" {
		html.WriteString(`height: `)
		html.WriteString(block.Height)
		html.WriteString(`; `)
	}
	html.WriteString(`border-radius: 4px;">`)
	html.WriteString(innerHTML.String())
	html.WriteString(`</div>`)

	return html.String()
}

func renderHero(html *strings.Builder, block Block, blockClass string) {
	html.WriteString(`<div class="`)
	html.WriteString(blockClass)
	html.WriteString(`" `)
	html.WriteString(getBlockDataAttributes(block))
	html.WriteString(` style="`)
	if block.Width != "" {
		html.WriteString(`width: `)
		html.WriteString(block.Width)
		html.WriteString(`; `)
	}
	if block.Height != "" {
		html.WriteString(`height: `)
		html.WriteString(block.Height)
		html.WriteString(`; `)
	}
	html.WriteString(`border-radius: 4px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
        <h1 style="font-size: 48px; margin-bottom: 16px;">`)
	html.WriteString(EscapeHTML(block.Content))
	html.WriteString(`</h1>
        <p style="font-size: 18px;">`)
	html.WriteString(EscapeHTML(block.SubContent))
	html.WriteString(`</p>
    </div>`)
}

func renderHeading(html *strings.Builder, block Block, blockClass string) {
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
	html.WriteString(` class="`)
	html.WriteString(blockClass)
	html.WriteString(`" `)
	html.WriteString(getBlockDataAttributes(block))
	html.WriteString(` style="`)
	if block.Width != "" {
		html.WriteString(`width: `)
		html.WriteString(block.Width)
		html.WriteString(`; `)
	}
	if block.Height != "" {
		html.WriteString(`height: `)
		html.WriteString(block.Height)
		html.WriteString(`; `)
	}
	html.WriteString(`">`)
	html.WriteString(EscapeHTML(block.Content))
	html.WriteString(`</h`)
	html.WriteString(fmt.Sprintf("%d", level))
	html.WriteString(`>`)
}

func renderParagraph(html *strings.Builder, block Block, blockClass string) {
	html.WriteString(`<p class="`)
	html.WriteString(blockClass)
	html.WriteString(`" `)
	html.WriteString(getBlockDataAttributes(block))
	html.WriteString(` style="`)
	if block.Width != "" {
		html.WriteString(`width: `)
		html.WriteString(block.Width)
		html.WriteString(`; `)
	}
	if block.Height != "" {
		html.WriteString(`height: `)
		html.WriteString(block.Height)
		html.WriteString(`; `)
	}
	html.WriteString(`line-height: 1.6; margin-bottom: 16px;">`)
	html.WriteString(EscapeHTML(block.Content))
	html.WriteString(`</p>`)
}

func renderImage(html *strings.Builder, block Block, blockClass string) {
	html.WriteString(`<img class="`)
	html.WriteString(blockClass)
	html.WriteString(`" `)
	html.WriteString(getBlockDataAttributes(block))
	html.WriteString(` src="`)
	html.WriteString(block.Src)
	html.WriteString(`" alt="`)
	html.WriteString(EscapeHTML(block.Alt))
	html.WriteString(`" style="`)
	if block.Width != "" {
		html.WriteString(`width: `)
		html.WriteString(block.Width)
		html.WriteString(`; `)
	}
	if block.Height != "" {
		html.WriteString(`height: `)
		html.WriteString(block.Height)
		html.WriteString(`; `)
	}
	html.WriteString(`object-fit: cover;">`)
}

func renderIcon(html *strings.Builder, block Block, blockClass string) {
	fontSize := block.FontSize
	if fontSize == "" {
		fontSize = "48"
	}
	color := block.IconColor
	if color == "" {
		color = "#2563eb"
	}
	emoji := block.Emoji
	if emoji == "" {
		emoji = "😀"
	}
	html.WriteString(`<span class="`)
	html.WriteString(blockClass)
	html.WriteString(`" `)
	html.WriteString(getBlockDataAttributes(block))
	html.WriteString(` style="font-size: `)
	html.WriteString(fontSize)
	html.WriteString(`px; color: `)
	html.WriteString(color)
	html.WriteString(`; display: inline-block;">`)
	html.WriteString(emoji)
	html.WriteString(`</span>`)
}

func renderIconToString(block Block, blockClass string) string {
	fontSize := block.FontSize
	if fontSize == "" {
		fontSize = "48"
	}
	color := block.IconColor
	if color == "" {
		color = "#2563eb"
	}
	emoji := block.Emoji
	if emoji == "" {
		emoji = "😀"
	}
	return fmt.Sprintf(`<span class="%s" %s style="font-size: %spx; color: %s; display: inline-block;">%s</span>`, blockClass, getBlockDataAttributes(block), fontSize, color, emoji)
}

func renderButton(html *strings.Builder, block Block, blockClass string) {
	bgColor := block.BackgroundColor
	if bgColor == "" {
		bgColor = "transparent"
	}
	textColor := block.TextColor
	if textColor == "" {
		textColor = "#ffffff"
	}

	html.WriteString(`<a class="`)
	html.WriteString(blockClass)
	html.WriteString(`" `)
	html.WriteString(getBlockDataAttributes(block))
	html.WriteString(` href="`)
	html.WriteString(block.Link)
	html.WriteString(`" style="`)
	if block.Width != "" {
		html.WriteString(`width: `)
		html.WriteString(block.Width)
		html.WriteString(`; `)
	}
	if block.Height != "" {
		html.WriteString(`height: `)
		html.WriteString(block.Height)
		html.WriteString(`; `)
	}
	html.WriteString(`display: inline-block; background: `)
	html.WriteString(bgColor)
	html.WriteString(`; color: `)
	html.WriteString(textColor)
	html.WriteString(`; border: none; border-radius: 4px; text-decoration: none; font-weight: 500;">`)
	html.WriteString(EscapeHTML(block.Text))
	html.WriteString(`</a>`)
}

func renderCards(html *strings.Builder, block Block, blockClass string) {
	html.WriteString(`<div class="`)
	html.WriteString(blockClass)
	html.WriteString(` grid-3" `)
	html.WriteString(getBlockDataAttributes(block))
	html.WriteString(` style="`)
	if block.Width != "" {
		html.WriteString(`width: `)
		html.WriteString(block.Width)
		html.WriteString(`; `)
	}
	if block.Height != "" {
		html.WriteString(`height: `)
		html.WriteString(block.Height)
		html.WriteString(`; `)
	}
	html.WriteString(`">`)
	for _, item := range block.Items {
		html.WriteString(`<div class="card"><h3>`)
		html.WriteString(EscapeHTML(item["title"]))
		html.WriteString(`</h3><p>`)
		html.WriteString(EscapeHTML(item["description"]))
		html.WriteString(`</p></div>`)
	}
	html.WriteString(`</div>`)
}

func renderCarousel(html *strings.Builder, block Block, blockClass string) {
	html.WriteString(`<div class="`)
	html.WriteString(blockClass)
	html.WriteString(`" `)
	html.WriteString(getBlockDataAttributes(block))
	html.WriteString(` style="`)
	if block.Width != "" {
		html.WriteString(`width: `)
		html.WriteString(block.Width)
		html.WriteString(`; `)
	}
	if block.Height != "" {
		html.WriteString(`height: `)
		html.WriteString(block.Height)
		html.WriteString(`; `)
	}
	html.WriteString(`margin-bottom: 24px;"><style>.carousel-container { display: flex; gap: 16px; overflow-x: auto; padding: 16px 0; scroll-behavior: smooth; } .carousel-item { flex: 0 0 350px; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); } .carousel-item img { width: 100%; height: 250px; object-fit: cover; } .carousel-item-content { padding: 16px; } .carousel-item h3 { margin-bottom: 8px; font-size: 18px; color: #1f2937; } .carousel-item p { color: #6b7280; font-size: 14px; } .carousel-container::-webkit-scrollbar { height: 8px; } .carousel-container::-webkit-scrollbar-track { background: #f0f0f0; border-radius: 10px; } .carousel-container::-webkit-scrollbar-thumb { background: #2563eb; border-radius: 10px; } .carousel-container::-webkit-scrollbar-thumb:hover { background: #1e40af; }</style><div class="carousel-container">`)
	if len(block.Slides) > 0 {
		for _, slide := range block.Slides {
			html.WriteString(`<div class="carousel-item">`)
			if slide["image"] != "" {
				html.WriteString(`<img src="`)
				html.WriteString(slide["image"])
				html.WriteString(`" alt="`)
				html.WriteString(EscapeHTML(slide["title"]))
				html.WriteString(`">`)
			} else {
				html.WriteString(`<div style="width: 100%; height: 250px; background: #e5e7eb; display: flex; align-items: center; justify-content: center; color: #6b7280;">Sin imagen</div>`)
			}
			html.WriteString(`<div class="carousel-item-content"><h3>`)
			html.WriteString(EscapeHTML(slide["title"]))
			html.WriteString(`</h3>`)
			if slide["description"] != "" {
				html.WriteString(`<p>`)
				html.WriteString(EscapeHTML(slide["description"]))
				html.WriteString(`</p>`)
			}
			html.WriteString(`</div></div>`)
		}
	} else {
		html.WriteString(`<div style="padding: 40px; text-align: center; color: #6b7280;">Carrusel vacío</div>`)
	}
	html.WriteString(`</div></div>`)
}

func renderDivider(html *strings.Builder, block Block, blockClass string) {
	html.WriteString(`<hr class="`)
	html.WriteString(blockClass)
	html.WriteString(`" `)
	html.WriteString(getBlockDataAttributes(block))
	html.WriteString(` style="`)
	if block.Width != "" {
		html.WriteString(`width: `)
		html.WriteString(block.Width)
		html.WriteString(`; `)
	}
	if block.Height != "" {
		html.WriteString(`height: `)
		html.WriteString(block.Height)
		html.WriteString(`; `)
	}
	html.WriteString(`border: none; border-top: 1px solid `)
	if block.BorderColor != "" && block.BorderColor != "transparent" {
		html.WriteString(block.BorderColor)
	} else {
		html.WriteString(`transparent`)
	}
	html.WriteString(`; background: `)
	if block.BorderColor != "" && block.BorderColor != "transparent" {
		html.WriteString(block.BorderColor)
	} else {
		html.WriteString(`transparent`)
	}
	html.WriteString(`;">`)
}

func EscapeHTML(s string) string {
	s = strings.ReplaceAll(s, "&", "&amp;")
	s = strings.ReplaceAll(s, "<", "&lt;")
	s = strings.ReplaceAll(s, ">", "&gt;")
	s = strings.ReplaceAll(s, "\"", "&quot;")
	s = strings.ReplaceAll(s, "'", "&#39;")
	return s
}