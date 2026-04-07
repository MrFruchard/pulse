package storage

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/google/uuid"
)

// Driver définit l'interface de stockage — local aujourd'hui, S3 demain
type Driver interface {
	Save(data []byte, ext string) (url string, err error)
}

// LocalDriver stocke les fichiers sur le disque local
type LocalDriver struct {
	dir     string // chemin absolu du dossier uploads
	baseURL string // préfixe URL retourné au client (ex: /uploads)
}

func NewLocalDriver(dir string, baseURL string) (*LocalDriver, error) {
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("storage: cannot create uploads dir %s: %w", dir, err)
	}
	return &LocalDriver{dir: dir, baseURL: baseURL}, nil
}

func (d *LocalDriver) Save(data []byte, ext string) (string, error) {
	filename := uuid.New().String() + ext
	path := filepath.Join(d.dir, filename)

	if err := os.WriteFile(path, data, 0644); err != nil {
		return "", fmt.Errorf("storage: write file: %w", err)
	}

	return d.baseURL + "/" + filename, nil
}
