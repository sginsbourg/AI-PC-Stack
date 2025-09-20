```javascript
document.addEventListener('DOMContentLoaded', () => {
    fetchApps(); // Load apps on page load

    // Attach event listeners to dynamically created launch buttons
    document.querySelector('.apps-container').addEventListener('click', async (e) => {
        if (e.target.classList.contains('launch-btn')) {
            const filename = e.target.dataset.filename;
            if (!filename) {
                updateStatus('Error: No filename associated with button', 'error');
                return;
            }
            await launchApp(filename);
        }
    });
});

async function fetchApps() {
    try {
        const response = await fetch('/api/apps');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        if (data.success) {
            renderApps(data.apps);
        } else {
            updateStatus(`Failed to load apps: ${data.message}`, 'error');
        }
    } catch (error) {
        updateStatus(`Error fetching apps: ${error.message}`, 'error');
        console.error('Fetch apps error:', error);
    }
}

function renderApps(apps) {
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
        updateStatus(`Launching ${filename}...`, 'info');
        const response = await fetch('/api/launch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filenames: [filename] })
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const results = await response.json();
        results.forEach(result => {
            updateStatus(result.message, result.success ? 'success' : 'error');
        });
    } catch (error) {
        updateStatus(`Error launching app: ${error.message}`, 'error');
        console.error('Launch error:', error);
    }
}

function updateStatus(message, statusClass) {
    const statusEl = document.querySelector('.status');
    statusEl.textContent = message;
    statusEl.className = `status ${statusClass}`;
}
```