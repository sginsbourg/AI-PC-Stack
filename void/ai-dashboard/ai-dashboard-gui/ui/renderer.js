 // Renderer Process: Handles UI updates and sends commands via IPC to main.js

// Access to Electron's IPC module. NOTE: This requires nodeIntegration: true in main.js
// For proper security, a preload script should be used instead of direct 'require'.
const { ipcRenderer } = require('electron'); 

document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('service-table-body');
    const voidStatusEl = document.getElementById('void-status');
    const detailsView = document.getElementById('details-view');
    const logContent = document.getElementById('log-content');
    const detailName = document.getElementById('detail-name');

    // Polling function to get updated status from the Main Process
    async function updateDashboard() {
        // Fetch data from the main process
        const data = await ipcRenderer.invoke('get-all-services'); 
        
        voidStatusEl.textContent = 'Void AI Status: ' + data.voidStatus;

        // Clear and rebuild the table body
        tableBody.innerHTML = '';
        
        data.services.forEach(service => {
            const row = tableBody.insertRow();
            
            // Generate a CSS-friendly status class
            const statusClass = service.status.toLowerCase().replace(/ /g, '-').replace('ok', 'status');

            row.insertCell().textContent = service.name;
            row.insertCell().textContent = service.port;
            
            const statusCell = row.insertCell();
            statusCell.textContent = service.icon + ' ' + service.status;
            statusCell.className = `status-${statusClass}`;

            row.insertCell().textContent = `${service.pid} / ${service.uptime}`;
            row.insertCell().textContent = service.responseTime;

            // Actions Cell
            const actionsCell = row.insertCell();
            const restartBtn = document.createElement('button');
            restartBtn.textContent = 'Restart';
            restartBtn.onclick = () => ipcRenderer.invoke('restart-service', service.name);
            actionsCell.appendChild(restartBtn);

            const logBtn = document.createElement('button');
            logBtn.textContent = 'View Log';
            logBtn.style.marginLeft = '5px';
            logBtn.onclick = () => showServiceLog(service.name);
            actionsCell.appendChild(logBtn);
        });
    }

    async function showServiceLog(serviceName) {
        // Fetch log content from the main process
        const log = await ipcRenderer.invoke('get-service-log', serviceName);
        
        detailName.textContent = serviceName;
        logContent.textContent = log;
        detailsView.style.display = 'block';
    }

    // Set up button listeners
    document.getElementById('restart-all-btn').addEventListener('click', () => ipcRenderer.invoke('restart-all-services'));
    document.getElementById('launch-void-btn').addEventListener('click', () => ipcRenderer.invoke('launch-void'));

    // Start polling the dashboard data every 2 seconds
    setInterval(updateDashboard, 2000);
    updateDashboard(); // Initial call
});