# AI Hub Dashboard

The AI Hub Dashboard is a web-based application designed to manage and launch AI-related applications on a local machine. It provides a user-friendly interface to add, edit, delete, and launch applications (via batch files) while handling prerequisites and monitoring their status. The application is built using Node.js, Express, and vanilla JavaScript, with a simple HTML/CSS front-end.

## Features

- **Application Management**: Add, edit, delete, and launch AI applications via a web interface.
- **Configuration Persistence**: Store and manage application configurations in a `config.json` file.
- **Prerequisite Handling**: Ensure required applications are running before launching dependent ones.
- **Status Monitoring**: Display real-time status updates for launched applications.
- **Verbose Logging**: Detailed server-side logs for debugging launch issues.
- **Cross-Origin Support**: Accessible via HTTP with CORS enabled for flexibility.

## Project Structure

- `server.js`: Node.js/Express server handling API endpoints, application launching, and configuration management.
- `app.js`: Client-side JavaScript for dynamic UI interactions and API communication.
- `index.html`: HTML front-end for the dashboard interface.
- `style.css`: CSS for styling the dashboard (not included here, assumed to exist).
- `config.json`: JSON file storing application configurations.
- `start_ai_hub.bat`: Batch file to start the server.

## File Details

### server.js

The `server.js` file is the backbone of the AI Hub Dashboard, running an Express server on port 7860. It handles API requests, launches batch files, manages configurations, and provides verbose logging for debugging.

**Functionality**:
- **Server Setup**:
  - Runs an Express server on `http://127.0.0.1:7860`.
  - Serves static files (e.g., `index.html`, `app.js`, `style.css`) from the project directory.
  - Configures CORS headers to allow cross-origin requests.
- **API Endpoints**:
  - `GET /api/health`: Returns server status for debugging.
  - `GET /api/apps`: Retrieves the list of applications from `config.json`.
  - `POST /api/add-app`: Adds a new application to the configuration.
  - `DELETE /api/delete-app`: Deletes an application by index.
  - `PUT /api/save-config`: Saves the entire application configuration.
  - `POST /api/launch`: Launches one or more applications by executing their batch files.
  - `POST /api/test-launch`: Test endpoint for launching applications (same logic as `/api/launch`).
  - `GET /`: Serves the `index.html` file.
- **Configuration Management**:
  - Loads and saves application configurations to `config.json` using `fs-extra`.
  - Creates a default empty configuration if `config.json` is missing.
- **Application Launching**:
  - Normalizes Windows file paths to handle malformed inputs (e.g., `C:Users` to `C:\Users`).
  - Checks if batch files exist before launching.
  - Verifies prerequisites by checking if required applications’ URLs are accessible (using port checks).
  - Launches batch files in new console windows using `cmd.exe /c start`.
  - Captures stdout/stderr for debugging and logs exit codes.
  - Updates application status in `config.json` based on launch success or failure (port check for apps with URLs).
- **Logging**:
  - Uses `console.log`, `console.error`, and `console.warn` for verbose logging of all operations, including path normalization, file existence checks, prerequisite validation, and process execution.
  - Logs are prefixed with `VERBOSE` for debugging details.
- **Port Checking**:
  - Uses the `net` module to check if application URLs (e.g., `http://localhost:7860`) are accessible by testing port connectivity.
- **Automatic Browser Launch**:
  - Opens `http://127.0.0.1:7860` in the default browser on server start (Windows only).

**Dependencies**:
- `express`: For the web server.
- `body-parser`: To parse JSON request bodies.
- `fs-extra`: For file operations (e.g., reading/writing `config.json`).
- `child_process`: To spawn batch file processes.
- `path`: For file path