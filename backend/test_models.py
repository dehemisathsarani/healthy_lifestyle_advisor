from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum

class GenderEnum(str, Enum):
    MALE = "male"
    FEMALE = "female"

class TestModel(BaseModel):
    name: str = Field(..., min_length=1)
    age: int = Field(..., ge=0)

print("Test model created successfully")
