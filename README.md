# 연락처 관리 웹 서비스 (2차 과제)

FastAPI + PostgreSQL 기반의 다중 사용자 연락처 관리 웹 서비스입니다.

## 프로젝트 구조

```
contact_app/
├── main.py                 # FastAPI 앱 생성, 라우터 등록
├── database.py             # PostgreSQL 연결, 세션 관리
├── models.py               # SQLAlchemy 테이블 정의 (4개)
├── schemas.py              # Pydantic 입출력 모델
├── security.py             # 비밀번호 해싱 (Argon2)
├── crud.py                 # DB 작업 함수
├── routers/
│   ├── auth.py            # 인증 API (4개)
│   ├── contacts.py        # 연락처 API (4개)
│   └── categories.py      # 카테고리 API (4개)
├── static/
│   ├── index.html         # 웹 화면
│   └── app.js             # 화면 로직
└── requirements.txt       # 패키지 의존성
```

## 요구사항

- Python 3.12+
- PostgreSQL 16
- Docker (선택사항 - pg-lab 컨테이너 사용)

## 설치 및 실행

### 1. 패키지 설치

```bash
pip install -r requirements.txt
```

### 2. PostgreSQL 시작 (Docker 사용 시)

```bash
docker run --name pg-lab -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16
docker exec pg-lab createdb -U postgres contact_db
```

### 3. 서버 실행

```bash
uvicorn main:app --reload
```

서버가 시작되면 `http://127.0.0.1:8000` 에서 웹 애플리케이션에 접근할 수 있습니다.

### 4. API 문서 (Swagger UI)

`http://127.0.0.1:8000/docs` 에서 자동 생성된 API 문서를 볼 수 있습니다.

## 주요 기능

### 인증 (4개 API)
- `POST /auth/signup` - 회원가입 (기본 카테고리 자동 생성)
- `POST /auth/login` - 로그인 (세션 쿠키 발급)
- `POST /auth/logout` - 로그아웃
- `GET /auth/me` - 현재 로그인 사용자 정보

### 연락처 관리 (4개 API - 로그인 필수)
- `POST /contacts` - 연락처 추가
- `GET /contacts` - 연락처 목록 조회 + 이름 검색
- `PATCH /contacts/{id}` - 연락처 부분 수정
- `DELETE /contacts/{id}` - 연락처 삭제

### 카테고리 관리 (4개 API - 로그인 필수)
- `GET /categories` - 카테고리 목록
- `POST /categories` - 카테고리 추가
- `PATCH /categories/{id}` - 카테고리 이름 수정
- `DELETE /categories/{id}` - 카테고리 삭제 (사용 중 체크)

### 웹 화면
- `GET /` - 로그인/관리 화면

## 데이터 모델

### users (사용자)
- id (PK)
- username (UNIQUE, 4~20자, 영문소문자·숫자만)
- password_hash (Argon2 해시)
- created_at

### sessions (로그인 장부)
- session_id (PK, 64자 무작위)
- user_id (FK → users.id)
- created_at

### categories (카테고리)
- id (PK)
- user_id (FK → users.id)
- name (1~10자)
- UNIQUE(user_id, name)

### contacts (연락처)
- id (PK)
- user_id (FK → users.id)
- category_id (FK → categories.id)
- name (1~5자)
- phone (010 + 8자리)
- addr (제약 없음)
- UNIQUE(user_id, phone)

## 유효성 검사

### 형식 검증 (Pydantic 자동)
- username: 4~20자, `^[a-z0-9]+$`
- password: 4~20자
- name: 1~5자
- phone: `^010\d{8}$`
- category name: 1~10자

### 데이터 검증 (DB 조회)
- 아이디 중복 (409)
- 전화번호 중복 - 같은 사용자 내 (409)
- 카테고리명 중복 - 같은 사용자 내 (409)
- 카테고리 사용 중 체크 (409)

## 상태 코드

- **200**: 성공 (GET, PATCH, POST 응답 본문 있음)
- **201**: 생성 (POST 201)
- **204**: 성공 (DELETE 204, 본문 없음)
- **401**: 로그인 필요 / 인증 실패
- **404**: 없음 / 남의 데이터
- **409**: 규칙 충돌 (중복, 사용 중)
- **422**: 형식 위반

## 데이터 격리

모든 조회/수정/삭제는 `user_id`로 격리됩니다.
- 남의 데이터는 `id`가 맞아도 404 응답
- 서로 다른 사용자는 같은 번호를 각각 저장 가능
- 카테고리는 사용자별로 독립적

## 세션 관리

- 로그인 시 `secrets.token_hex(32)` 세션 ID 생성
- `session_id` 쿠키 (httponly=True)
- 서버 재시작 후에도 데이터·로그인 유지 (DB 저장)
- 로그아웃 시 sessions 테이블에서 삭제

## 요구사항 체크리스트

✓ 다중 사용자 지원
✓ 세션 기반 인증
✓ 연락처 CRUD
✓ 카테고리 CRUD (사용 중 체크)
✓ 데이터 격리
✓ 유효성 검사 (형식 + 데이터)
✓ 예외 처리 (401/404/409/422)
✓ 영속화 (PostgreSQL)
✓ 웹 화면 (HTML/JavaScript)
✓ 세션 유지

## 개발 가이드

### CLAUDE.md 규칙 준수
- SDD/TDD 방식
- 4칸 들여쓰기
- camelCase 함수/변수
- PascalCase 클래스
- 타입 힌트

### 코드 구조
- 계층 분리: 라우터 → CRUD → 모델
- 형식 검증: Pydantic 자동
- 데이터 검증: crud.py에서 처리
- 예외 처리: HTTPException으로 통일

## 테스트

API는 `/docs` (Swagger UI)에서 직접 테스트할 수 있습니다.

1. POST /auth/signup으로 계정 2개 생성
2. POST /auth/login으로 로그인 (쿠키 자동 저장)
3. GET /categories로 기본 카테고리 확인
4. POST /contacts로 연락처 추가
5. GET /contacts로 목록 확인
6. 다른 계정으로 로그인하여 데이터 격리 확인
