package services_test

import (
	"strings"
	"testing"

	"github.com/MrFruchard/pulse/backend/internal/services"
)

// TU-01 : HashPassword retourne un hash non vide différent de l'entrée
func TestHashPassword_Valid(t *testing.T) {
	hash, err := services.HashPassword("monMotDePasse123")
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if hash == "" {
		t.Fatal("expected non-empty hash")
	}
	if hash == "monMotDePasse123" {
		t.Fatal("hash must differ from input")
	}
	if !strings.HasPrefix(hash, "$2a$") {
		t.Fatalf("expected bcrypt hash, got: %s", hash[:10])
	}
}

// TU-02 : HashPassword retourne une erreur pour une chaîne vide
func TestHashPassword_Empty(t *testing.T) {
	_, err := services.HashPassword("")
	if err == nil {
		t.Fatal("expected error for empty password")
	}
}

// TU-03 : ComparePassword retourne true avec le bon mot de passe
func TestComparePassword_Correct(t *testing.T) {
	hash, _ := services.HashPassword("secret1234")
	if !services.ComparePassword(hash, "secret1234") {
		t.Fatal("expected ComparePassword to return true")
	}
}

// TU-04 : ComparePassword retourne false avec un mauvais mot de passe
func TestComparePassword_Wrong(t *testing.T) {
	hash, _ := services.HashPassword("secret1234")
	if services.ComparePassword(hash, "wrongpassword") {
		t.Fatal("expected ComparePassword to return false")
	}
}

// Deux appels sur le même mot de passe produisent des hashes différents (salt)
func TestHashPassword_Unique(t *testing.T) {
	h1, _ := services.HashPassword("samepassword")
	h2, _ := services.HashPassword("samepassword")
	if h1 == h2 {
		t.Fatal("same password should produce different hashes (salt)")
	}
}
