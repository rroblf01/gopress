package main

type Block struct {
	ID              int64                 `json:"id"`
	Type            string                `json:"type"`
	Content         string                `json:"content"`
	SubContent      string                `json:"subContent"`
	Level           interface{}           `json:"level"`
	Src             string                `json:"src"`
	Alt             string                `json:"alt"`
	Width           string                `json:"width"`
	Height          string                `json:"height"`
	WidthMobile     string                `json:"widthMobile"`
	HeightMobile    string                `json:"heightMobile"`
	WidthTablet     string                `json:"widthTablet"`
	HeightTablet    string                `json:"heightTablet"`
	WidthDesktop    string                `json:"widthDesktop"`
	HeightDesktop   string                `json:"heightDesktop"`
	Text            string                `json:"text"`
	Link            string                `json:"link"`
	Items           []map[string]string   `json:"items"`
	Slides          []map[string]string   `json:"slides"`
	Images          []string              `json:"images"`
	BorderColor     string                `json:"borderColor"`
	BackgroundColor string                `json:"backgroundColor"`
	TextColor       string                `json:"textColor"`
	CustomCSS       string                `json:"customCSS"`
	Children        []Block               `json:"children"`
	Direction       string                `json:"direction"`
	DirectionMobile string                `json:"directionMobile"`
	DirectionTablet string                `json:"directionTablet"`
	DirectionDesktop string               `json:"directionDesktop"`
	HiddenMobile    bool                  `json:"hiddenMobile"`
	HiddenTablet    bool                  `json:"hiddenTablet"`
	HiddenDesktop   bool                  `json:"hiddenDesktop"`
}

type Styles struct {
	PrimaryColor    string `json:"primaryColor"`
	BackgroundColor string `json:"backgroundColor"`
	TextColor       string `json:"textColor"`
	FontFamily      string `json:"fontFamily"`
	MaxWidth        string `json:"maxWidth"`
	Padding         string `json:"padding"`
	GlobalCSS       string `json:"globalCSS"`
}

type PageData struct {
	Title     string  `json:"title"`
	Blocks    []Block `json:"blocks"`
	Styles    Styles  `json:"styles"`
	CreatedAt string  `json:"createdAt"`
}