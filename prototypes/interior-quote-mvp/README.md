# 인테리어 비교견적 MVP 프로토타입

인테리어 비교견적 서비스 MVP의 화면 프로토타입입니다. Claude 아티팩트로 만든 **단일 HTML 파일**이며,
이 저장소의 Next.js 앱과는 연결되어 있지 않습니다. 검토와 논의용으로 별도 브랜치에 올려 두었습니다.

- 원본 아티팩트: https://claude.ai/artifact/W4VpyRqcz9FUUN7MaHx99a
- 파일: `index.html` (외부 의존성은 Google Fonts뿐, 서버 없이 동작)

## 보는 방법

1. `index.html`을 내려받아 브라우저에서 엽니다. 모바일 화면(최대 480px) 기준으로 설계되어 있습니다.
2. 또는 브라우저에서 바로 미리보기:
   https://htmlpreview.github.io/?https://github.com/ykphone-dev/phone-load/blob/prototype/interior-quote-mvp/prototypes/interior-quote-mvp/index.html

## 화면 흐름

공사 위치 선택 → 공사 종류 → 수준 → 스타일(최대 3개) → 예산·일정 → 현재 집 사진 → 연락처
→ 예상 견적 → 업체 5곳에 요청 → 3개 업체 1차 견적 비교 → 견적 차이 설명
→ 무료 현장실측 신청 → 최종견적 → 계약 접수

## 참고

- 화면 안의 업체, 금액, 후기는 모두 예시 데이터입니다.
- 실제 서비스로 만들 때는 이 저장소의 `src/` 구조(Next.js + Supabase)에 맞춰 다시 구현해야 합니다.
