package main

import (
	"strings"
)

// AssertContains verifica que un string contiene otro
func AssertContains(t testingT, s, substr string, msg string) {
	if !strings.Contains(s, substr) {
		t.Errorf("%s: expected to contain '%s', got '%s'", msg, substr, s)
	}
}

// AssertNotContains verifica que un string no contiene otro
func AssertNotContains(t testingT, s, substr string, msg string) {
	if strings.Contains(s, substr) {
		t.Errorf("%s: expected not to contain '%s', got '%s'", msg, substr, s)
	}
}

// AssertEquals verifica que dos valores son iguales
func AssertEquals(t testingT, expected, actual interface{}, msg string) {
	if expected != actual {
		t.Errorf("%s: expected '%v', got '%v'", msg, expected, actual)
	}
}

// AssertTrue verifica que una condición es verdadera
func AssertTrue(t testingT, condition bool, msg string) {
	if !condition {
		t.Errorf("%s: expected true, got false", msg)
	}
}

// AssertFalse verifica que una condición es falsa
func AssertFalse(t testingT, condition bool, msg string) {
	if condition {
		t.Errorf("%s: expected false, got true", msg)
	}
}

// AssertLen verifica la longitud de un slice
func AssertLen(t testingT, slice interface{}, length int, msg string) {
	var actualLen int
	switch s := slice.(type) {
	case []Block:
		actualLen = len(s)
	case []string:
		actualLen = len(s)
	case []int:
		actualLen = len(s)
	default:
		t.Errorf("%s: unsupported type for length check", msg)
		return
	}
	if actualLen != length {
		t.Errorf("%s: expected length %d, got %d", msg, length, actualLen)
	}
}

// testingT es una interfaz común para *testing.T y *testing.B
type testingT interface {
	Errorf(format string, args ...interface{})
	Fatalf(format string, args ...interface{})
	Helper()
}

// TestBlockBuilder es un builder para crear bloques de test
type TestBlockBuilder struct {
	block Block
}

// NewBlockBuilder crea un nuevo builder de bloques
func NewBlockBuilder(blockType string) *TestBlockBuilder {
	return &TestBlockBuilder{
		block: Block{
			ID:   1,
			Type: blockType,
		},
	}
}

// WithID establece el ID del bloque
func (b *TestBlockBuilder) WithID(id int64) *TestBlockBuilder {
	b.block.ID = id
	return b
}

// WithContent establece el contenido del bloque
func (b *TestBlockBuilder) WithContent(content string) *TestBlockBuilder {
	b.block.Content = content
	return b
}

// WithChildren establece los hijos del bloque
func (b *TestBlockBuilder) WithChildren(children ...Block) *TestBlockBuilder {
	b.block.Children = children
	return b
}

// WithDirection establece la dirección del bloque
func (b *TestBlockBuilder) WithDirection(direction string) *TestBlockBuilder {
	b.block.Direction = direction
	return b
}

// WithDirectionDesktop establece la dirección desktop
func (b *TestBlockBuilder) WithDirectionDesktop(direction string) *TestBlockBuilder {
	b.block.DirectionDesktop = direction
	return b
}

// WithDirectionTablet establece la dirección tablet
func (b *TestBlockBuilder) WithDirectionTablet(direction string) *TestBlockBuilder {
	b.block.DirectionTablet = direction
	return b
}

// WithDirectionMobile establece la dirección mobile
func (b *TestBlockBuilder) WithDirectionMobile(direction string) *TestBlockBuilder {
	b.block.DirectionMobile = direction
	return b
}

// WithGap establece el gap del bloque
func (b *TestBlockBuilder) WithGap(gap string) *TestBlockBuilder {
	b.block.Gap = gap
	return b
}

// WithGapDesktop establece el gap desktop
func (b *TestBlockBuilder) WithGapDesktop(gap string) *TestBlockBuilder {
	b.block.GapDesktop = gap
	return b
}

// WithGapTablet establece el gap tablet
func (b *TestBlockBuilder) WithGapTablet(gap string) *TestBlockBuilder {
	b.block.GapTablet = gap
	return b
}

// WithGapMobile establece el gap mobile
func (b *TestBlockBuilder) WithGapMobile(gap string) *TestBlockBuilder {
	b.block.GapMobile = gap
	return b
}

// WithJustifyContent establece justify-content
func (b *TestBlockBuilder) WithJustifyContent(jc string) *TestBlockBuilder {
	b.block.JustifyContent = jc
	return b
}

// WithAlignItems establece align-items
func (b *TestBlockBuilder) WithAlignItems(ai string) *TestBlockBuilder {
	b.block.AlignItems = ai
	return b
}

// WithGridTemplateColumns establece grid-template-columns
func (b *TestBlockBuilder) WithGridTemplateColumns(gtc string) *TestBlockBuilder {
	b.block.GridTemplateColumns = gtc
	return b
}

// WithHiddenDesktop establece hiddenDesktop
func (b *TestBlockBuilder) WithHiddenDesktop(hidden bool) *TestBlockBuilder {
	b.block.HiddenDesktop = hidden
	return b
}

// WithHiddenTablet establece hiddenTablet
func (b *TestBlockBuilder) WithHiddenTablet(hidden bool) *TestBlockBuilder {
	b.block.HiddenTablet = hidden
	return b
}

// WithHiddenMobile establece hiddenMobile
func (b *TestBlockBuilder) WithHiddenMobile(hidden bool) *TestBlockBuilder {
	b.block.HiddenMobile = hidden
	return b
}

// Build devuelve el bloque construido
func (b *TestBlockBuilder) Build() Block {
	return b.block
}

// TestPageBuilder es un builder para crear páginas de test
type TestPageBuilder struct {
	page PageData
}

// NewPageBuilder crea un nuevo builder de páginas
func NewPageBuilder(slug, title string) *TestPageBuilder {
	return &TestPageBuilder{
		page: PageData{
			Slug:  slug,
			Title: title,
		},
	}
}

// WithBlocks establece los bloques de la página
func (b *TestPageBuilder) WithBlocks(blocks ...Block) *TestPageBuilder {
	b.page.Blocks = blocks
	return b
}

// WithStyles establece los estilos de la página
func (b *TestPageBuilder) WithStyles(styles Styles) *TestPageBuilder {
	b.page.Styles = styles
	return b
}

// Build devuelve la página construida
func (b *TestPageBuilder) Build() PageData {
	return b.page
}
