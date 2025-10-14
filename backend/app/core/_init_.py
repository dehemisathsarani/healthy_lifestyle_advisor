from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello World"}
from backend.app.core.database import connect_to_mongo, close_mongo_connection, get_database, verify_database