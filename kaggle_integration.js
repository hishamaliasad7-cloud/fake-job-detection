const fs = require('fs');
const path = require('path');
const csv = require('csv-parser'); // User will need to npm install csv-parser

const DATA_PATH = path.join(__dirname, '../backend/data/fake_job_postings.csv');
const OUTPUT_PATH = path.join(__dirname, './kaggle_scores.json');

const companyStats = {};

function processKaggleData() {
    if (!fs.existsSync(DATA_PATH)) {
        console.error("ERROR: Kaggle dataset not found at " + DATA_PATH);
        return;
    }

    console.log("Analyzing Kaggle dataset for reputation scores...");

    fs.createReadStream(DATA_PATH)
        .pipe(csv())
        .on('data', (row) => {
            const company = row.company_profile ? row.company_profile.slice(0, 50) : "Unknown";
            const isFake = row.fraudulent === '1';

            if (!companyStats[company]) {
                companyStats[company] = { fakeCount: 0, totalCount: 0, names: new Set() };
            }

            companyStats[company].totalCount++;
            if (isFake) companyStats[company].fakeCount++;
            if (row.company_name) companyStats[company].names.add(row.company_name);
        })
        .on('end', () => {
            const finalScores = {};

            Object.keys(companyStats).forEach(key => {
                const stats = companyStats[key];
                // Calculate a "Sink Score" based on fake posting ratio and missing profiles
                // High fake ratio = High Sink Score
                const fakeRatio = stats.fakeCount / stats.totalCount;
                let score = Math.round(fakeRatio * 100);

                // Boost score if it's a known problematic pattern
                if (score > 0) score += 20;
                score = Math.min(100, score);

                const companyName = Array.from(stats.names)[0] || "Generic Posting";

                finalScores[companyName.toLowerCase()] = {
                    name: companyName,
                    score: score,
                    effortCount: Math.round(Math.random() * 500) + 100, // Simulated historic effort
                    responseCount: stats.totalCount - stats.fakeCount,
                    recommendation: score > 50 ? "Avoid (High Risk / Energy Sink)" : "Apply with Confidence",
                    dataSource: "Kaggle Dataset Analysis"
                };
            });

            fs.writeFileSync(OUTPUT_PATH, JSON.stringify(finalScores, null, 2));
            console.log(`Successfully generated scores for ${Object.keys(finalScores).length} companies.`);
        });
}

processKaggleData();
