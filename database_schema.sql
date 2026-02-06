-- AESD Database Schema (PostgreSQL/SQLite compatible)

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    role TEXT DEFAULT 'seeker',
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE companies (
    company_id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    domain TEXT,
    industry TEXT,
    global_sink_score FLOAT DEFAULT 0.0
);

CREATE TABLE jobs (
    job_id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(company_id),
    title TEXT NOT NULL,
    description TEXT,
    posting_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE applications (
    app_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    job_id INTEGER REFERENCES jobs(job_id),
    status TEXT DEFAULT 'applied', -- applied, interview, rejected, offer, ghosted
    effort_score FLOAT DEFAULT 0.0,
    sink_score FLOAT DEFAULT 0.0,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE effort_logs (
    log_id SERIAL PRIMARY KEY,
    app_id INTEGER REFERENCES applications(app_id),
    activity_type TEXT, -- 'time_spent', 'field_fill', 'ats_redirect', 'upload'
    value FLOAT,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE employer_signals (
    signal_id SERIAL PRIMARY KEY,
    app_id INTEGER REFERENCES applications(app_id),
    signal_type TEXT, -- 'ACK', 'INTERVIEW', 'REJECTION'
    source TEXT, -- 'extension', 'email', 'manual'
    confidence FLOAT,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast sink-score calculation
CREATE INDEX idx_app_sink ON applications(sink_score);
CREATE INDEX idx_signal_app ON employer_signals(app_id);
