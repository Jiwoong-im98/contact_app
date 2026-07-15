import secrets
from sqlalchemy.orm import Session
from sqlalchemy import and_
from models import User, LoginSession, Category, Contact
import schemas
from security import hash_password, verify_password

def create_user(db: Session, username: str, password: str) -> User:
    if db.query(User).filter(User.username == username).first():
        return None

    hashed_pw = hash_password(password)
    user = User(username=username, password_hash=hashed_pw)
    db.add(user)
    db.flush()

    default_categories = [
        Category(user_id=user.id, name="가족"),
        Category(user_id=user.id, name="친구"),
        Category(user_id=user.id, name="기타"),
    ]
    db.add_all(default_categories)
    db.commit()
    db.refresh(user)
    return user

def authenticate_user(db: Session, username: str, password: str) -> User:
    user = db.query(User).filter(User.username == username).first()
    if not user or not verify_password(password, user.password_hash):
        return None
    return user

def create_login_session(db: Session, user_id: int) -> str:
    session_id = secrets.token_hex(32)
    session = LoginSession(session_id=session_id, user_id=user_id)
    db.add(session)
    db.commit()
    return session_id

def get_user_by_session(db: Session, session_id: str) -> User:
    session = db.query(LoginSession).filter(LoginSession.session_id == session_id).first()
    if not session:
        return None
    return db.query(User).filter(User.id == session.user_id).first()

def delete_login_session(db: Session, session_id: str):
    db.query(LoginSession).filter(LoginSession.session_id == session_id).delete()
    db.commit()

def list_contacts(db: Session, user_id: int, name: str = None, category_id: int = None) -> list[Contact]:
    query = db.query(Contact).filter(Contact.user_id == user_id)
    if name:
        query = query.filter(Contact.name.contains(name))
    if category_id:
        query = query.filter(Contact.category_id == category_id)
    return query.all()

def get_my_contact(db: Session, user_id: int, contact_id: int) -> Contact:
    return db.query(Contact).filter(
        and_(Contact.id == contact_id, Contact.user_id == user_id)
    ).first()

def create_contact(db: Session, user_id: int, data: schemas.ContactCreate) -> Contact:
    contact = Contact(
        user_id=user_id,
        category_id=data.category_id,
        name=data.name,
        phone=data.phone,
        addr=data.addr
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact

def update_contact(db: Session, contact: Contact, data: schemas.ContactUpdate) -> Contact:
    if data.name is not None:
        contact.name = data.name
    if data.phone is not None:
        contact.phone = data.phone
    if data.addr is not None:
        contact.addr = data.addr
    if data.category_id is not None:
        contact.category_id = data.category_id
    db.commit()
    db.refresh(contact)
    return contact

def delete_contact(db: Session, contact: Contact):
    db.delete(contact)
    db.commit()

def list_categories(db: Session, user_id: int) -> list[Category]:
    return db.query(Category).filter(Category.user_id == user_id).all()

def get_my_category(db: Session, user_id: int, category_id: int) -> Category:
    return db.query(Category).filter(
        and_(Category.id == category_id, Category.user_id == user_id)
    ).first()

def create_category(db: Session, user_id: int, data: schemas.CategoryCreate) -> Category:
    if db.query(Category).filter(
        and_(Category.user_id == user_id, Category.name == data.name)
    ).first():
        return None

    category = Category(user_id=user_id, name=data.name)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

def update_category(db: Session, category: Category, data: schemas.CategoryUpdate) -> Category:
    if db.query(Category).filter(
        and_(
            Category.user_id == category.user_id,
            Category.name == data.name,
            Category.id != category.id
        )
    ).first():
        return None

    category.name = data.name
    db.commit()
    db.refresh(category)
    return category

def count_contacts_in_category(db: Session, user_id: int, category_id: int) -> int:
    return db.query(Contact).filter(
        and_(Contact.user_id == user_id, Contact.category_id == category_id)
    ).count()

def delete_category(db: Session, category: Category):
    db.delete(category)
    db.commit()
