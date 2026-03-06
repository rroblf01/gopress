package main

import (
	"fmt"
	"strings"
)

func BuildPageHTML(page PageData) string {
	var html strings.Builder

	html.WriteString(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>`)
	html.WriteString(EscapeHTML(page.Title))
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
<body>`)

	for _, block := range page.Blocks {
		html.WriteString(RenderBlock(block))
	}

	html.WriteString(`
</body>
</html>`)

	return html.String()
}

func RenderBlock(block Block) string {
	var html strings.Builder
	blockClass := fmt.Sprintf("block-%d", block.ID)

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
		return renderContainer(&html, block, blockClass)
	case "hero":
		renderHero(&html, block, blockClass)
	case "heading":
		renderHeading(&html, block, blockClass)
	case "paragraph":
		renderParagraph(&html, block, blockClass)
	case "image":
		renderImage(&html, block, blockClass)
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

func generateResponsiveCSS(block Block, blockClass string) string {
	var css strings.Builder

	// Desktop (base) - Colores base primero
	css.WriteString(fmt.Sprintf(".%s { ", blockClass))
	if block.BackgroundColor != "" {
		css.WriteString(fmt.Sprintf("background: %s; ", block.BackgroundColor))
	}
	if block.TextColor != "" {
		css.WriteString(fmt.Sprintf("color: %s; ", block.TextColor))
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
			css.WriteString(fmt.Sprintf(".%s { display: flex; flex-direction: %s; gap: 12px; } ", blockClass, flexDir))
		} else {
			css.WriteString(fmt.Sprintf(".%s { display: flex; flex-direction: column; gap: 12px; } ", blockClass))
		}
	}

	// Tablet - dimensiones
	tabletStyles := []string{}
	if block.WidthTablet != "" && block.WidthTablet != "auto" {
		tabletStyles = append(tabletStyles, fmt.Sprintf("width: %s", block.WidthTablet))
	}
	if block.HeightTablet != "" && block.HeightTablet != "auto" {
		tabletStyles = append(tabletStyles, fmt.Sprintf("height: %s", block.HeightTablet))
	}

	if len(tabletStyles) > 0 {
		css.WriteString(fmt.Sprintf("@media (min-width: 769px) and (max-width: 1024px) { .%s { %s; } } ", blockClass, strings.Join(tabletStyles, "; ")))
	}

	// Dirección tablet para contenedores
	if block.Type == "container" && block.DirectionTablet != "" {
		flexDir := "column"
		if block.DirectionTablet == "horizontal" {
			flexDir = "row"
		}
		css.WriteString(fmt.Sprintf("@media (min-width: 769px) and (max-width: 1024px) { .%s { flex-direction: %s; } } ", blockClass, flexDir))
	}

	// Mobile - dimensiones
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
		css.WriteString(fmt.Sprintf("@media (min-width: 769px) and (max-width: 1024px) { .%s { display: none !important; } } ", blockClass))
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

	return css.String()
}

func renderContainer(html *strings.Builder, block Block, blockClass string) string {
	var innerHTML strings.Builder

	for _, child := range block.Children {
		innerHTML.WriteString(RenderBlock(child))
	}

	html.WriteString(`<div class="`)
	html.WriteString(blockClass)
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
	html.WriteString(`padding: 16px; border-radius: 4px; margin: 24px 0;">`)
	html.WriteString(innerHTML.String())
	html.WriteString(`</div>`)

	return html.String()
}

func renderHero(html *strings.Builder, block Block, blockClass string) {
	html.WriteString(`<div class="`)
	html.WriteString(blockClass)
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
	html.WriteString(`padding: 60px 40px; border-radius: 4px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; margin: 24px 0;">
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
	html.WriteString(`" class="`)
	html.WriteString(blockClass)
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
	html.WriteString(`">`)
	html.WriteString(EscapeHTML(block.Content))
	html.WriteString(`</h`)
	html.WriteString(fmt.Sprintf("%d", level))
	html.WriteString(`>`)
}

func renderParagraph(html *strings.Builder, block Block, blockClass string) {
	html.WriteString(`<p class="`)
	html.WriteString(blockClass)
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
	html.WriteString(`line-height: 1.6; margin-bottom: 16px;">`)
	html.WriteString(EscapeHTML(block.Content))
	html.WriteString(`</p>`)
}

func renderImage(html *strings.Builder, block Block, blockClass string) {
	html.WriteString(`<img class="`)
	html.WriteString(blockClass)
	html.WriteString(`" src="`)
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
	html.WriteString(`" href="`)
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
	html.WriteString(`display: inline-block; padding: 12px 24px; background: `)
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
	html.WriteString(` grid-3" style="`)
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