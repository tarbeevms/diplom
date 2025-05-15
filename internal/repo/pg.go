package repo

import (
	"database/sql"
	"diplom/internal/auth"
	"diplom/internal/problems"
	"diplom/pkg/dbconnect"
	"errors"
	"time"

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
	query := "DELETE FROM sessions WHERE token = $1"
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
            EXISTS (
                SELECT 1 
                FROM solutions s 
                WHERE s.problem_uuid = p.uuid 
                  AND s.user_id = $1
                  AND s.status = 'accepted'
            ) AS solved
        FROM 
            problems p
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
	// Используем EXISTS подзапрос, чтобы проверить наличие хотя бы одного принятого решения
	query := `
    SELECT 
         p.id, 
         p.uuid, 
         p.name, 
         p.difficulty, 
         p.description,
         EXISTS (
             SELECT 1 
             FROM solutions s 
             WHERE s.problem_uuid = p.uuid 
               AND s.user_id = $1
               AND s.status = 'accepted'
         ) AS solved
     FROM 
         problems p
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

func (sr *PGClient) SaveSolution(userID, problemUUID string, solution problems.ProblemSolution, isAccepted bool) (int, error) {
	// Определяем статус на основе параметра isAccepted
	status := "rejected"
	if isAccepted {
		status = "accepted"
	}

	// Изменяем SQL запрос: убираем ON CONFLICT чтобы сохранять все попытки решения
	query := `
        INSERT INTO solutions (
            user_id, 
            problem_uuid, 
            execution_time_ms, 
            memory_usage_kb,
            code,
            language,
            created_at,
            status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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
		status, // Добавляем параметр status в запрос
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
			AND status = 'accepted'
		ORDER BY created_at DESC
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

// GetUserStreaks calculates current and longest streaks directly from solutions
func (sr *PGClient) GetUserStreaks(userID string) (currentStreak int, longestStreak int, err error) {
	// Get all distinct dates when user solved problems
	query := `
        SELECT DISTINCT DATE(created_at) as solution_date
        FROM solutions
        WHERE user_id = $1
        ORDER BY solution_date DESC
    `

	rows, err := sr.db.Query(query, userID)
	if err != nil {
		return 0, 0, err
	}
	defer rows.Close()

	// Process dates to calculate streaks
	var dates []time.Time
	for rows.Next() {
		var date time.Time
		if err := rows.Scan(&date); err != nil {
			return 0, 0, err
		}
		dates = append(dates, date)
	}

	if len(dates) == 0 {
		return 0, 0, nil // No solutions
	}

	// Calculate current streak - dates are now in DESC order
	currentStreak = 1 // Start with 1 for the most recent day

	for i := 0; i < len(dates)-1; i++ {
		// Get difference between consecutive days
		// Since dates are in descending order, we compare current with next
		expectedNextDay := dates[i].AddDate(0, 0, -1)

		if expectedNextDay.Equal(dates[i+1]) {
			// If the next date in our sorted list is exactly one day before current,
			// then we have consecutive days
			currentStreak++
		} else {
			// Break on first gap
			break
		}
	}

	// Calculate longest streak (reverse dates to ascending for this calculation)
	reversedDates := make([]time.Time, len(dates))
	for i, date := range dates {
		reversedDates[len(dates)-1-i] = date
	}

	longestStreak = 1
	currentRun := 1

	for i := 1; i < len(reversedDates); i++ {
		expectedNextDay := reversedDates[i-1].AddDate(0, 0, 1)

		if expectedNextDay.Equal(reversedDates[i]) {
			// Consecutive day
			currentRun++
			if currentRun > longestStreak {
				longestStreak = currentRun
			}
		} else {
			// Reset streak on gaps
			currentRun = 1
		}
	}

	return currentStreak, longestStreak, nil
}

// CalculateSuccessRate calculates the percentage of accepted solutions
func (sr *PGClient) CalculateSuccessRate(userID string) (float64, error) {
	query := `
		WITH solution_stats AS (
			SELECT 
				COUNT(*) FILTER (WHERE status = 'accepted') AS accepted_count,
				COUNT(*) AS total_count
			FROM 
				solutions
			WHERE 
				user_id = $1
		)
		SELECT 
			CASE 
				WHEN total_count = 0 THEN 0
				ELSE (accepted_count::float / total_count::float) * 100
			END AS success_rate
		FROM 
			solution_stats
	`

	var successRate float64
	err := sr.db.QueryRow(query, userID).Scan(&successRate)
	if err != nil {
		return 0, err
	}

	// Round to 2 decimal places
	successRate = float64(int(successRate*100)) / 100

	return successRate, nil
}

// GetUserSolutions retrieves all solution attempts for a user and problem
func (sr *PGClient) GetUserSolutions(userID string, problemUUID string) ([]problems.ProblemSolution, error) {
	query := `
        SELECT 
            language,
            code,
            status,
            execution_time_ms,
            memory_usage_kb,
            created_at  -- Возвращаем нативный timestamp вместо форматированной строки
        FROM 
            solutions
        WHERE 
            user_id = $1
        AND
            ($2 = '' OR problem_uuid = $2)
        ORDER BY 
            created_at DESC
    `

	rows, err := sr.db.Query(query, userID, problemUUID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var solutions []problems.ProblemSolution
	for rows.Next() {
		var solution problems.ProblemSolution
		if err := rows.Scan(
			&solution.Language,
			&solution.Code,
			&solution.Status,
			&solution.AverageTime,
			&solution.AverageMemory,
			&solution.CreatedAt, // Теперь timestamp напрямую попадет в поле CreatedAt
		); err != nil {
			return nil, err
		}
		solutions = append(solutions, solution)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return solutions, nil
}
func (sr *PGClient) GetSolutionStatistics(problemUUID, userID, language string, userTime float64, userMemory int64) (float64, int64, float64, float64, error) {
	// Изменяем тип avgMemory на sql.NullFloat64
	var avgTime sql.NullFloat64
	var avgMemory sql.NullFloat64 // Было sql.NullInt64

	// Query to get average time and memory for all accepted solutions except the current user's
	avgQuery := `
        SELECT AVG(execution_time_ms), AVG(memory_usage_kb)
        FROM solutions
        WHERE problem_uuid = $1
        AND status = 'accepted'
        AND user_id != $2
		AND language = $3
    `

	err := sr.db.QueryRow(avgQuery, problemUUID, userID, language).Scan(&avgTime, &avgMemory)
	if err != nil {
		return 0, 0, 0, 0, err
	}

	// Если нет данных для сравнения, используем значения пользователя
	var finalAvgTime float64
	var finalAvgMemory int64

	if avgTime.Valid {
		finalAvgTime = avgTime.Float64
	} else {
		finalAvgTime = userTime
	}

	if avgMemory.Valid {
		// Преобразуем float64 в int64
		finalAvgMemory = int64(avgMemory.Float64) // Было avgMemory.Int64
	} else {
		finalAvgMemory = userMemory
	}

	// Calculate what percentage of solutions this solution beats by time
	timeRankQuery := `
        SELECT 
            CASE 
                WHEN COUNT(*) = 0 THEN 0
                ELSE (COUNT(*) FILTER (WHERE execution_time_ms > $1)::float / COUNT(*)::float) * 100 
            END as time_percentile
        FROM solutions
        WHERE problem_uuid = $2
        AND status = 'accepted'
        AND user_id != $3
		AND language = $4
    `
	var timePercentile float64
	err = sr.db.QueryRow(timeRankQuery, userTime, problemUUID, userID, language).Scan(&timePercentile)
	if err != nil {
		return finalAvgTime, finalAvgMemory, 0, 0, err
	}

	// Calculate what percentage of solutions this solution beats by memory
	memoryRankQuery := `
        SELECT 
            CASE 
                WHEN COUNT(*) = 0 THEN 0
                ELSE (COUNT(*) FILTER (WHERE memory_usage_kb > $1)::float / COUNT(*)::float) * 100 
            END as memory_percentile
        FROM solutions
        WHERE problem_uuid = $2
        AND status = 'accepted'
        AND user_id != $3
		AND language = $4
    `
	var memoryPercentile float64
	err = sr.db.QueryRow(memoryRankQuery, userMemory, problemUUID, userID, language).Scan(&memoryPercentile)
	if err != nil {
		return finalAvgTime, finalAvgMemory, timePercentile, 0, err
	}

	return finalAvgTime, finalAvgMemory, timePercentile, memoryPercentile, nil
}
