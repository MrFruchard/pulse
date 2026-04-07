package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/MrFruchard/pulse/backend/internal/middleware"
	"github.com/MrFruchard/pulse/backend/internal/models"
	"github.com/MrFruchard/pulse/backend/internal/services"
)

var testSecret = "test-secret-key-minimum-32-characters!!"

func okHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
}

func makeRequest(cookie *http.Cookie) *http.Request {
	req := httptest.NewRequest("GET", "/protected", nil)
	if cookie != nil {
		req.AddCookie(cookie)
	}
	return req
}

// JWT manquant → 401
func TestJWTMiddleware_NoCookie(t *testing.T) {
	jwtSvc := services.NewJWTService(testSecret)
	handler := middleware.JWT(jwtSvc)(http.HandlerFunc(okHandler))

	w := httptest.NewRecorder()
	handler.ServeHTTP(w, makeRequest(nil))

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

// JWT valide → 200
func TestJWTMiddleware_ValidToken(t *testing.T) {
	jwtSvc := services.NewJWTService(testSecret)
	token, _ := jwtSvc.Generate(uuid.New(), models.RoleUser)

	handler := middleware.JWT(jwtSvc)(http.HandlerFunc(okHandler))
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, makeRequest(&http.Cookie{Name: "token", Value: token}))

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
}

// JWT expiré → 401
func TestJWTMiddleware_ExpiredToken(t *testing.T) {
	jwtSvc := services.NewJWTService(testSecret)

	claims := services.Claims{
		UserID: uuid.New(),
		Role:   models.RoleUser,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(-1 * time.Hour)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, _ := token.SignedString([]byte(testSecret))

	handler := middleware.JWT(jwtSvc)(http.HandlerFunc(okHandler))
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, makeRequest(&http.Cookie{Name: "token", Value: signed}))

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for expired token, got %d", w.Code)
	}
}

// JWT falsifié → 401
func TestJWTMiddleware_TamperedToken(t *testing.T) {
	jwtSvc := services.NewJWTService(testSecret)
	token, _ := jwtSvc.Generate(uuid.New(), models.RoleUser)
	tampered := token[:len(token)-5] + "XXXXX"

	handler := middleware.JWT(jwtSvc)(http.HandlerFunc(okHandler))
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, makeRequest(&http.Cookie{Name: "token", Value: tampered}))

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for tampered token, got %d", w.Code)
	}
}

// RBAC : rôle insuffisant → 403
func TestRBACMiddleware_Forbidden(t *testing.T) {
	jwtSvc := services.NewJWTService(testSecret)
	token, _ := jwtSvc.Generate(uuid.New(), models.RoleUser)

	handler := middleware.JWT(jwtSvc)(
		middleware.RequireRole(models.RoleAdmin)(
			http.HandlerFunc(okHandler),
		),
	)

	req := makeRequest(&http.Cookie{Name: "token", Value: token})
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Fatalf("expected 403 for user accessing admin route, got %d", w.Code)
	}
}

// RBAC : rôle admin → 200
func TestRBACMiddleware_AdminAllowed(t *testing.T) {
	jwtSvc := services.NewJWTService(testSecret)
	token, _ := jwtSvc.Generate(uuid.New(), models.RoleAdmin)

	handler := middleware.JWT(jwtSvc)(
		middleware.RequireRole(models.RoleAdmin)(
			http.HandlerFunc(okHandler),
		),
	)

	req := makeRequest(&http.Cookie{Name: "token", Value: token})
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 for admin, got %d", w.Code)
	}
}
