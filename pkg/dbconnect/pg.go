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
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8&parseTime=true",
		config.CFG.Database.Username,
		config.CFG.Database.Password,
		config.CFG.Database.Host,
		config.CFG.Database.Port,
		config.CFG.Database.Database)

	var db *sql.DB
	var err error
	for i := 0; i < maxRetries; i++ {
		db, err = sql.Open("mysql", dsn)
		if err != nil {
			log.Printf("Failed to connect to PostgreSQL (attempt %d/%d): %v, %s", i+1, maxRetries, err, dsn)
			time.Sleep(retryDelay)
			continue
		}

		db.SetMaxOpenConns(10)

		if err := db.Ping(); err != nil {
			log.Printf("Failed to ping PostgreSQL DB (attempt %d/%d): %v, %s", i+1, maxRetries, err, dsn)
			db.Close()
			time.Sleep(retryDelay)
			continue
		}

		log.Printf("Successfully connected to PostgreSQL: %s", dsn)
		return db, nil
	}

	return nil, fmt.Errorf("failed to connect to PostgreSQL after %d attempts", maxRetries)
}
