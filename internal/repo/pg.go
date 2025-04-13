package repo

import (
	"database/sql"
	"diplom/internal/auth"
	"diplom/internal/problems"
	"diplom/pkg/dbconnect"
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

type PGClient struct {
	db *sql.DB
}

func InitPG() (*PGClient, error) {
	pgConn, err := dbconnect.PgConnFromCFG()
	if err != nil {
		return nil, err
	}
	return &PGClient{db: pgConn}, nil

}

// AddSession добавляет новую сессию в MySQL.
func (sr *PGClient) AddSession(sess *auth.Session) error {
	query := "REPLACE INTO sessions (username, token) VALUES (?, ?)"
	_, err := sr.db.Exec(query, sess.Username, sess.Token)
	if err != nil {
		return fmt.Errorf("failed to insert session: %w", err)
	}
	return nil
}

// DeleteSessionByToken удаляет сессию по токену.
func (sr *PGClient) DeleteSessionByToken(token string) error {
	query := "DELETE FROM sessions WHERE token = ?"
	_, err := sr.db.Exec(query, token)
	if err != nil {
		return fmt.Errorf("failed to delete session: %w", err)
	}
	return nil
}

// GetSessionByToken получает сессию по токену.
func (sr *PGClient) GetSessionByToken(token string) (*auth.Session, error) {
	query := "SELECT username, token FROM sessions WHERE token = ? LIMIT 1"
	row := sr.db.QueryRow(query, token)

	var sess auth.Session
	err := row.Scan(&sess.Username, &sess.Token)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("session not found")
	} else if err != nil {
		return nil, fmt.Errorf("failed to query session: %w", err)
	}

	return &sess, nil
}

// GetUserByUsername получает пользователя по имени пользователя.
func (sr *PGClient) VerifyUsernamePassword(username, password string) (userID, role string, match bool, err error) {
	query := "SELECT password, user_id, role FROM users WHERE username = $1 LIMIT 1"
	row := sr.db.QueryRow(query, username)
	var hashedPassword string
	err = row.Scan(&hashedPassword, &userID, &role)
	if err != nil {
		return "", "", false, err
	}
	return userID, role, bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password)) == nil, nil
}

// AddUser adds a new user to the database.
func (sr *PGClient) AddUser(username, hashedPassword string) error {
	query := "INSERT INTO users (username, password) VALUES ($1, $2)"
	_, err := sr.db.Exec(query, username, hashedPassword)
	if err != nil {
		return fmt.Errorf("failed to insert user: %w", err)
	}
	return nil
}

func (sr *PGClient) GetProblemByUUID(uuid string) (*problems.Problem, error) {
	query := "SELECT uuid, description FROM problems WHERE uuid = $1 LIMIT 1"
	row := sr.db.QueryRow(query, uuid)

	var problem problems.Problem
	err := row.Scan(&problem.UUID, &problem.Description)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("problem not found")
	} else if err != nil {
		return nil, fmt.Errorf("failed to query problem: %w", err)
	}

	return &problem, nil
}

func (sr *PGClient) SubmitSolution(problemUUID string, code string) error {
	query := "INSERT INTO solutions (problem_uuid, code) VALUES ($1, $2)"
	_, err := sr.db.Exec(query, problemUUID, code)
	if err != nil {
		return fmt.Errorf("failed to submit solution: %w", err)
	}
	return nil
}

func (sr *PGClient) GetTestCasesByProblemUUID(problemUUID string) ([]problems.TestCase, error) {
	query := "SELECT input, output FROM testcases WHERE problem_uuid = $1"
	rows, err := sr.db.Query(query, problemUUID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var testCases []problems.TestCase
	for rows.Next() {
		var testCase problems.TestCase
		if err := rows.Scan(&testCase.Input, &testCase.Output); err != nil {
			return nil, err
		}
		testCases = append(testCases, testCase)
	}
	return testCases, nil
}
