# 부동산 매입 자금조달 · 대출 비교 MVP 프로토타입

> 이 부동산, 내가 살 수 있을까?

사고 싶은 부동산과 최소한의 정보만 입력하면 매입 자금계획을 세우고 대출 조건을 비교해 주는
서비스의 화면 프로토타입입니다. Claude 아티팩트로 만든 **단일 HTML 파일**이며,
이 저장소의 Next.js 앱과는 연결되어 있지 않습니다. 검토와 논의용으로 별도 브랜치에 올려 두었습니다.

- 원본 아티팩트: https://claude.ai/artifact/D1QmWHBHQPNZE9JDiGrQQ6
- 파일: `index.html` (외부 의존성은 Google Fonts뿐, 서버 없이 동작)

## 보는 방법

1. `index.html`을 내려받아 브라우저에서 엽니다. 모바일 화면 기준으로 설계되어 있습니다.
2. 또는 브라우저에서 바로 미리보기:
   https://htmlpreview.github.io/?https://github.com/ykphone-dev/phone-load/blob/prototype/loan-compare/prototypes/loan-compare/index.html

## 화면 구성

- **소비자**: 사고 싶은 부동산 입력 → 최소한의 질문 → 무엇이 가장 중요한지 선택(금리·한도·속도 등) → 자금계획과 대출 비교
- **관리자**: 추천 알고리즘 버전, 정렬 프리셋 가중치, 순위 수동 조정, 최근 검색 감사 로그, 첫 30일 퍼널 가설

## 참고

- 화면 안의 금융사, 금리, 한도, 건수는 모두 예시 데이터이며 실제 상품 조건이 아닙니다.
- 실제 서비스로 만들 때는 이 저장소의 `src/` 구조(Next.js + Supabase)에 맞춰 다시 구현해야 합니다.
