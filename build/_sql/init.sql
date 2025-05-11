CREATE TYPE difficulty_enum AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE status_enum AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE role_enum AS ENUM ('user', 'admin');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(255) UNIQUE NOT NULL,
    role role_enum NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (uuid, username, role, password)
VALUES ('admin', 'admin', 'admin', '$2a$10$yCz84qAx0a8/w4cy8GTCkeDu5Uwqo2fEf5Gs5wKZce3pc.LZPVoSu');

CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    token TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE problems (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    difficulty difficulty_enum NOT NULL,
    description TEXT
);

CREATE TABLE testcases (
    id SERIAL PRIMARY KEY,
    problem_uuid VARCHAR(255) NOT NULL,
    input TEXT,
    output TEXT,
    FOREIGN KEY (problem_uuid) REFERENCES problems (uuid) ON DELETE CASCADE
);

INSERT INTO problems (uuid, name, difficulty, description)
VALUES (
    '123e4567-e89b-12d3-a456-426614174000',
    'Sample Test',
    'easy',
    'Write a program that outputs "output" when the input is exactly "input". For any other input, it should output "error".'
);

INSERT INTO testcases (problem_uuid, input, output)
VALUES 
('123e4567-e89b-12d3-a456-426614174000','input','output'),
('123e4567-e89b-12d3-a456-426614174000','something_else','error'),
('123e4567-e89b-12d3-a456-426614174000','','error'),
('123e4567-e89b-12d3-a456-426614174000','123dsaadfvjnq3;4gu43gvb','error');


CREATE TABLE solutions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    problem_uuid VARCHAR(255) NOT NULL,
    execution_time_ms FLOAT NOT NULL,
    memory_usage_kb BIGINT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    -- Foreign key constraints
    FOREIGN KEY (user_id) REFERENCES users (uuid) ON DELETE CASCADE,
    FOREIGN KEY (problem_uuid) REFERENCES problems (uuid) ON DELETE CASCADE,
    
    -- Composite unique constraint for upsert operations
    UNIQUE (user_id, problem_uuid)
);