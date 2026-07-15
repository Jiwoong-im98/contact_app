from fastapi import APIRouter, Depends, HTTPException, Cookie
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import crud

router = APIRouter(prefix="/contacts", tags=["contacts"])

def get_current_user(session_id: str | None = Cookie(default=None), db: Session = Depends(get_db)) -> models.User:
    if not session_id:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다")
    user = crud.get_user_by_session(db, session_id)
    if not user:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다")
    return user

@router.get("", response_model=schemas.ContactListOut)
def list_contacts(name: str = None, category_id: int = None, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    contacts = crud.list_contacts(db, user.id, name, category_id)
    items = []
    for contact in contacts:
        category = db.query(models.Category).filter(models.Category.id == contact.category_id).first()
        items.append(schemas.ContactOut(
            id=contact.id,
            name=contact.name,
            phone=contact.phone,
            addr=contact.addr,
            category_id=contact.category_id,
            category_name=category.name if category else ""
        ))
    return schemas.ContactListOut(total=len(items), items=items)

@router.post("", status_code=201, response_model=schemas.ContactOut)
def create_contact(data: schemas.ContactCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    category = crud.get_my_category(db, user.id, data.category_id)
    if not category:
        raise HTTPException(status_code=404, detail="카테고리를 찾을 수 없습니다")

    existing = db.query(models.Contact).filter(
        models.Contact.user_id == user.id,
        models.Contact.phone == data.phone
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="이미 등록된 전화번호입니다")

    contact = crud.create_contact(db, user.id, data)
    return schemas.ContactOut(
        id=contact.id,
        name=contact.name,
        phone=contact.phone,
        addr=contact.addr,
        category_id=contact.category_id,
        category_name=category.name
    )

@router.patch("/{contact_id}", response_model=schemas.ContactOut)
def update_contact(contact_id: int, data: schemas.ContactUpdate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    contact = crud.get_my_contact(db, user.id, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="해당 연락처가 없습니다")

    if data.category_id:
        category = crud.get_my_category(db, user.id, data.category_id)
        if not category:
            raise HTTPException(status_code=404, detail="카테고리를 찾을 수 없습니다")

    if data.phone is not None:
        # 전화번호 형식 검증
        import re
        if not re.match("^010\\d{8}$", data.phone):
            raise HTTPException(status_code=422, detail="전화번호 형식이 올바르지 않습니다")

        existing = db.query(models.Contact).filter(
            models.Contact.user_id == user.id,
            models.Contact.phone == data.phone,
            models.Contact.id != contact_id
        ).first()
        if existing:
            raise HTTPException(status_code=409, detail="이미 등록된 전화번호입니다")

    updated = crud.update_contact(db, contact, data)
    category = db.query(models.Category).filter(models.Category.id == updated.category_id).first()
    return schemas.ContactOut(
        id=updated.id,
        name=updated.name,
        phone=updated.phone,
        addr=updated.addr,
        category_id=updated.category_id,
        category_name=category.name if category else ""
    )

@router.delete("/{contact_id}", status_code=204)
def delete_contact(contact_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    contact = crud.get_my_contact(db, user.id, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="해당 연락처가 없습니다")
    crud.delete_contact(db, contact)
