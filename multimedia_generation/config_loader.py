# config_loader.py
import os
import csv
from typing import Dict, Any

class ConfigLoader:
    def __init__(self, config_file: str = "config.csv"):
        self.config_file = config_file
        self.config = {}
        self.load_config()
    
    def load_config(self):
        """Load configuration from CSV file"""
        if not os.path.exists(self.config_file):
            raise FileNotFoundError(f"Configuration file '{self.config_file}' not found")
        
        self.config = {}
        with open(self.config_file, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                parameter = row['parameter'].strip()
                value = row['value'].strip()
                
                # Convert numeric values
                if value.isdigit():
                    value = int(value)
                elif value.replace('.', '').isdigit():
                    value = float(value)
                
                self.config[parameter] = value
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value"""
        return self.config.get(key, default)
    
    def get_all(self) -> Dict[str, Any]:
        """Get all configuration values"""
        return self.config.copy()

# Global configuration instance
config = ConfigLoader()