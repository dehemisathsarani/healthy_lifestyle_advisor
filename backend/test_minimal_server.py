#!/usr/bin/env python3
"""
Minimal server test to isolate the shutdown issue
"""

from fastapi import FastAPI
import uvicorn
import asyncio

app = FastAPI(title="Minimal Test Server")

@app.get("/")
async def root():
    return {"message": "Server is running"}

@app.get("/health")
async def health():
    return {"status": "ok", "message": "Minimal server is healthy"}

if __name__ == "__main__":
    print("🚀 Starting minimal test server...")
    uvicorn.run(app, host="127.0.0.1", port=8001, log_level="info")