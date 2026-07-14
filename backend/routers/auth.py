from fastapi import APIRouter, Depends, HTTPException, Response, Cookie
from sqlalchemy.orm import Session

import crud
import models
import schemas
from database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])


async def getCurrentUser(session_id: str | None = Cookie(default=None), db: Session = Depends(get_db)):
    if not session_id:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다")

    user = crud.getUserBySessionId(db, session_id)
    if not user:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다")

    return user


@router.post("/signup", response_model=schemas.UserOut, status_code=201)
def signup(signupData: schemas.SignupIn, db: Session = Depends(get_db)):
    existingUser = crud.getUserByUsername(db, signupData.username)
    if existingUser:
        raise HTTPException(status_code=409, detail="이미 존재하는 아이디입니다")

    user = crud.createUser(db, signupData)
    return user


@router.post("/login", response_model=dict)
def login(loginData: schemas.SignupIn, response: Response, db: Session = Depends(get_db)):
    user = crud.authenticateUser(db, loginData.username, loginData.password)
    if not user:
        raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 올바르지 않습니다")

    sessionId = crud.createLoginSession(db, user.id)
    response.set_cookie("session_id", sessionId, httponly=True, path="/", samesite="lax")

    return {"message": "로그인 성공"}


@router.post("/logout", response_model=dict)
def logout(response: Response, user: models.User = Depends(getCurrentUser), db: Session = Depends(get_db), session_id: str | None = Cookie(default=None)):
    if session_id:
        crud.deleteLoginSession(db, session_id)

    response.delete_cookie("session_id", path="/")
    return {"message": "로그아웃 되었습니다"}


@router.get("/me", response_model=schemas.UserOut)
def getMe(user: models.User = Depends(getCurrentUser)):
    return user
