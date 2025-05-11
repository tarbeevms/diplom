package main

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	password := "admin"
	// Using bcrypt.DefaultCost. You can adjust the cost if needed.
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		fmt.Println("Error hashing password:", err)
		return
	}
	fmt.Println("Hashed password:", string(hashedPassword))
}
