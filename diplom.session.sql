-- UPDATE users
-- SET role = 'admin'
-- WHERE username = '123';

-- select * from users;

-- BEGIN;

-- -- Insert a new problem
-- INSERT INTO problems (uuid, name, difficulty, description)
-- VALUES (
--     '123e4567-e89b-12d3-a456-426614174000',  -- Unique identifier for the problem
--     'Sample Problem',                        -- Name of the problem
--     'easy',                                  -- Difficulty (must match one of 'easy', 'medium', 'hard')
--     'This is a sample problem description.'  -- Description of the problem
-- );

-- -- Insert related testcases for the problem using the same uuid
-- INSERT INTO testcases (problem_uuid, input, output)
-- VALUES 
--     ('123e4567-e89b-12d3-a456-426614174000', 'input', 'output');
-- COMMIT;

-- select * from testcases;

-- SELECT
--          p.id, 
--          p.uuid, 
--          p.name, 
--          p.difficulty, 
--          p.description,
--          CASE WHEN s.id IS NOT NULL THEN true ELSE false END AS solved
--      FROM 
--          problems p
-- LEFT JOIN 
--          solutions s ON p.uuid = s.problem_uuid AND s.user_id = 'admin' AND s.status = 'accepted';

delete from solutions;