# jwbm-dashboard 소스 백업 (v50 · 상품추천)

제철밥상 FLEXG 관리자 북마클릿 대시보드 소스 전체.
컨테이너/환경이 초기화됐을 때 이 폴더만 있으면 완전 복원 가능.

## Claude 자가 복원 절차 (환경 리셋 시)

```bash
# 1) 레포 통째로 다운로드 (API 불필요, rate limit 없음)
cd /home/claude
curl -sL https://codeload.github.com/lynn03351/jwbm-assets/zip/refs/heads/main -o repo.zip
unzip -q repo.zip && mv jwbm-assets-main/dashboard-src jwbm-dashboard && cd jwbm-dashboard

# 2) 의존성 설치 (package-lock.json 기준 — 버전 고정)
npm ci --silent 2>/dev/null || npm install --silent

# 3) 빌드
npx vite build --config vite.flexg.config.js
# → dist-flexg/jwbm_sales_dashboard.js

# 4) 검증 (스모크 + 연산 회귀)
npm i -D --silent jsdom
NODE_OPTIONS="--max-old-space-size=4096" npx vite-node smoke_v50.jsx   # 오류배너 없음 + 전 탭 ✓
NODE_OPTIONS="--max-old-space-size=4096" npx vite-node repro_all.jsx   # 14/14 ✓
```

## 구조

- `src/FlexgDash.jsx` — 메인 (탭 7개: 매출/회원/주문서/기획전/쿠폰/회원유형/상품추천)
- `src/salesClick.js` — 클릭/구매전환 파서·지표 (파일+라이브 조회)
- `src/memberProject.js` / `orderParse.js` / `*Worker.js` — 파싱 계층
- `vite.flexg.config.js` — 북마클릿 단일파일 빌드 설정
- `smoke_*.jsx` / `repro_*.jsx` — 검증 스크립트
- `bookmarklet.txt` — 사용자 설치용 북마클릿 코드

## 배포

빌드 산출물 `dist-flexg/jwbm_sales_dashboard.js` → 레포 **최상위** `jwbm_sales_dashboard.js`에 덮어쓰기
(jsDelivr: `cdn.jsdelivr.net/gh/lynn03351/jwbm-assets@main/jwbm_sales_dashboard.js`)

## 버전 이력 (요약)

- v50: 상품추천 탭 (클릭/전환 직접조회+파일, 꾸준지수, 한정특가 후보, 정렬), 뷰어 시드·필터 가드 수정
- v49: 시간대별 주문 분석 (3단 드릴), v48: 연령대 분석, v47: A/B 비교·매트릭스·등급수요·뷰어
