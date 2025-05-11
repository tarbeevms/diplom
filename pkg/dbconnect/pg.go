package dbconnect

import (
	"database/sql"
	"diplom/config"
	"fmt"
	"log"
	"time"

	_ "github.com/lib/pq"
)

const maxRetries = 10
const retryDelay = 5 * time.Second

func PgConnFromCFG() (*sql.DB, error) {
	dsn := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		config.CFG.Database.Host,
		config.CFG.Database.Port,
		config.CFG.Database.Username,
		config.CFG.Database.Password,
		config.CFG.Database.Database)

	var db *sql.DB
	var err error
	for i := 0; i < maxRetries; i++ {
		db, err = sql.Open("postgres", dsn)
		if err != nil {
			log.Printf("Failed to connect to PostgreSQL (attempt %d/%d): %s, %s", i+1, maxRetries, err.Error(), dsn)
			time.Sleep(retryDelay)
			continue
		}

		db.SetMaxOpenConns(10)

		if err := db.Ping(); err != nil {
			log.Printf("Failed to ping PostgreSQL DB (attempt %d/%d): %s, %s", i+1, maxRetries, err.Error(), dsn)
			db.Close()
			time.Sleep(retryDelay)
			continue
		}

		log.Printf("Successfully connected to PostgreSQL: %s", dsn)
		return db, nil
	}

	return nil, fmt.Errorf("failed to connect to PostgreSQL after %d attempts", maxRetries)
}
