package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/MrFruchard/pulse/backend/internal/handlers"
	"github.com/MrFruchard/pulse/backend/internal/services"
	"github.com/MrFruchard/pulse/backend/internal/testutil"
)

var jwtSecret = "test-secret-key-minimum-32-characters!!"

func body(t *testing.T, v any) *bytes.Buffer {
	t.Helper()
	b, _ := json.Marshal(v)
	return bytes.NewBuffer(b)
}

func do(handler http.Handler, method, path string, b *bytes.Buffer) *httptest.ResponseRecorder {
	req := httptest.NewRequest(method, path, b)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)
	return w
}

func parseJSON(t *testing.T, w *httptest.ResponseRecorder) map[string]any {
	t.Helper()
	var result map[string]any
	json.NewDecoder(w.Body).Decode(&result)
	return result
}

// TF-01 : Inscription avec données valides → 201
func TestRegister_Valid(t *testing.T) {
	db := testutil.SetupDB(t)
	jwt := services.NewJWTService(jwtSecret)
	handler := handlers.RegisterHandler(db, jwt)

	w := do(handler, "POST", "/api/auth/register", body(t, map[string]string{
		"email": "test@pulse.io", "pseudo": "testuser", "password": "password123",
	}))

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d — body: %s", w.Code, w.Body.String())
	}
	resp := parseJSON(t, w)
	if resp["user"] == nil {
		t.Fatal("expected user in response")
	}
}

// TF-02 : Inscription avec email déjà existant → 409
func TestRegister_DuplicateEmail(t *testing.T) {
	db := testutil.SetupDB(t)
	jwt := services.NewJWTService(jwtSecret)
	handler := handlers.RegisterHandler(db, jwt)

	do(handler, "POST", "/", body(t, map[string]string{
		"email": "dup@pulse.io", "pseudo": "user1", "password": "password123",
	}))

	w := do(handler, "POST", "/", body(t, map[string]string{
		"email": "dup@pulse.io", "pseudo": "user2", "password": "password123",
	}))

	if w.Code != http.StatusConflict {
		t.Fatalf("expected 409, got %d", w.Code)
	}
}

// TF-03 : Inscription avec pseudo déjà existant → 409
func TestRegister_DuplicatePseudo(t *testing.T) {
	db := testutil.SetupDB(t)
	jwt := services.NewJWTService(jwtSecret)
	handler := handlers.RegisterHandler(db, jwt)

	do(handler, "POST", "/", body(t, map[string]string{
		"email": "a@pulse.io", "pseudo": "samepseudo", "password": "password123",
	}))

	w := do(handler, "POST", "/", body(t, map[string]string{
		"email": "b@pulse.io", "pseudo": "samepseudo", "password": "password123",
	}))

	if w.Code != http.StatusConflict {
		t.Fatalf("expected 409, got %d", w.Code)
	}
}

// TF-04 : Connexion avec credentials valides → 200 + cookie
func TestLogin_Valid(t *testing.T) {
	db := testutil.SetupDB(t)
	jwt := services.NewJWTService(jwtSecret)

	// Créer le compte
	do(handlers.RegisterHandler(db, jwt), "POST", "/", body(t, map[string]string{
		"email": "login@pulse.io", "pseudo": "loginuser", "password": "password123",
	}))

	w := do(handlers.LoginHandler(db, jwt), "POST", "/", body(t, map[string]string{
		"email": "login@pulse.io", "password": "password123",
	}))

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d — body: %s", w.Code, w.Body.String())
	}

	// Vérifier le cookie JWT
	found := false
	for _, c := range w.Result().Cookies() {
		if c.Name == "token" && c.HttpOnly {
			found = true
		}
	}
	if !found {
		t.Fatal("expected httpOnly token cookie in response")
	}
}

// TF-05 & TF-06 : Mauvais mot de passe ou email inconnu → 401 + message générique
func TestLogin_InvalidCredentials(t *testing.T) {
	db := testutil.SetupDB(t)
	jwt := services.NewJWTService(jwtSecret)

	cases := []map[string]string{
		{"email": "nobody@pulse.io", "password": "password123"},
		{"email": "login2@pulse.io", "password": "wrongpassword"},
	}

	// Créer un compte pour le 2ème cas
	do(handlers.RegisterHandler(db, jwt), "POST", "/", body(t, map[string]string{
		"email": "login2@pulse.io", "pseudo": "user2", "password": "password123",
	}))

	for _, tc := range cases {
		w := do(handlers.LoginHandler(db, jwt), "POST", "/", body(t, tc))
		if w.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401 for %v, got %d", tc, w.Code)
		}
		resp := parseJSON(t, w)
		if resp["error"] != "invalid credentials" {
			t.Fatalf("expected generic error message, got: %v", resp["error"])
		}
	}
}

// TF-07 : Compte suspendu → 403
func TestLogin_SuspendedAccount(t *testing.T) {
	db := testutil.SetupDB(t)
	jwt := services.NewJWTService(jwtSecret)

	do(handlers.RegisterHandler(db, jwt), "POST", "/", body(t, map[string]string{
		"email": "susp@pulse.io", "pseudo": "suspended", "password": "password123",
	}))
	db.Exec(`UPDATE users SET status = 'suspended' WHERE email = 'susp@pulse.io'`)

	w := do(handlers.LoginHandler(db, jwt), "POST", "/", body(t, map[string]string{
		"email": "susp@pulse.io", "password": "password123",
	}))

	if w.Code != http.StatusForbidden {
		t.Fatalf("expected 403 for suspended account, got %d", w.Code)
	}
}

// Validation : email invalide → 422
func TestRegister_InvalidEmail(t *testing.T) {
	db := testutil.SetupDB(t)
	jwt := services.NewJWTService(jwtSecret)

	w := do(handlers.RegisterHandler(db, jwt), "POST", "/", body(t, map[string]string{
		"email": "notanemail", "pseudo": "user", "password": "password123",
	}))

	if w.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d", w.Code)
	}
}

// Validation : mot de passe trop court → 422
func TestRegister_ShortPassword(t *testing.T) {
	db := testutil.SetupDB(t)
	jwt := services.NewJWTService(jwtSecret)

	w := do(handlers.RegisterHandler(db, jwt), "POST", "/", body(t, map[string]string{
		"email": "x@pulse.io", "pseudo": "user", "password": "short",
	}))

	if w.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d", w.Code)
	}
}
