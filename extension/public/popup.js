document.addEventListener('DOMContentLoaded', async () => {
    const scoreEl = document.getElementById('score');
    const companyEl = document.getElementById('company');
    const recommendationEl = document.getElementById('recommendation');
    const effortEl = document.getElementById('effort');
    const responsesEl = document.getElementById('responses');

    try {
        // 1. Get current tab info
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url) return;

        // 2. Extract company/domain
        const url = new URL(tab.url);
        const domain = url.hostname;
        
        // 3. Fetch score from background/backend
        // For now, we'll request background to fetch it to avoid CORS in popup
        chrome.runtime.sendMessage({ 
            type: 'GET_SCORE', 
            payload: { url: tab.url, domain: domain } 
        }, (response) => {
            if (response && response.data) {
                const data = response.data;
                scoreEl.innerText = data.score;
                companyEl.innerText = data.name || domain;
                recommendationEl.innerText = data.recommendation;
                effortEl.innerText = data.effortCount || 0;
                responsesEl.innerText = data.responseCount || 0;

                // Color coding
                if (data.score > 60) {
                    recommendationEl.className = 'recommendation rec-danger';
                    scoreEl.style.color = '#cf6679';
                } else if (data.score > 30) {
                    recommendationEl.className = 'recommendation rec-warning';
                    scoreEl.style.color = '#ffb74d';
                } else {
                    recommendationEl.className = 'recommendation rec-safe';
                    scoreEl.style.color = '#03dac6';
                }
            } else {
                companyEl.innerText = "No data for this domain.";
            }
        });

    } catch (err) {
        console.error("Popup Error:", err);
        recommendationEl.innerText = "Error loading AESD data.";
    }
});
