from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from fastapi import HTTPException
from pymongo import MongoClient
from config import MONGO_URI, DATABASE_NAME, JWT_SECRET_KEY, JWT_ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
client = MongoClient(MONGO_URI)
db = client[DATABASE_NAME]
users_col = db["users"]

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(password, hashed):
    return pwd_context.verify(password, hashed)

def create_access_token(email: str):
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": email, "exp": expire}
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def signup(email: str, password: str):
    if users_col.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="User already exists")
    hashed = hash_password(password)
    users_col.insert_one({"email": email, "password": hashed})
    return {"message": "User created successfully"}

def login(email: str, password: str):
    user = users_col.find_one({"email": email})
    if not user or not verify_password(password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(email)
    return {"access_token": token}
