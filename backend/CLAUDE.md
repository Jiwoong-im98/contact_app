# Backend Development Guide

## 프로젝트 개요

이 프로젝트는 FastAPI 기반의 연락처 관리 웹 서비스이다.

모든 백엔드 개발은
PRD, 구현요구사항, 기능정의서, 화면정의서를 기준으로 진행한다.

추측하여 기능을 구현하지 않는다.

---

# 기술 스택

- Python 3.12+
- FastAPI
- SQLAlchemy 2.x
- PostgreSQL 16
- Pydantic v2

---

# 개발 원칙

- SDD(Specification Driven Development)를 따른다.
- TDD(Test Driven Development)를 따른다.
- 요구사항을 먼저 확인한 후 구현한다.
- 구현 후 테스트를 수행한다.
- 문서와 구현이 일치해야 한다.

---

# 프로젝트 구조

각 계층의 역할을 명확하게 분리한다.

Router
→ HTTP 요청 처리

Service
→ 비즈니스 로직

Repository (사용한다면)
→ DB 접근

Model
→ SQLAlchemy 모델

Schema
→ Request / Response

---

# API 작성 규칙

- RESTful API를 따른다.
- 적절한 HTTP Method를 사용한다.
- 적절한 Status Code를 반환한다.
- Response Model을 사용한다.
- Request Validation은 Pydantic으로 처리한다.

---

# Database 규칙

- SQLAlchemy ORM을 사용한다.
- Raw SQL은 필요한 경우만 사용한다.
- FK를 적극 활용한다.
- UNIQUE 제약을 적극 활용한다.
- Transaction을 명확하게 관리한다.

---

# Validation 규칙

입력 검증은 Pydantic을 우선 사용한다.

DB 조회가 필요한 검증은
Service 계층에서 수행한다.

예)

- 전화번호 중복
- 카테고리 존재 여부
- 사용자 권한 확인

---

# 인증 규칙

세션 기반 인증을 사용한다.

인증이 필요한 API는
반드시 현재 로그인한 사용자를 확인한다.

다른 사용자의 데이터는 접근할 수 없다.

---

# Exception 처리

모든 예외는 명확한 HTTP Status Code를 반환한다.

500 에러가 발생하지 않도록 처리한다.

---

# 코드 스타일

- Type Hint를 작성한다.
- 함수는 하나의 역할만 수행한다.
- 의미 있는 변수명을 사용한다.
- 중복 코드를 최소화한다.

---

# 테스트

새로운 기능은 테스트를 함께 작성한다.

pytest와 Playwright를 사용한다.

---

# 문서

기능이 변경되면 관련 문서도 함께 수정한다.

- TRD
- README
- API 문서

---

# 금지 사항

- PRD와 다르게 구현하지 않는다.
- 추측하여 기능을 추가하지 않는다.
- 하드코딩하지 않는다.
- 관련 없는 코드까지 수정하지 않는다.