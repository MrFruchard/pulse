package services_test

import (
	"strings"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/MrFruchard/pulse/backend/internal/models"
	"github.com/MrFruchard/pulse/backend/internal/services"
)

func newJWT(t *testing.T) *services.JWTService {
	t.Helper()
	return services.NewJWTService("test-secret-key-minimum-32-characters!!")
}

// TU-05 : GenerateJWT retourne un token non vide
func TestJWT_Generate(t *testing.T) {
	svc := newJWT(t)
	userID := uuid.New()

	token, err := svc.Generate(userID, models.RoleUser)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if token == "" {
		t.Fatal("expected non-empty token")
	}
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		t.Fatalf("expected JWT with 3 parts, got %d", len(parts))
	}
}

// TU-06 : ValidateJWT extrait correctement les claims
func TestJWT_Validate_Valid(t *testing.T) {
	svc := newJWT(t)
	userID := uuid.New()

	token, _ := svc.Generate(userID, models.RoleAdmin)
	claims, err := svc.Validate(token)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if claims.UserID != userID {
		t.Errorf("expected userID %v, got %v", userID, claims.UserID)
	}
	if claims.Role != models.RoleAdmin {
		t.Errorf("expected role admin, got %v", claims.Role)
	}
}

// TU-07 : ValidateJWT retourne une erreur pour un token expiré
func TestJWT_Validate_Expired(t *testing.T) {
	secret := "test-secret-key-minimum-32-characters!!"
	svc := services.NewJWTService(secret)

	// Créer un token déjà expiré
	claims := services.Claims{
		UserID: uuid.New(),
		Role:   models.RoleUser,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(-1 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now().Add(-2 * time.Hour)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, _ := token.SignedString([]byte(secret))

	_, err := svc.Validate(signed)
	if err == nil {
		t.Fatal("expected error for expired token")
	}
}

// TU-08 : ValidateJWT retourne une erreur pour un token falsifié
func TestJWT_Validate_Tampered(t *testing.T) {
	svc := newJWT(t)
	userID := uuid.New()

	token, _ := svc.Generate(userID, models.RoleUser)
	tampered := token[:len(token)-5] + "XXXXX"

	_, err := svc.Validate(tampered)
	if err == nil {
		t.Fatal("expected error for tampered token")
	}
}

// ValidateJWT retourne une erreur pour un token signé avec un autre secret
func TestJWT_Validate_WrongSecret(t *testing.T) {
	svc1 := services.NewJWTService("secret-one-minimum-32-characters!!!")
	svc2 := services.NewJWTService("secret-two-minimum-32-characters!!!")

	token, _ := svc1.Generate(uuid.New(), models.RoleUser)
	_, err := svc2.Validate(token)
	if err == nil {
		t.Fatal("expected error for token signed with different secret")
	}
}
