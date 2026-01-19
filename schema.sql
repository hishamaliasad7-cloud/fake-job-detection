-- AESD Database Schema - Full Portal Version

-- Users & Authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'seeker', -- 'seeker', 'recruiter', 'admin'
    company_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Job Postings
CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    recruiter_id INTEGER REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    description TEXT,
    salary_range VARCHAR(100),
    job_hash VARCHAR(64) UNIQUE, -- For extension tracking
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Applicant Effort signals
CREATE TABLE IF NOT EXISTS applicant_efforts (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id),
    session_id VARCHAR(64),
    effort_type VARCHAR(50),
    value INTEGER,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employer Response signals
CREATE TABLE IF NOT EXISTS employer_responses (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id),
    response_type VARCHAR(50),
    confidence_score FLOAT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fake Job Reports
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id),
    reporter_id INTEGER REFERENCES users(id),
    reason TEXT,
    evidence_url TEXT,
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'resolved', 'dismissed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blacklisted Entities
CREATE TABLE IF NOT EXISTS blacklist (
    id SERIAL PRIMARY KEY,
    entity_value VARCHAR(255) UNIQUE NOT NULL, -- email or domain
    entity_type VARCHAR(50), -- 'email', 'domain'
    reason TEXT,
    blacklisted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

