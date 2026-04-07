package services

import (
	"fmt"
	"strings"
)

const maxPostLength = 500

func ValidatePostContent(content string) error {
	content = strings.TrimSpace(content)
	if content == "" {
		return fmt.Errorf("content is required")
	}
	if len([]rune(content)) > maxPostLength {
		return fmt.Errorf("content must be %d characters or less", maxPostLength)
	}
	return nil
}
