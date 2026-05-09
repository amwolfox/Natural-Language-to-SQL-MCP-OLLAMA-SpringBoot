-- Run this once to set up the sample schema and data
-- Usage: psql -U nl2sql -d nl2sql -f scripts/init.sql

CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    budget NUMERIC(12, 2),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(200) UNIQUE NOT NULL,
    department_id INT REFERENCES departments(id),
    salary NUMERIC(10, 2),
    hire_date DATE,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    department_id INT REFERENCES departments(id),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS project_assignments (
    employee_id INT REFERENCES employees(id),
    project_id INT REFERENCES projects(id),
    role VARCHAR(100),
    assigned_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (employee_id, project_id)
);

INSERT INTO departments (name, budget) VALUES
    ('Engineering', 2000000.00),
    ('Marketing', 800000.00),
    ('Sales', 1200000.00),
    ('HR', 500000.00);

INSERT INTO employees (first_name, last_name, email, department_id, salary, hire_date) VALUES
    ('Alice',   'Chen',    'alice@company.com',   1, 120000, '2020-03-15'),
    ('Bob',     'Smith',   'bob@company.com',     1,  95000, '2021-07-01'),
    ('Carol',   'Davis',   'carol@company.com',   2,  85000, '2019-11-20'),
    ('Daniel',  'Kim',     'daniel@company.com',  3, 110000, '2022-01-10'),
    ('Eva',     'Nguyen',  'eva@company.com',     1, 130000, '2018-05-03'),
    ('Frank',   'Jones',   'frank@company.com',   4,  75000, '2023-02-28'),
    ('Grace',   'Patel',   'grace@company.com',   2,  90000, '2020-08-14'),
    ('Henry',   'Wilson',  'henry@company.com',   3,  98000, '2021-03-22');

INSERT INTO projects (title, department_id, start_date, end_date, status) VALUES
    ('API Redesign',        1, '2024-01-01', '2024-06-30', 'completed'),
    ('Brand Refresh',       2, '2024-03-01', '2024-09-30', 'active'),
    ('CRM Integration',     3, '2024-02-15', '2024-12-31', 'active'),
    ('Platform Migration',  1, '2024-07-01', '2025-03-31', 'active'),
    ('Recruitment Pipeline',4, '2024-05-01', '2024-10-31', 'active');

INSERT INTO project_assignments (employee_id, project_id, role) VALUES
    (1, 1, 'Tech Lead'), (2, 1, 'Developer'), (5, 1, 'Architect'),
    (3, 2, 'Campaign Manager'), (7, 2, 'Designer'),
    (4, 3, 'Sales Lead'), (8, 3, 'Account Manager'),
    (1, 4, 'Architect'), (2, 4, 'Developer'), (5, 4, 'Tech Lead'),
    (6, 5, 'HR Manager');
