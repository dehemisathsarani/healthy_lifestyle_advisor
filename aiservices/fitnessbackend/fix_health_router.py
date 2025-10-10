#!/usr/bin/env python3
"""Script to fix health router to use health tracking cluster"""

def fix_health_router():
    file_path = "routers/health.py"
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace get_database with get_health_tracking_cluster
    content = content.replace("get_database", "get_health_tracking_cluster")
    
    # Replace COLLECTIONS with HEALTH_COLLECTIONS 
    content = content.replace("COLLECTIONS[", "HEALTH_COLLECTIONS[")
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("Fixed health router successfully!")

if __name__ == "__main__":
    fix_health_router()