# 타이어 장착 견적 비교 MVP 프로토타입

차량번호 하나로 타이어 교체 견적을 받아 비교하는 서비스 MVP의 화면 프로토타입입니다.
Claude 아티팩트로 만든 **단일 HTML 파일**이며, 이 저장소의 Next.js 앱과는 연결되어 있지 않습니다.
검토와 논의용으로 별도 브랜치에 올려 두었습니다.

- 원본 아티팩트: https://claude.ai/artifact/9jb9n8g3S4GjVft2tw8uDF
- 파일: `index.html` (외부 의존성은 Google Fonts뿐, 서버 없이 동작)

## 보는 방법

1. `index.html`을 내려받아 브라우저에서 엽니다. 모바일 화면 기준으로 설계되어 있습니다.
2. 또는 브라우저에서 바로 미리보기:
   https://htmlpreview.github.io/?https://github.com/ykphone-dev/phone-load/blob/prototype/tire-quote/prototypes/tire-quote/index.html

## 화면 구성

- **소비자**: 내 차 타이어 확인 → 교체 수량 → 브랜드 선호(선택) → 교체 장소 또는 지역 선택 → 교체 시기와 방문 일시 → 견적 요청
- **제휴 장착점**: 새로운 견적요청 알림 → 견적 입력
- **운영자**: 주간 견적요청 현황, 제휴점 없는 요청의 수동 대응, 첫 30일 핵심 KPI

## 참고

- 화면 안의 차량, 매장, 금액, 건수는 모두 예시 데이터입니다.
- 실제 서비스로 만들 때는 이 저장소의 `src/` 구조(Next.js + Supabase)에 맞춰 다시 구현해야 합니다.
