// AESD Background Service Worker
const BASE_URL = 'http://localhost:3000';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SIGNAL_EVENT') {
        handleSignal(message.payload);
        return true;
    }
    if (message.type === 'GET_SCORE') {
        fetchScore(message.payload).then(sendResponse);
        return true; // Keep async channel open
    }
});

async function handleSignal(data) {
    console.log("AESD Background: Processing signal", data.type);

    const hashedUrl = await hashString(new URL(data.url).origin + new URL(data.url).pathname);
    const domain = new URL(data.url).hostname;

    const payload = {
        ...data,
        jobId: hashedUrl,
        company: domain.split('.')[1] || domain // Simple extraction for demo
    };

    try {
        await fetch(`${BASE_URL}/api/signals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (error) {
        console.error("AESD Sync Error:", error);
    }
}

async function fetchScore(payload) {
    try {
        const hashedUrl = await hashString(new URL(payload.url).origin + new URL(payload.url).pathname);
        const company = payload.domain.split('.')[1] || payload.domain;
        
        const response = await fetch(`${BASE_URL}/api/scores?jobId=${hashedUrl}&company=${company}`);
        const data = await response.json();
        return { data };
    } catch (err) {
        console.error("Fetch Score Error:", err);
        return { error: err.message };
    }
}

// SHA-256 Hash
async function hashString(str) {
    const msgUint8 = new TextEncoder().encode(str);
    const hashBuffer = await chrome.crypto ? await crypto.subtle.digest('SHA-256', msgUint8) : msgUint8; // Fallback for simple env
    
    // In actual extension, use crypto.subtle.digest
    // For this environment mocking:
    if (!crypto.subtle) {
        return str.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0).toString(16);
    }
    
    const hashArray = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', msgUint8)));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

// Listen for redirects (Sign of response)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        const url = tab.url;
        const responseKeywords = ['calendly', 'hirevue', 'thank-you', 'submitted', 'application-received', 'confirmation'];
        if (responseKeywords.some(kw => url.toLowerCase().includes(kw))) {
            handleSignal({
                type: 'observed_response',
                url: url,
                metadata: { type: 'redirect_match', keyword: url },
                timestamp: Date.now()
            });
        }
    }
});

