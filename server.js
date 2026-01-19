const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const SLSA_JWT_SECRET = process.env.JWT_SECRET || 'aesd-super-secret-key';
const ML_API_URL = process.env.ML_API_URL || 'http://localhost:5000';

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database Pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// --- AUTH MIDDLEWARE ---
const authenticate = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied' });
    try {
        const verified = jwt.verify(token, SLSA_JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ error: 'Invalid token' });
    }
};

const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    next();
};

// --- AUTH ROUTES ---
app.post('/api/auth/signup', async (req, res) => {
    const { name, email, password, role, company_name } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (name, email, password_hash, role, company_name) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, role',
            [name, email, hashedPassword, role || 'seeker', company_name]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ error: 'Email already exists' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) return res.status(400).json({ error: 'User not found' });

        const validPass = await bcrypt.compare(password, user.rows[0].password_hash);
        if (!validPass) return res.status(400).json({ error: 'Invalid password' });

        const token = jwt.sign({ id: user.rows[0].id, role: user.rows[0].role }, SLSA_JWT_SECRET);
        res.json({ token, user: { id: user.rows[0].id, name: user.rows[0].name, role: user.rows[0].role } });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// --- JOB ROUTES ---
app.get('/api/jobs', async (req, res) => {
    try {
        const result = await pool.query('SELECT j.*, u.name as recruiter_name FROM jobs j LEFT JOIN users u ON j.recruiter_id = u.id WHERE j.status = \'approved\' ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
});

app.post('/api/jobs', authenticate, async (req, res) => {
    if (req.user.role !== 'recruiter' && req.user.role !== 'admin') return res.status(403).json({ error: 'Only recruiters can post' });
    const { title, company_name, location, description, salary_range } = req.body;
    
    try {
        // Run ML Check on description
        let riskScore = 0;
        try {
            const mlResp = await axios.post(`${ML_API_URL}/predict`, { text: description });
            if (mlResp.data.prediction === 'Fake') riskScore = 80;
        } catch (e) { console.error("ML API Unreachable"); }

        const result = await pool.query(
            'INSERT INTO jobs (recruiter_id, title, company_name, location, description, salary_range, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [req.user.id, title, company_name, location, description, salary_range, riskScore > 70 ? 'pending' : 'approved']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to post job' });
    }
});

// --- SCORING & SIGNALS ---
app.get('/api/scores', async (req, res) => {
    const { company, jobId } = req.query;
    try {
        const effortRes = await pool.query(
            'SELECT SUM(ae.value) as effort, COUNT(*) as app_count FROM applicant_efforts ae JOIN jobs j ON ae.job_id = j.id WHERE j.job_hash = $1 OR j.company_name = $2', 
            [jobId, company]
        );
        const responseRes = await pool.query(
            'SELECT COUNT(*) as responses FROM employer_responses er JOIN jobs j ON er.job_id = j.id WHERE j.job_hash = $1 OR j.company_name = $2', 
            [jobId, company]
        );
        
        const effort = parseInt(effortRes.rows[0].effort) || 0;
        const totalApps = parseInt(effortRes.rows[0].app_count) || 1;
        const responses = parseInt(responseRes.rows[0].responses) || 0;
        
        // Energy Sink Score = Total Effort / (Meaningful Responses + 1)
        const rawScore = (effort / (responses + 1));
        const normalizedScore = Math.min(100, Math.round((rawScore / 500) * 100));

        res.json({
            score: normalizedScore,
            name: company || "Job Profile",
            effortCount: effort,
            responseCount: responses,
            responseRate: Math.round((responses / totalApps) * 100),
            recommendation: normalizedScore > 60 ? "High Energy Sink - Proceed with Caution" : "Efficient Hiring Process",
            traits: normalizedScore > 60 ? 
                [{ label: 'High Effort Sink', type: 'risk' }, { label: 'Low Response Yield', type: 'risk' }] :
                [{ label: 'High Transparency', type: 'success' }, { label: 'Active Recruitment', type: 'success' }]
        });
    } catch (err) {
        res.status(500).json({ error: 'Scoring failed' });
    }
});


app.post('/api/signals', async (req, res) => {
    const { jobId, type, value, metadata } = req.body;
    try {
        // Record signal if job exists by hash
        const job = await pool.query('SELECT id FROM jobs WHERE job_hash = $1', [jobId]);
        if (job.rows.length > 0) {
            await pool.query('INSERT INTO applicant_efforts (job_id, effort_type, value, metadata) VALUES ($1, $2, $3, $4)', [job.rows[0].id, type, value || 1, metadata]);
        }
        res.json({ status: 'recorded' });
    } catch (err) {
        res.status(500).json({ error: 'Signal error' });
    }
});

// --- ADMIN ROUTES ---
app.get('/api/admin/pending', authenticate, adminOnly, async (req, res) => {
    const result = await pool.query('SELECT * FROM jobs WHERE status = \'pending\'');
    res.json(result.rows);
});

app.post('/api/admin/approve', authenticate, adminOnly, async (req, res) => {
    const { jobId, status } = req.body; // status: 'approved' or 'rejected'
    await pool.query('UPDATE jobs SET status = $1 WHERE id = $2', [status, jobId]);
    res.json({ status: 'updated' });
});

app.get('/api/admin/reports', authenticate, adminOnly, async (req, res) => {
    const result = await pool.query('SELECT r.*, j.title, u.name as reporter FROM reports r JOIN jobs j ON r.job_id = j.id JOIN users u ON r.reporter_id = u.id');
    res.json(result.rows);
});

// --- REPORTING ---
app.post('/api/reports', authenticate, async (req, res) => {
    const { jobId, reason } = req.body;
    await pool.query('INSERT INTO reports (job_id, reporter_id, reason) VALUES ($1, $2, $3)', [jobId, req.user.id, reason]);
    res.json({ status: 'reported' });
});

app.listen(PORT, () => {
    console.log(`AESD Full Portal Backend running on port ${PORT}`);
});
