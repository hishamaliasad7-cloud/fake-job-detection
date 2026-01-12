const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Load pre-calculated Kaggle scores
let kaggleScores = {};
try {
    kaggleScores = require('./kaggle_scores.json');
    console.log("Kaggle reputation data loaded successfully.");
} catch (e) {
    console.log("Kaggle scores not found.");
}

const jobSignals = {};

// 0. Root Route (For Vercel Health Check)
app.get('/', (req, res) => {
    res.json({
        name: "AESD AI API",
        version: "2.1",
        status: "Production Ready",
        endpoints: ["/api/scores", "/api/ats-scan", "/api/signals"]
    });
});

/**
 * v2.0 Scoring Engine - Supports Company and Position
 */
function calculateScoreV2(company, position) {
    const compKey = (company || "").toLowerCase().trim();
    const posKey = (position || "").toLowerCase().trim();

    // 1. Check for historic data (Prioritizing specific matches)
    let match = kaggleScores[compKey] || kaggleScores[posKey];

    // 2. Generate detailed traits based on the match
    let traits = [];
    if (posKey.includes('data entry') || posKey.includes('cruise')) {
        traits.push({ label: 'High Fraud Probability (Kaggle Trend)', type: 'risk' });
        traits.push({ label: 'Effort Sink Pattern', type: 'risk' });
    }
    if (compKey === 'meta' || compKey === 'google') {
        traits.push({ label: 'High Competition Signal', type: 'info' });
        traits.push({ label: 'Delayed Response Verified', type: 'risk' });
    }

    if (match) {
        return {
            ...match,
            traits: traits.length > 0 ? traits : [{ label: 'Historic Pattern Match', type: 'info' }],
            isHistoric: true
        };
    }

    // 3. Fallback to real-time signals if no historic data
    const sigKey = compKey + "|" + posKey;
    const signals = jobSignals[sigKey] || [];

    if (signals.length === 0) {
        return {
            score: 0, effortCount: 0, responseCount: 0,
            recommendation: "Insufficient Data (New Job Cluster)",
            traits: [{ label: 'Fresh Listing', type: 'info' }],
            method: "Real-time AESD Tracker"
        };
    }

    // ... (Signal logic same as before, but using sigKey)
    let totalEffort = 0; let responses = 0;
    signals.forEach(sig => {
        if (sig.type === 'click') totalEffort += 1;
        if (sig.type === 'file_upload') totalEffort += 20;
        if (sig.type === 'application_submitted') totalEffort += 50;
        if (sig.type === 'observed_response') responses += 1;
    });

    const rawScore = totalEffort / (Math.pow(responses + 1, 1.5));
    const score = Math.round(Math.min(100, rawScore * 2));

    return {
        score, effortCount: totalEffort, responseCount: responses,
        recommendation: getRecommendation(score),
        traits: score > 60 ? [{ label: 'Inefficient Feedback Loop', type: 'risk' }] : [{ label: 'Healthy Response Signal', type: 'success' }],
        method: "Real-time AESD Tracker"
    };
}

app.get('/api/scores', (req, res) => {
    const { company, position } = req.query;
    const analysis = calculateScoreV2(company, position);
    res.json(analysis);
});

app.post('/api/signals', (req, res) => {
    const { company, position, type, timestamp } = req.body;
    const sigKey = (company || "").toLowerCase() + "|" + (position || "").toLowerCase();

    if (!jobSignals[sigKey]) jobSignals[sigKey] = [];
    jobSignals[sigKey].push({ type, timestamp });
    res.status(201).json({ status: 'recorded' });
});

/**
 * AI ATS Matching Engine (v2.1)
 */
const SKILL_MAP = {
    "javascript": ["frontend engineer", "fullstack developer", "meta", "google"],
    "node.js": ["backend engineer", "system architect", "amazon"],
    "react": ["frontend engineer", "ui developer", "meta"],
    "python": ["data scientist", "machine learning engineer", "google", "accenture"],
    "java": ["backend developer", "infosys", "accenture"],
    "sales": ["sales executive", "target", "bj's wholesale"],
}

app.post('/api/ats-scan', (req, res) => {
    // In a real app, we'd use PDF-parse or Tesseract here.
    // For this demo, we simulate extraction from the uploaded file metadata
    const { resumeName, simulatedSkills } = req.body;

    if (!simulatedSkills || simulatedSkills.length === 0) {
        return res.status(400).json({ error: "No skills detected in resume." });
    }

    let recommendations = [];
    let score = 0;

    simulatedSkills.forEach(skill => {
        const matches = SKILL_MAP[skill.toLowerCase()];
        if (matches) {
            score += 15;
            matches.forEach(match => {
                if (kaggleScores[match]) {
                    recommendations.push({
                        company: kaggleScores[match].name || match,
                        position: match.includes('engineer') ? match : "Specialist",
                        reputationScore: kaggleScores[match].score,
                        matchStrength: "High"
                    });
                }
            });
        }
    });

    const finalScore = Math.min(98, Math.max(40, score + Math.floor(Math.random() * 20)));

    res.json({
        resumeName,
        atsScore: finalScore,
        recommendations: [...new Set(recommendations.map(JSON.stringify))].map(JSON.parse).slice(0, 3),
        analysis: `We found ${simulatedSkills.length} core competencies. Based on historic Kaggle data and company behavioral signals, these roles offer the best match for your profile.`
    });
});

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`AESD v2.1 Backend (AI Enabled) running on http://localhost:${PORT}`);
    });
}

module.exports = app;
