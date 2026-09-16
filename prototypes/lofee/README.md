# 로피 LoFee — 변호사 비용조건 비교 MVP 프로토타입

의뢰인이 사건을 등록하면 변호사들이 비용 조건을 제안하고, 의뢰인이 조건을 비교해 결정하는
서비스 MVP의 화면 프로토타입입니다. Claude 아티팩트로 만든 **단일 HTML 파일**이며,
이 저장소의 Next.js 앱과는 연결되어 있지 않습니다. 검토와 논의용으로 별도 브랜치에 올려 두었습니다.

- 원본 아티팩트: https://claude.ai/artifact/UnH6sZNpvhjJprDVKmA99T
- 파일: `index.html` (외부 의존성은 Google Fonts뿐, 서버 없이 동작)

## 보는 방법

1. `index.html`을 내려받아 브라우저에서 엽니다. 모바일 화면 기준으로 설계되어 있습니다.
2. 또는 브라우저에서 바로 미리보기:
   https://htmlpreview.github.io/?https://github.com/ykphone-dev/phone-load/blob/prototype/lofee/prototypes/lofee/index.html

## 화면 구성

- **소비자(의뢰인)**: 어떤 사건인지 선택 → 몇 가지 조건 선택 → 사건 등록 완료 → 변호사 제안 비교 → 제안 상세
- **변호사**: 등록된 사건 검토 → 비용 조건 제안 → 이 사건에 제안한 조건 확인
- **운영자**: 오늘 사건등록 현황, 분야별 등록, 운영 큐

## 참고

- 화면 안의 사건, 변호사, 법무법인, 금액, 건수는 모두 예시 데이터입니다.
- 실제 서비스로 만들 때는 이 저장소의 `src/` 구조(Next.js + Supabase)에 맞춰 다시 구현해야 합니다.
