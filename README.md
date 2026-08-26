# Board on Dashboard

Jira 보드를 대시보드 가젯으로 표시하는 Forge 앱.

## 배경
Atlassian이 Agile Wallboard Gadget을 아카이브한 이후, 대시보드에 보드를
띄우는 방법이 사라짐. 커뮤니티에 2019~2023년까지 반복 요청이 있으나
마켓플레이스에 대체재가 사실상 없음 (`wallboard` 카테고리 총 설치 403).

## 설계 원칙
- **읽기 전용** — 데이터 파괴 위험 0
- **Forge 25초 제한 대응** — 이슈 300건 / 컬럼당 카드 25장 상한
- **한계를 숨기지 않음** — 초과 시 안내 메시지 표시
- **설정 3단계** — 보드 선택 → 저장 → 끝

## 로컬 실행

```bash
npm i -g @forge/cli
forge login
forge register        # manifest.yml 의 app.id 가 자동으로 채워짐
npm install
forge deploy
forge install         # 개발용 사이트에 설치
forge tunnel          # 로컬 개발
```

## 구조
```
manifest.yml              모듈 정의 (jira:dashboardGadget)
src/resolvers/index.js    Jira Agile API 호출 + 컬럼 매핑
src/frontend/view.jsx     보드 렌더링
src/frontend/edit.jsx     보드 선택 설정
```

## 제약
| 항목 | 값 | 이유 |
|---|---|---|
| 최대 이슈 | 300 | Forge 함수 25초 실행 제한 |
| 컬럼당 카드 | 25 | 렌더링 성능 |
| 자동 새로고침 | 15분 | rate limit 여유 |
