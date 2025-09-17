import psutil
import time
from datetime import datetime

class SystemMonitor:
    def __init__(self):
        self.start_time = datetime.now()
        self.cpu_usage = 0
        self.memory_usage = 0
        self.disk_usage = 0
        self.network_usage = {"sent": 0, "recv": 0}
        
    def get_stats(self):
        """Get current system statistics"""
        # CPU usage
        self.cpu_usage = psutil.cpu_percent(interval=1)
        
        # Memory usage
        memory = psutil.virtual_memory()
        self.memory_usage = memory.percent
        
        # Disk usage
        disk = psutil.disk_usage('/')
        self.disk_usage = disk.percent
        
        # Network usage
        net_io = psutil.net_io_counters()
        self.network_usage = {
            "sent": net_io.bytes_sent,
            "recv": net_io.bytes_recv
        }
        
        # Uptime
        uptime = datetime.now() - self.start_time
        hours, remainder = divmod(uptime.total_seconds(), 3600)
        minutes, seconds = divmod(remainder, 60)
        uptime_str = f"{int(hours):02d}:{int(minutes):02d}:{int(seconds):02d}"
        
        return {
            "cpu": self.cpu_usage,
            "memory": self.memory_usage,
            "disk": self.disk_usage,
            "network": self.network_usage,
            "uptime": uptime_str,
            "timestamp": datetime.now().isoformat()
        }
    
    def get_process_stats(self):
        """Get statistics about the current process"""
        process = psutil.Process()
        return {
            "pid": process.pid,
            "name": process.name(),
            "status": process.status(),
            "memory": process.memory_info().rss,
            "threads": process.num_threads(),
            "cpu_percent": process.cpu_percent(interval=0.1)
        }
        