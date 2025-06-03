CREATE TYPE difficulty_enum AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE role_enum AS ENUM ('user', 'admin');
CREATE TYPE status_enum AS ENUM ('accepted', 'rejected');

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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES users (username) ON DELETE CASCADE
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
    user_uuid VARCHAR(255) NOT NULL,
    problem_uuid VARCHAR(255) NOT NULL,
    execution_time_ms FLOAT NOT NULL,
    memory_usage_kb FLOAT NOT NULL,
    code TEXT NOT NULL,
    language VARCHAR(255) NOT NULL,
    status status_enum NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_uuid) REFERENCES users (uuid) ON DELETE CASCADE,
    FOREIGN KEY (problem_uuid) REFERENCES problems (uuid) ON DELETE CASCADE
);

INSERT INTO users (uuid, username, role, password)
VALUES ('admin', 'admin', 'admin', '$2a$10$yCz84qAx0a8/w4cy8GTCkeDu5Uwqo2fEf5Gs5wKZce3pc.LZPVoSu');

INSERT INTO problems (uuid, name, difficulty, description)
VALUES (
    '123e4567-e89b-12d3-a456-426614174000',
    'Тестовая задача',
    'easy',
    'Напишите программу, которая выводит "output", когда ввод точно равен "input". 
    Для любого другого ввода программа должна выводить "error".'
);

INSERT INTO testcases (problem_uuid, input, output)
VALUES 
('123e4567-e89b-12d3-a456-426614174000','input','output'),
('123e4567-e89b-12d3-a456-426614174000','something_else','error'),
('123e4567-e89b-12d3-a456-426614174000',' ','error'),   
('123e4567-e89b-12d3-a456-426614174000','123dsaadfvjnq3;4gu43gvb','error');

INSERT INTO problems (uuid, name, difficulty, description)
VALUES (
    '11648224-9244-4c39-adc4-8712234492fa',
    'Два числа',
    'easy',
    '<div class="description_content">
    <p>Дан массив целых чисел <code>nums</code>&nbsp;и целое число <code>target</code>. Верните <em>индексы двух чисел таким образом, чтобы их сумма была равна <code>target</code></em>.</p>

    <p>Вы можете предположить, что каждый набор входных данных имеет <strong><em>ровно одно решение</em></strong>, и вы не можете использовать один и тот же элемент дважды.</p>

    <p>Вы можете вернуть ответ в любом порядке.</p>

    <p>&nbsp;</p>
    <p><strong class="example">Пример 1:</strong></p>

    <pre><strong>Вход:</strong> nums = [2,7,11,15], target = 9
<strong>Выход:</strong> [0,1]
<strong>Объяснение:</strong> Так как nums[0] + nums[1] == 9, мы возвращаем [0, 1].
    </pre>

    <p><strong class="example">Пример 2:</strong></p>

    <pre><strong>Вход:</strong> nums = [3,2,4], target = 6
<strong>Выход:</strong> [1,2]
    </pre>

    <p><strong class="example">Пример 3:</strong></p>

    <pre><strong>Вход:</strong> nums = [3,3], target = 6
<strong>Выход:</strong> [0,1]
    </pre>

    <p>&nbsp;</p>
    <p><strong>Ограничения:</strong></p>

    <ul>
        <li><code>2 &lt;= nums.length &lt;= 10<sup>4</sup></code></li>
        <li><code>-10<sup>9</sup> &lt;= nums[i] &lt;= 10<sup>9</sup></code></li>
        <li><code>-10<sup>9</sup> &lt;= target &lt;= 10<sup>9</sup></code></li>
        <li><strong>Существует только одно правильное решение.</strong></li>
    </ul>

    <p>&nbsp;</p>
    <strong>Дополнительно:&nbsp;</strong>Можете ли вы придумать алгоритм со сложностью менее <code>O(n<sup>2</sup>)</code><font face="monospace">&nbsp;</font>?
    
    <h3>Формат ввода:</h3>
    <p>В первой строке задан массив чисел, разделенных пробелами.</p>
    <p>Во второй строке задано целевое число target.</p>
    
    <h3>Формат вывода:</h3>
    <p>Индексы двух чисел, разделенные пробелом.</p>
    </div>'
);

INSERT INTO testcases (problem_uuid, input, output)
VALUES 
('11648224-9244-4c39-adc4-8712234492fa', '2 7 11 15
9', '0 1'),
('11648224-9244-4c39-adc4-8712234492fa', '3 2 4
6', '1 2'),
('11648224-9244-4c39-adc4-8712234492fa', '3 3
6', '0 1'),
('11648224-9244-4c39-adc4-8712234492fa', '1 5 8 10 13
18', '2 3'),
('11648224-9244-4c39-adc4-8712234492fa', '-1 -2 -3 -4 -5
-8', '2 4');

-- Добавление задачи "Целое число в римское число"
INSERT INTO problems (uuid, name, difficulty, description)
VALUES (
    'b172fc8d-33db-419e-8445-4deafc3b9968',
    'Целое число в римское число',
    'medium',
    '<div class="description_content">
    <p>Семь различных символов представляют римские цифры со следующими значениями:</p>

    <table><thead><tr><th>Символ</th><th>Значение</th></tr></thead><tbody><tr><td>I</td><td>1</td></tr><tr><td>V</td><td>5</td></tr><tr><td>X</td><td>10</td></tr><tr><td>L</td><td>50</td></tr><tr><td>C</td><td>100</td></tr><tr><td>D</td><td>500</td></tr><tr><td>M</td><td>1000</td></tr></tbody></table>

    <p>Римские цифры формируются путем добавления преобразований десятичных разрядов от наибольшего к наименьшему. Преобразование десятичного разряда в римскую цифру имеет следующие правила:</p>

    <ul>
        <li>Если значение не начинается с 4 или&nbsp;9, выберите символ максимального значения, который можно вычесть из входных данных, добавьте этот символ к результату, вычтите его значение и преобразуйте остаток в римскую цифру.</li>
        <li>Если значение начинается с 4 или 9, используйте&nbsp;<strong>вычитающую форму</strong>&nbsp;представляющую&nbsp;один символ, вычитаемый из следующего символа. Например,&nbsp;4 это 1 (<code>I</code>) меньше 5 (<code>V</code>): <code>IV</code>&nbsp;и 9 это 1 (<code>I</code>) меньше 10 (<code>X</code>): <code>IX</code>.&nbsp;Используются только следующие вычитающие формы: 4 (<code>IV</code>), 9 (<code>IX</code>),&nbsp;40 (<code>XL</code>), 90 (<code>XC</code>), 400 (<code>CD</code>) и 900 (<code>CM</code>).</li>
        <li>Только степени 10 (<code>I</code>, <code>X</code>, <code>C</code>, <code>M</code>) могут быть добавлены последовательно не более 3 раз для представления кратных 10. Нельзя добавлять 5&nbsp;(<code>V</code>), 50 (<code>L</code>) или 500 (<code>D</code>) несколько раз. Если вам нужно добавить символ&nbsp;4 раза&nbsp;используйте <strong>вычитающую форму</strong>.</li>
    </ul>

    <p>Дано целое число, преобразуйте его в римскую цифру.</p>

    <p>&nbsp;</p>
    <p><strong class="example">Пример 1:</strong></p>

    <div class="example-block">
    <p><strong>Ввод:</strong> <span class="example-io">num = 3749</span></p>

    <p><strong>Вывод:</strong> <span class="example-io">"MMMDCCXLIX"</span></p>

    <p><strong>Объяснение:</strong></p>

    <pre>3000 = MMM как 1000 (M) + 1000 (M) + 1000 (M)
 700 = DCC как 500 (D) + 100 (C) + 100 (C)
  40 = XL как 10 (X) меньше 50 (L)
   9 = IX как 1 (I) меньше 10 (X)
Примечание: 49 - это не 1 (I) меньше 50 (L), потому что преобразование основано на десятичных разрядах
    </pre>
    </div>

    <p><strong class="example">Пример 2:</strong></p>

    <div class="example-block">
    <p><strong>Ввод:</strong> <span class="example-io">num = 58</span></p>

    <p><strong>Вывод:</strong> <span class="example-io">"LVIII"</span></p>

    <p><strong>Объяснение:</strong></p>

    <pre>50 = L
 8 = VIII
    </pre>
    </div>

    <p><strong class="example">Пример 3:</strong></p>

    <div class="example-block">
    <p><strong>Ввод:</strong> <span class="example-io">num = 1994</span></p>

    <p><strong>Вывод:</strong> <span class="example-io">"MCMXCIV"</span></p>

    <p><strong>Объяснение:</strong></p>

    <pre>1000 = M
 900 = CM
  90 = XC
   4 = IV
    </pre>
    </div>

    <p>&nbsp;</p>
    <p><strong>Ограничения:</strong></p>

    <ul>
        <li><code>1 &lt;= num &lt;= 3999</code></li>
    </ul>
    </div>'
);

INSERT INTO testcases (problem_uuid, input, output)
VALUES 
('b172fc8d-33db-419e-8445-4deafc3b9968', '3749', 'MMMDCCXLIX'),
('b172fc8d-33db-419e-8445-4deafc3b9968', '58', 'LVIII'),
('b172fc8d-33db-419e-8445-4deafc3b9968', '1994', 'MCMXCIV'),
('b172fc8d-33db-419e-8445-4deafc3b9968', '1', 'I'),
('b172fc8d-33db-419e-8445-4deafc3b9968', '3999', 'MMMCMXCIX');

-- Добавление задачи "Объединение k отсортированных списков"
INSERT INTO problems (uuid, name, difficulty, description)
VALUES (
    '1778a53e-1119-4026-be92-3c4d2a54a9a7',
    'Объединение k отсортированных списков',
    'hard',
    '<div class="description_content">
    <p>Вам дан массив из <code>k</code> связных списков <code>lists</code>, каждый связный список отсортирован в порядке возрастания.</p>

    <p><em>Объедините все связные списки в один отсортированный связный список и верните его.</em></p>

    <p>&nbsp;</p>
    <p><strong class="example">Пример 1:</strong></p>

    <pre><strong>Ввод:</strong> lists = [[1,4,5],[1,3,4],[2,6]]
<strong>Вывод:</strong> [1,1,2,3,4,4,5,6]
<strong>Объяснение:</strong> Связные списки:
[
  1->4->5,
  1->3->4,
  2->6
]
объединяются в один отсортированный список:
1->1->2->3->4->4->5->6
    </pre>

    <p><strong class="example">Пример 2:</strong></p>

    <pre><strong>Ввод:</strong> lists = []
<strong>Вывод:</strong> []
    </pre>

    <p><strong class="example">Пример 3:</strong></p>

    <pre><strong>Ввод:</strong> lists = [[]]
<strong>Вывод:</strong> []
    </pre>

    <p>&nbsp;</p>
    <p><strong>Ограничения:</strong></p>

    <ul>
        <li><code>k == lists.length</code></li>
        <li><code>0 &lt;= k &lt;= 10<sup>4</sup></code></li>
        <li><code>0 &lt;= lists[i].length &lt;= 500</code></li>
        <li><code>-10<sup>4</sup> &lt;= lists[i][j] &lt;= 10<sup>4</sup></code></li>
        <li><code>lists[i]</code> отсортирован в <strong>порядке возрастания</strong>.</li>
        <li>Сумма <code>lists[i].length</code> не превысит <code>10<sup>4</sup></code>.</li>
    </ul>
    
    <p>&nbsp;</p>
    <p><strong>Формат ввода:</strong></p>
    <p>Массив массивов целых чисел в формате JSON, представляющий связные списки.</p>
    
    <p><strong>Формат вывода:</strong></p>
    <p>Массив целых чисел в формате JSON, представляющий объединенный отсортированный список.</p>
    </div>'
);

INSERT INTO testcases (problem_uuid, input, output)
VALUES 
('1778a53e-1119-4026-be92-3c4d2a54a9a7', '[[1,4,5],[1,3,4],[2,6]]', '[1,1,2,3,4,4,5,6]'),
('1778a53e-1119-4026-be92-3c4d2a54a9a7', '[]', '[]'),
('1778a53e-1119-4026-be92-3c4d2a54a9a7', '[[]]', '[]'),
('1778a53e-1119-4026-be92-3c4d2a54a9a7', '[[1,2,3]]', '[1,2,3]'),
('1778a53e-1119-4026-be92-3c4d2a54a9a7', '[[1],[2],[3]]', '[1,2,3]');

-- Добавление задачи "Деление двух целых чисел"
INSERT INTO problems (uuid, name, difficulty, description)
VALUES (
    '41c292a4-0953-40da-9251-0609542d5756',
    'Деление двух целых чисел',
    'medium',
    '<div class="description_content">
    <p>Даны два целых числа <code>dividend</code> и <code>divisor</code>, разделите два целых числа <strong>без</strong> использования операторов умножения, деления и взятия остатка.</p>

    <p>Целочисленное деление должно отбрасывать дробную часть в сторону нуля, что означает потерю дробной части. Например, <code>8.345</code> будет усечено до <code>8</code>, а <code>-2.7335</code> будет усечено до <code>-2</code>.</p>

    <p>Верните <em><strong>частное</strong> после деления </em><code>dividend</code><em> на </em><code>divisor</code>.</p>

    <p><strong>Примечание: </strong>Предположим, что мы работаем в среде, которая может хранить целые числа только в диапазоне <strong>32-битных</strong> знаковых целых чисел: <code>[−2<sup>31</sup>, 2<sup>31</sup> − 1]</code>. Для этой задачи, если частное <strong>строго больше</strong> <code>2<sup>31</sup> - 1</code>, то верните <code>2<sup>31</sup> - 1</code>, а если частное <strong>строго меньше</strong> <code>-2<sup>31</sup></code>, то верните <code>-2<sup>31</sup></code>.</p>

    <p>&nbsp;</p>
    <p><strong class="example">Пример 1:</strong></p>

    <pre><strong>Ввод:</strong> dividend = 10, divisor = 3
<strong>Вывод:</strong> 3
<strong>Объяснение:</strong> 10/3 = 3.33333.., которое усекается до 3.
    </pre>

    <p><strong class="example">Пример 2:</strong></p>

    <pre><strong>Ввод:</strong> dividend = 7, divisor = -3
<strong>Вывод:</strong> -2
<strong>Объяснение:</strong> 7/-3 = -2.33333.., которое усекается до -2.
    </pre>

    <p>&nbsp;</p>
    <p><strong>Ограничения:</strong></p>

    <ul>
        <li><code>-2<sup>31</sup> &lt;= dividend, divisor &lt;= 2<sup>31</sup> - 1</code></li>
        <li><code>divisor != 0</code></li>
    </ul>
    
    <p>&nbsp;</p>
    <p><strong>Формат ввода:</strong></p>
    <p>Два целых числа через пробел: делимое и делитель.</p>
    
    <p><strong>Формат вывода:</strong></p>
    <p>Одно целое число - результат целочисленного деления.</p>
    </div>'
);

INSERT INTO testcases (problem_uuid, input, output)
VALUES 
('41c292a4-0953-40da-9251-0609542d5756', '10 3', '3'),
('41c292a4-0953-40da-9251-0609542d5756', '7 -3', '-2'),
('41c292a4-0953-40da-9251-0609542d5756', '-2147483648 -1', '2147483647'),
('41c292a4-0953-40da-9251-0609542d5756', '2147483647 1', '2147483647'),
('41c292a4-0953-40da-9251-0609542d5756', '0 1', '0');
-- Добавление задачи "Сопоставление с шаблоном по маске"
INSERT INTO problems (uuid, name, difficulty, description)
VALUES (
    'd1e0ae98-2b20-47b8-b51d-5a0dac102334',
    'Сопоставление с шаблоном по маске',
    'hard',
    '<div class="description_content">
    <p>Дана входная строка (<code>s</code>) и шаблон (<code>p</code>), реализуйте сопоставление с шаблоном по маске с поддержкой символов <code>?</code> и <code>*</code>, где:</p>

    <ul>
        <li><code>?</code> Соответствует любому одиночному символу.</li>
        <li><code>*</code> Соответствует любой последовательности символов (включая пустую последовательность).</li>
    </ul>

    <p>Сопоставление должно охватывать <strong>всю</strong> входную строку (не частично).</p>

    <p>&nbsp;</p>
    <p><strong class="example">Пример 1:</strong></p>

    <pre><strong>Ввод:</strong> s = "aa", p = "a"
<strong>Вывод:</strong> false
<strong>Объяснение:</strong> "a" не соответствует всей строке "aa".
    </pre>

    <p><strong class="example">Пример 2:</strong></p>

    <pre><strong>Ввод:</strong> s = "aa", p = "*"
<strong>Вывод:</strong> true
<strong>Объяснение:</strong>&nbsp;* соответствует любой последовательности.
    </pre>

    <p><strong class="example">Пример 3:</strong></p>

    <pre><strong>Ввод:</strong> s = "cb", p = "?a"
<strong>Вывод:</strong> false
<strong>Объяснение:</strong>&nbsp;? соответствует c, но вторая буква a, которая не соответствует b.
    </pre>

    <p>&nbsp;</p>
    <p><strong>Ограничения:</strong></p>

    <ul>
        <li><code>0 &lt;= s.length, p.length &lt;= 2000</code></li>
        <li><code>s</code> содержит только строчные английские буквы.</li>
        <li><code>p</code> содержит только строчные английские буквы, <code>?</code> или <code>*</code>.</li>
    </ul>
    
    <p>&nbsp;</p>
    <p><strong>Формат ввода:</strong></p>
    <p>Две строки, разделенные переносом строки: строка s и шаблон p.</p>
    
    <p><strong>Формат вывода:</strong></p>
    <p>Строка "true" или "false" (без кавычек).</p>
    </div>'
);

INSERT INTO testcases (problem_uuid, input, output)
VALUES 
('d1e0ae98-2b20-47b8-b51d-5a0dac102334', 'aa
a', 'false'),
('d1e0ae98-2b20-47b8-b51d-5a0dac102334', 'aa
*', 'true'),
('d1e0ae98-2b20-47b8-b51d-5a0dac102334', 'cb
?a', 'false'),
('d1e0ae98-2b20-47b8-b51d-5a0dac102334', 'adceb
*a*b', 'true'),
('d1e0ae98-2b20-47b8-b51d-5a0dac102334', 'acdcb
a*c?b', 'false');