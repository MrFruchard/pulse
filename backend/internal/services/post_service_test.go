package services_test

import (
	"strings"
	"testing"

	"github.com/MrFruchard/pulse/backend/internal/services"
)

// TU-14 : ValidatePostContent accepte un contenu de 500 chars
func TestValidatePostContent_Valid(t *testing.T) {
	content := strings.Repeat("a", 500)
	if err := services.ValidatePostContent(content); err != nil {
		t.Fatalf("expected no error for 500 chars, got: %v", err)
	}
}

// TU-15 : ValidatePostContent rejette un contenu de 501 chars
func TestValidatePostContent_TooLong(t *testing.T) {
	content := strings.Repeat("a", 501)
	if err := services.ValidatePostContent(content); err == nil {
		t.Fatal("expected error for 501 chars")
	}
}

// TU-16 : ValidatePostContent rejette un contenu vide
func TestValidatePostContent_Empty(t *testing.T) {
	if err := services.ValidatePostContent(""); err == nil {
		t.Fatal("expected error for empty content")
	}
}

// ValidatePostContent rejette un contenu composé uniquement d'espaces
func TestValidatePostContent_Whitespace(t *testing.T) {
	if err := services.ValidatePostContent("   "); err == nil {
		t.Fatal("expected error for whitespace-only content")
	}
}

// ValidatePostContent accepte un contenu normal
func TestValidatePostContent_Normal(t *testing.T) {
	if err := services.ValidatePostContent("Voici ma question du jour !"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}
