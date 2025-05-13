package repo

import (
	"database/sql"
	"diplom/internal/auth"
	"diplom/internal/problems"
	"diplom/pkg/dbconnect"
	"errors"

	"github.com/google/uuid"
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

// AddSession добавляет новую сессию или обновляет существующую, устанавливая token и обновляя created_at.
func (sr *PGClient) AddSession(sess *auth.Session) error {
	query := `
        INSERT INTO sessions (username, token, created_at) 
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (username) DO UPDATE 
            SET token = EXCLUDED.token,
                created_at = CURRENT_TIMESTAMP
    `
	_, err := sr.db.Exec(query, sess.Username, sess.Token)
	return err
}

// DeleteSessionByToken удаляет сессию по токену.
func (sr *PGClient) DeleteSessionByToken(token string) error {
	query := "DELETE FROM sessions WHERE token = ?"
	_, err := sr.db.Exec(query, token)
	return err
}

// GetSessionByToken получает сессию по токену.
func (sr *PGClient) GetSessionByToken(token string) (*auth.Session, error) {
	query := "SELECT username, token FROM sessions WHERE token = $1 LIMIT 1"
	row := sr.db.QueryRow(query, token)

	var sess auth.Session
	err := row.Scan(&sess.Username, &sess.Token)
	return &sess, err
}

// GetUserByUsername получает пользователя по имени пользователя.
func (sr *PGClient) VerifyUsernamePassword(username, password string) (userID, role string, match bool, err error) {
	query := "SELECT password, uuid, role FROM users WHERE username = $1 LIMIT 1"
	row := sr.db.QueryRow(query, username)
	var hashedPassword string
	err = row.Scan(&hashedPassword, &userID, &role)
	if err != nil {
		return "", "", false, err
	}
	return userID, role, bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password)) == nil, nil
}

// IsUserExists проверяет, существует ли пользователь с данным именем пользователя.
func (sr *PGClient) IsUserExists(username string) (bool, error) {
	query := "SELECT COUNT(*) FROM users WHERE username = $1"
	row := sr.db.QueryRow(query, username)
	var count int
	err := row.Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// AddUser adds a new user to the database.
func (sr *PGClient) AddUser(username, hashedPassword, role string) error {
	uuid := uuid.New()
	query := "INSERT INTO users (username, password, uuid, role) VALUES ($1, $2, $3, $4)"
	_, err := sr.db.Exec(query, username, hashedPassword, uuid, role)
	return err
}

func (sr *PGClient) GetProblemByUUID(uuid string, userID string) (*problems.Problem, error) {
	query := `
        SELECT 
            p.id, 
            p.uuid, 
            p.name, 
            p.difficulty, 
            p.description,
            CASE WHEN s.id IS NOT NULL THEN true ELSE false END AS solved
        FROM 
            problems p
        LEFT JOIN 
            solutions s ON p.uuid = s.problem_uuid AND s.user_id = $1
        WHERE 
            p.uuid = $2 
        LIMIT 1
    `
	row := sr.db.QueryRow(query, userID, uuid)
	var problem problems.Problem
	err := row.Scan(
		&problem.ID,
		&problem.UUID,
		&problem.Name,
		&problem.Difficulty,
		&problem.Description,
		&problem.Solved,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, problems.ErrProblemNotFound
	}
	return &problem, err
}

func (sr *PGClient) GetTestCasesByProblemUUID(problemUUID string) ([]problems.TestCase, error) {
	query := "SELECT id, input, output FROM testcases WHERE problem_uuid = $1"
	rows, err := sr.db.Query(query, problemUUID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	testCases := []problems.TestCase{}
	for rows.Next() {
		var testCase problems.TestCase
		if err := rows.Scan(&testCase.ID, &testCase.Input, &testCase.Output); err != nil {
			return nil, err
		}
		testCases = append(testCases, testCase)
	}

	if len(testCases) == 0 {
		return testCases, problems.ErrTestCasesNotFound
	}

	return testCases, nil
}

func (sr *PGClient) AddProblem(uuid, name, difficulty, description string) error {
	query := `
		INSERT INTO problems (uuid, name, difficulty, description) 
		VALUES ($1, $2, $3, $4)
	`
	_, err := sr.db.Exec(query, uuid, name, difficulty, description)
	return err
}

func (sr *PGClient) AddTestcase(problemUUID, input, output string) error {
	query := `
		INSERT INTO testcases (problem_uuid, input, output) 
		VALUES ($1, $2, $3)
	`
	_, err := sr.db.Exec(query, problemUUID, input, output)
	return err
}

func (sr *PGClient) GetAllProblems(userID string) ([]problems.Problem, error) {
	// Updated query with LEFT JOIN to check if problem is solved by the user
	query := `
   SELECT 
         p.id, 
         p.uuid, 
         p.name, 
         p.difficulty, 
         p.description,
         CASE WHEN s.id IS NOT NULL THEN true ELSE false END AS solved
     FROM 
         problems p
LEFT JOIN 
         solutions s 
		   ON p.uuid = s.problem_uuid 
          AND s.user_id = $1 
        `
	rows, err := sr.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	problemList := []problems.Problem{}
	for rows.Next() {
		var problem problems.Problem
		if err := rows.Scan(
			&problem.ID,
			&problem.UUID,
			&problem.Name,
			&problem.Difficulty,
			&problem.Description,
			&problem.Solved,
		); err != nil {
			return nil, err
		}
		problemList = append(problemList, problem)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return problemList, nil
}

func (sr *PGClient) DeleteTestcase(id int) error {
	query := "DELETE FROM testcases WHERE id = $1"
	result, err := sr.db.Exec(query, id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return errors.New("testcase not found")
	}

	return nil
}

func (sr *PGClient) DeleteProblem(uuid string) error {
	query := "DELETE FROM problems WHERE uuid = $1"
	result, err := sr.db.Exec(query, uuid)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return problems.ErrProblemNotFound
	}

	return nil
}

func (sr *PGClient) SaveSolution(userID, problemUUID string, solution problems.ProblemSolution) (int, error) {
	query := `
        INSERT INTO solutions (
            user_id, 
            problem_uuid, 
            execution_time_ms, 
            memory_usage_kb,
            code,
            language,
            created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id, problem_uuid) 
        DO UPDATE SET 
            execution_time_ms = $3,
            memory_usage_kb = $4,
			code = $5,
			language = $6,
            created_at = $7
        RETURNING id
    `

	var solutionID int
	err := sr.db.QueryRow(
		query,
		userID,
		problemUUID,
		solution.AverageTime,
		solution.AverageMemory,
		solution.Code,
		solution.Language,
		solution.CreatedAt,
	).Scan(&solutionID)

	return solutionID, err
}

// GetSolutionByProblemAndUser retrieves a solution for a specific problem and user
func (sr *PGClient) GetSolutionByProblemAndUser(userID, problemUUID string) (problems.ProblemSolution, error) {
	query := `
        SELECT 
            execution_time_ms, 
            memory_usage_kb,
            code,
			language,
            created_at
        FROM 
            solutions
        WHERE 
            user_id = $1 
            AND problem_uuid = $2
        LIMIT 1
    `

	var solution problems.ProblemSolution
	var createdAt sql.NullTime

	err := sr.db.QueryRow(query, userID, problemUUID).Scan(
		&solution.AverageTime,
		&solution.AverageMemory,
		&solution.Code,
		&solution.Language,
		&createdAt,
	)

	if err != nil {
		return problems.ProblemSolution{}, err
	}

	// Convert sql.NullTime to time.Time
	if createdAt.Valid {
		solution.CreatedAt = createdAt.Time
	}

	return solution, nil
}

func (sr *PGClient) GetAverageMetrics(problemUUID string) (float64, int64, error) {
	query := `
        SELECT AVG(execution_time_ms), AVG(memory_usage_kb)
        FROM solutions
        WHERE problem_uuid = $1
    `
	var avgTime float64
	var avgMemory int64
	err := sr.db.QueryRow(query, problemUUID).Scan(&avgTime, &avgMemory)

	return avgTime, avgMemory, err
}
