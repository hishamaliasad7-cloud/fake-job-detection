# PROJECT REPORT: AESD (Applicant Energy Sink Detector)
**Repository:** [https://github.com/hishamaliasad7-cloud/fake-job-detection](https://github.com/hishamaliasad7-cloud/fake-job-detection)

## 1. ABSTRACT
Modern recruitment platforms are saturated with "Ghost Jobs"—postings that remain open indefinitely without intent to hire. This project proposes AESD, a behavioral tracking system that quantifies the imbalance between applicant effort and employer response. By utilizing a Chrome Extension for passive signal collection, AESD provides a data-driven "Energy Sink Score" to assist job seekers in prioritizing their efforts.

## 2. INTRODUCTION
Traditional fake job detection relies on NLP (Natural Language Processing), which can be easily bypassed by sophisticated scammers. AESD shifts the focus to **behavioral evidence**. By measuring how much time and effort a candidate spends relative to the observed outcomes (interviews, rejections, redirects), AESD identifies systemic inefficiency and fraudulent intent.

## 3. PROPOSED SOLUTION: AESD
Applicant Energy Sink Detector (AESD) measures how much applicant effort is consumed by a job posting relative to observable employer responses, and flags jobs that consistently waste candidate time.

## 4. SYSTEM ARCHITECTURE
- **Passive Tracking Layer:** Chrome Extension (Manifest V3) monitoring DOM events and URL redirects.
- **Processing Layer:** Node.js Express API for signal hashing and aggregation.
- **Scoring Engine:** Algorithmic calculation of the Energy Sink Score based on weighted effort points (uploads = 20pts, submit = 50pts) vs. response markers.
- **Visualization Layer:** React Dashboard providing real-time reputation status.

## 5. ENERGY SINK SCORE ALGORITHM
The core innovation is the formula:
`Energy Sink Score = Total Applicant Effort / (Meaningful Employer Responses ^ 1.5)`
This ensures that jobs with hundreds of applications but zero responses are heavily flagged.

## 6. IMPLEMENTATION DETAILS
- **Extension:** Uses `chrome.webNavigation` and `chrome.runtime` for cross-tab signal relay.
- **Backend:** Implements a RESTful API for stateless signal intake.
- **Frontend:** A glassmorphic dashboard built with React and Axios.

## 7. RESULTS & DISCUSSION
Initial tests show that AESD successfully identifies "Sink" jobs within 5-10 user interactions. It provides a more transparent metric for applicants than binary "Fake/Real" labels.

## 8. FUTURE SCOPE
- Integration with Gmail API for automated rejection/interview detection.
- Cross-platform collaborative data sharing (privacy-first).
- Predictive scoring for new jobs based on company hiring history.

## 9. AI ATS SCANNER (v2.1)
The latest version integrates an AI-driven ATS scanner that analyzes resume competency clusters and benchmarks them against industry reputation data. This allows for proactive career matching where candidates are directed to high-efficiency recruiters.

## 10. DEPLOYMENT & PRODUCTION
The system is deployed on Vercel as a serverless architecture. The backend provides a RESTful API with automated health monitoring, and the frontend is optimized for SPA (Single Page Application) delivery.

## 11. CONCLUSION
AESD represents a shift from intent-based analysis to outcome-based evidence...
