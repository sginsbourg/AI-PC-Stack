```javascript
// Client-side debug logging
const debugLog = (message, level = 'debug') => {
    const timestamp = new Date().toISOString();
    console[level]('[' + timestamp + '] ' + message);
};

document.addEventListener('DOMContentLoaded', () => {
    debugLog('DOM loaded, fetching apps');
    fetchApps();

    document.querySelector('.apps-container').addEventListener('click', async (e) => {
        if (e.target.classList.contains('launch-btn')) {
            const filename = e.target.dataset.filename;
            if (!filename) {
                updateStatus('Error: No filename associated with button', 'error');
                debugLog('No filename for launch button', 'error');
                return;
            }
            debugLog('Launching app with filename: ' + filename);
            await launchApp(filename);
        }
    });

    // Add debug button to UI
    const debugBtn = document.createElement('button');
    debugBtn.textContent = 'Debug Info';
    debugBtn.className = 'debug-btn';
    debugBtn.onclick = fetchDebugInfo;
    document.querySelector('.form-section').appendChild(debugBtn);
});

async function fetchDebugInfo() {
    try {
        debugLog('Fetching debug info from /api/debug');
        const response = await fetch('/api/debug');
        if (!response.ok) throw new Error('HTTP error! Status: ' + response.status);
        const data = await response.json();
        debugLog('Debug info: ' + JSON.stringify(data));
        updateStatus('Debug info fetched, check console', 'info');
    } catch (error) {
        updateStatus('Error fetching debug info: ' + error.message, 'error');
        debugLog('Error fetching debug info: ' + error.message + ', Stack: ' + error.stack, 'error');
    }
}

async function fetchApps() {
    try {
        debugLog('Fetching apps from /api/apps');
        const response = await fetch('/api/apps');
        if (!response.ok) throw new Error('HTTP error! Status: ' + response.status);
        const data = await response.json();
        if (data.success) {
            debugLog('Apps fetched: ' + data.apps.length + ' apps');
            renderApps(data.apps);
        } else {
            updateStatus('Failed to load apps: ' + data.message, 'error');
            debugLog('Failed to load apps: ' + data.message, 'error');
        }
    } catch (error) {
        updateStatus('Error fetching apps: ' + error.message, 'error');
        debugLog('Fetch apps error: ' + error.message + ', Stack: ' + error.stack, 'error');
    }
}

function renderApps(apps) {
    debugLog('Rendering ' + apps.length + ' apps');
    const container = document.querySelector('.apps-container');
    if (apps.length === 0) {
        container.innerHTML = '<p class="no-apps">No applications added yet. Use the form below to add a new application.</p>';
        return;
    }
    container.innerHTML = apps.map((app, index) => `
        <div class="app-card">
            <div class="card-header">
                <h3>${app.app_name}</h3>
            </div>
            <div class="card-content">
                <p><strong>Description:</strong> ${app.description}</p>
                <p><strong>File:</strong> ${app.filename}</p>
                <p><strong>URL:</strong> ${app.url || 'N/A'}</p>
                <p><strong>Status:</strong> <span class="status ${app.status_class}">${app.status || 'Not launched'}</span></p>
            </div>
            <div class="card-actions">
                <button class="launch-btn" data-filename="${app.filename}">Launch</button>
                <button class="open-btn" ${!app.url ? 'disabled' : ''} onclick="window.open('${app.url}', '_blank')">Open</button>
                <button class="edit-btn" data-index="${index}">Edit</button>
                <button class="delete-btn" data-index="${index}">Delete</button>
            </div>
        </div>
    `).join('');
}

async function launchApp(filename) {
    try {
        updateStatus('Launching ' + filename + '...', 'info');
        debugLog('Sending launch request for ' + filename);
        const response = await fetch('/api/launch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filenames: [filename] })
        });
        if (!response.ok) throw new Error('HTTP error! Status: ' + response.status);
        const results = await response.json();
        debugLog('Launch response: ' + JSON.stringify(results));
        results.forEach(result => {
            updateStatus(result.message, result.success ? 'success' : 'error');
        });
    } catch (error) {
        updateStatus('Error launching app: ' + error.message, 'error');
        debugLog('Launch error: ' + error.message + ', Stack: ' + error.stack, 'error');
    }
}

function updateStatus(message, statusClass) {
    const statusEl = document.querySelector('.status');
    statusEl.textContent = message;
    statusEl.className = 'status ' + statusClass;
    debugLog('Status updated: ' + message + ' (' + statusClass + ')');
}
```