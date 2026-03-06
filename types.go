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