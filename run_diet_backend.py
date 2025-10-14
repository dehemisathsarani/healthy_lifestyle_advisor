"""
Simple script to start Diet Agent backend
"""
import os
import sys

# Change to the correct directory
diet_services_path = r"C:\Users\Asus\Desktop\healthy_lifestyle_advisor\aiservices\dietaiservices"
os.chdir(diet_services_path)

print(f"Changed directory to: {os.getcwd()}")
print("Starting Diet Agent Backend Service on port 8001...")
print("Using MongoDB Atlas: healthagent.ucnrbse.mongodb.net")
print("="*70)

# Start main.py directly (it uses uvicorn internally)
exec(open('main.py').read())
