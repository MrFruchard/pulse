package handlers

import (
	"log/slog"
	"net/http"

	"github.com/MrFruchard/pulse/backend/internal/storage"
)

// magicBytes valide le type réel du fichier (pas l'extension)
var allowedMagic = []struct {
	mime   string
	ext    string
	header []byte
}{
	{"image/jpeg", ".jpg", []byte{0xFF, 0xD8, 0xFF}},
	{"image/png",  ".png", []byte{0x89, 0x50, 0x4E, 0x47}},
	{"image/gif",  ".gif", []byte{0x47, 0x49, 0x46, 0x38}},
}

func detectImage(data []byte) (ext string, ok bool) {
	for _, m := range allowedMagic {
		if len(data) >= len(m.header) {
			match := true
			for i, b := range m.header {
				if data[i] != b {
					match = false
					break
				}
			}
			if match {
				return m.ext, true
			}
		}
	}
	return "", false
}

func UploadHandler(driver storage.Driver, maxSizeMB int64) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Limite taille lecture body
		r.Body = http.MaxBytesReader(w, r.Body, maxSizeMB<<20)

		if err := r.ParseMultipartForm(maxSizeMB << 20); err != nil {
			respondError(w, http.StatusRequestEntityTooLarge, "file too large")
			return
		}

		file, _, err := r.FormFile("file")
		if err != nil {
			respondError(w, http.StatusBadRequest, "file field is required")
			return
		}
		defer file.Close()

		// Lire les données
		data := make([]byte, maxSizeMB<<20)
		n, err := file.Read(data)
		if err != nil && n == 0 {
			respondError(w, http.StatusBadRequest, "empty file")
			return
		}
		data = data[:n]

		// Valider le type par magic bytes
		ext, ok := detectImage(data)
		if !ok {
			respondError(w, http.StatusUnprocessableEntity, "file must be JPEG, PNG or GIF")
			return
		}

		url, err := driver.Save(data, ext)
		if err != nil {
			slog.Error("upload: save file", "error", err)
			respondError(w, http.StatusInternalServerError, "internal error")
			return
		}

		slog.Info("file uploaded", "url", url)
		respond(w, http.StatusCreated, map[string]string{"url": url})
	}
}
