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