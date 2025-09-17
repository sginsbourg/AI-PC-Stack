from flask import Flask, jsonify
import threading
from system_monitor import SystemMonitor
import time

app = Flask(__name__)
monitor = SystemMonitor()

# Global variables to track progress (these would be updated by other parts of the system)
pdf_processing_complete = False
pdf_count = 0
processed_count = 0
rag_system_ready = False

@app.route('/progress')
def get_progress():
    """Get PDF processing progress"""
    progress = (processed_count / pdf_count * 100) if pdf_count > 0 else 0
    return jsonify({
        'progress': progress,
        'complete': pdf_processing_complete,
        'pdf_count': pdf_count,
        'processed_count': processed_count,
        'rag_ready': rag_system_ready,
        'timestamp': time.time()
    })

@app.route('/system')
def get_system_stats():
    """Get system statistics"""
    return jsonify(monitor.get_stats())

@app.route('/process')
def get_process_stats():
    """Get process statistics"""
    return jsonify(monitor.get_process_stats())

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "timestamp": time.time()})

def start_server(host='127.0.0.1', port=5000):
    """Start the status server"""
    print(f"Starting status server on http://{host}:{port}")
    app.run(host=host, port=port, debug=False, use_reloader=False)

if __name__ == "__main__":
    start_server()
    