import time
import sys
import os

def show_progress(message, duration=1, current=0, total=100):
    """
    Display a progress message with animated dots and optional progress percentage
    """
    if total > 0:
        progress_percent = (current / total) * 100
        sys.stdout.write(f"{message} [{current}/{total}] {progress_percent:.1f}%")
    else:
        sys.stdout.write(message)
    
    sys.stdout.flush()
    
    for i in range(3):
        time.sleep(duration / 3)
        sys.stdout.write('.')
        sys.stdout.flush()
    
    sys.stdout.write(' Done!\n')
    sys.stdout.flush()

def show_progress_bar(message, current, total, bar_length=50):
    """
    Display a progress bar with percentage
    """
    percent = float(current) * 100 / total
    arrow = '-' * int(percent/100 * bar_length - 1) + '>'
    spaces = ' ' * (bar_length - len(arrow))
    
    sys.stdout.write(f"\r{message}: [{arrow}{spaces}] {percent:.1f}%")
    sys.stdout.flush()
    
    if current >= total:
        sys.stdout.write('\n')
        