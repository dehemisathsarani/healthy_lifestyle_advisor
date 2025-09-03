from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import your routers
from app.routes import backup, encrypt_decrypt, right_to_forget, weekly_report

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # frontend URL
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(weekly_report.router, prefix="/weeklyreport")
app.include_router(backup.router, prefix="/backup")
app.include_router(right_to_forget.router, prefix="/righttoforget")
app.include_router(encrypt_decrypt.router, prefix="/encryptdecrypt")

