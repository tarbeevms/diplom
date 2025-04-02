package dbconnect

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/lib/pq"
)

const maxRetries = 10
const retryDelay = 5 * time.Second

func PgConnFromCFG() (*sql.DB, error) {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8&parseTime=true",
		config.CFG.MySQLConfig.Username,
		config.CFG.MySQLConfig.Password,
		config.CFG.MySQLConfig.Host,
		config.CFG.MySQLConfig.Port,
		config.CFG.MySQLConfig.Database)

	var db *sql.DB
	var err error
	for i := 0; i < maxRetries; i++ {
		db, err = sql.Open("mysql", dsn)
		if err != nil {
			log.Printf("Failed to connect to MySQL (attempt %d/%d): %v, %s", i+1, maxRetries, err, dsn)
			time.Sleep(retryDelay)
			continue
		}

		db.SetMaxOpenConns(10)

		if err := db.Ping(); err != nil {
			log.Printf("Failed to ping MySQL DB (attempt %d/%d): %v, %s", i+1, maxRetries, err, dsn)
			db.Close()
			time.Sleep(retryDelay)
			continue
		}

		log.Printf("Successfully connected to MySQL: %s", dsn)
		return db, nil
	}

	return nil, fmt.Errorf("failed to connect to MySQL after %d attempts", maxRetries)
}
