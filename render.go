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
        }
        .container {
            max-width: `)
	html.WriteString(page.Styles.MaxWidth)
	html.WriteString(`px;
            margin: 0 auto;
            padding: `)
	html.WriteString(page.Styles.Padding)
	html.WriteString(`px;
        }
        h1 { font-size: 36px; margin-bottom: 32px; }
        h2 { font-size: 28px; margin: 24px 0 16px; }
        h3 { font-size: 24px; margin: 20px 0 12px; }
        h4 { font-size: 20px; margin: 16px 0 8px; }
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
<body>
    <div class="container">
        <h1>`)
	html.WriteString(EscapeHTML(page.Title))
	html.WriteString(`</h1>`)

	for _, block := range page.Blocks {
		html.WriteString(RenderBlock(block))
	}

	html.WriteString(`
    </div>
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
		html.WriteString(` }</style>`)
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

func renderContainer(html *strings.Builder, block Block, blockClass string) string {
	var innerHTML strings.Builder

	for _, child := range block.Children {
		innerHTML.WriteString(RenderBlock(child))
	}

	flexDirection := "column"
	if block.Direction == "horizontal" {
		flexDirection = "row"
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
	html.WriteString(`background: `)
	html.WriteString(block.BackgroundColor)
	html.WriteString(`; color: `)
	html.WriteString(block.TextColor)
	html.WriteString(`; padding: 16px; border-radius: 4px; margin: 24px 0; display: flex; flex-direction: `)
	html.WriteString(flexDirection)
	html.WriteString(`; gap: 12px;">`)
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
	html.WriteString(`background: `)
	html.WriteString(block.BackgroundColor)
	html.WriteString(`; color: `)
	html.WriteString(block.TextColor)
	html.WriteString(`; padding: 60px 40px; border-radius: 4px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; margin: 24px 0;">
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
	html.WriteString(block.BackgroundColor)
	html.WriteString(`; color: `)
	html.WriteString(block.TextColor)
	html.WriteString(`; border-radius: 4px; text-decoration: none; font-weight: 500;">`)
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
	html.WriteString(`" style="border-top: 2px solid `)
	html.WriteString(block.BorderColor)
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