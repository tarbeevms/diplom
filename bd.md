CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(255) NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE problems (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    difficulty ENUM('easy', 'medium', 'hard') NOT NULL,
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
    code TEXT NOT NULL,
    status ENUM('pending', 'accepted', 'rejected') NOT NULL,
    execution_time FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (uuid) ON DELETE CASCADE,
    FOREIGN KEY (problem_uuid) REFERENCES problems (uuid) ON DELETE CASCADE
);