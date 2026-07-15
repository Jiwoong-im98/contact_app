from fastapi import APIRouter, Depends, HTTPException, Response, Cookie
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import crud

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup", status_code=201, response_model=schemas.UserOut)
def signup(data: schemas.SignupIn, db: Session = Depends(get_db)):
    user = crud.create_user(db, data.username, data.password)
    if not user:
        raise HTTPException(status_code=409, detail="이미 있는 아이디입니다")
    return user

@router.post("/login", status_code=200)
def login(data: schemas.SignupIn, response: Response, db: Session = Depends(get_db)):
    user = crud.authenticate_user(db, data.username, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 올바르지 않습니다")

    session_id = crud.create_login_session(db, user.id)
    response.set_cookie("session_id", session_id, httponly=True)
    return {"message": "로그인 성공"}

@router.post("/logout", status_code=200)
def logout(session_id: str | None = Cookie(default=None), db: Session = Depends(get_db)):
    if session_id:
        crud.delete_login_session(db, session_id)
    return {"message": "로그아웃 되었습니다"}

@router.get("/me", response_model=schemas.UserOut)
def get_me(session_id: str | None = Cookie(default=None), db: Session = Depends(get_db)):
    if not session_id:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다")

    user = crud.get_user_by_session(db, session_id)
    if not user:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다")

    return user
