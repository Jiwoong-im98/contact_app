from pydantic import BaseModel, Field
from typing import Optional, List

class SignupIn(BaseModel):
    username: str = Field(..., min_length=4, max_length=20, pattern="^[a-z0-9]+$")
    password: str = Field(..., min_length=4, max_length=20)

class UserOut(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True

class ContactCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=5)
    phone: str = Field(..., pattern="^010\\d{8}$")
    addr: str = ""
    category_id: int

class ContactUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=5)
    phone: Optional[str] = Field(None)
    addr: Optional[str] = None
    category_id: Optional[int] = None

    class Config:
        validate_assignment = True

    @property
    def has_phone(self):
        return self.phone is not None

class ContactOut(BaseModel):
    id: int
    name: str
    phone: str
    addr: str
    category_id: int
    category_name: str

    class Config:
        from_attributes = True

class ContactListOut(BaseModel):
    total: int
    items: List[ContactOut]

class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=10)

class CategoryUpdate(BaseModel):
    name: str = Field(..., min_length=1, max_length=10)

class CategoryOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True
