import time
import sys
import os

def show_progress(message, duration=1):
    """
    Display a progress message with animated dots
    """
    sys.stdout.write(message)
    sys.stdout.flush()
    
    for i in range(3):
        time.sleep(duration / 3)
        sys.stdout.write('.')
        sys.stdout.flush()
    
    sys.stdout.write(' Done!\n')
    sys.stdout.flush()

if __name__ == "__main__":
    # Example usage
    show_progress("Loading PDF files", 2)
    show_progress("Initializing AI models", 3)
    show_progress("Building knowledge base", 2)
