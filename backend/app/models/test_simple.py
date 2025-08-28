from pydantic import BaseModel

class TestModel(BaseModel):
    name: str
    age: int

print("Diet models loaded successfully")
