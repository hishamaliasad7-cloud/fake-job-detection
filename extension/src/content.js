// AESD Content Script - Advanced Effort Tracking
console.log("AESD: Monitoring applicant effort...");

let effortStats = {
    clickCount: 0,
    fieldInputs: new Set(), // Track unique fields
    startTime: Date.now(),
    lastHeartbeat: Date.now(),
    isSubmitting: false
};

// 1. Track Clicks
document.addEventListener('click', (e) => {
    effortStats.clickCount++;
    // Only send major clicks to avoid noise
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') {
        sendSignal('click', 1, { element: e.target.innerText || e.target.tagName });
    }
});

// 2. Track Form Inputs (Unique fields)
document.addEventListener('input', (e) => {
    if (e.target.name || e.target.id) {
        effortStats.fieldInputs.add(e.target.name || e.target.id);
    }
});

// 3. Track File Uploads
document.addEventListener('change', (e) => {
    if (e.target.type === 'file') {
        sendSignal('file_upload', 100, { type: 'resume' }); // Upload is worth 100 effort units
        console.log("AESD: Resume upload detected.");
    }
});

// 4. Periodic Heartbeat (Track Time Spent)
setInterval(() => {
    const now = Date.now();
    const idleThreshold = 30000; // 30 seconds idle
    if (now - effortStats.lastHeartbeat < idleThreshold) {
        sendSignal('time_spent', 10, { unit: 'seconds' }); // Send 10s of effort
    }
}, 10000);

if (window.location.href.includes("greenhouse.io")) {
  console.log("JobZoid: Job application detected");

  // Anonymized signal hashing would happen here
  fetch("http://localhost:8000/api/signals", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      type: "ATS_SUBMISSION",
      payload: {
        platform: "greenhouse",
        timestamp: Date.now()
      }
    })
  }).catch(e => console.warn("JobZoid Signal Error:", e));
}

// Detect submission buttons in common ATS
document.addEventListener('click', (e) => {
    if (e.target.innerText?.toLowerCase().includes('submit application')) {
        console.log("JobZoid: Possible submission detected");
    }
});

// Update last heartbeat on any activity
['mousemove', 'keydown', 'scroll', 'click'].forEach(evt => {
    document.addEventListener(evt, () => {
        effortStats.lastHeartbeat = Date.now();
    });
});

// 5. Detect 'Submit' button click
document.addEventListener('submit', (e) => {
    effortStats.isSubmitting = true;
    sendSignal('application_submitted', effortStats.fieldInputs.size * 10, {
        totalClicks: effortStats.clickCount,
        uniqueFields: effortStats.fieldInputs.size,
        totalTime: Math.floor((Date.now() - effortStats.startTime) / 1000)
    });
    console.log("AESD: Application submission detected!");
});

// Helper to send signals
function sendSignal(type, value, metadata) {
    chrome.runtime.sendMessage({
        type: 'SIGNAL_EVENT',
        payload: {
            type,
            value,
            metadata,
            url: window.location.href,
            timestamp: Date.now()
        }
    });
}

