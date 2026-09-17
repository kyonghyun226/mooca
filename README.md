# MOOCA

반려동물 컴패니언 스튜디오 **MOOCA** 소개 사이트입니다.
태그라인: *My One and Only Companion Animal*

A single-page intro for MOOCA — a Korean companion-animal photo studio.

## 로컬 실행 / Run locally

```bash
npm install
npm run dev
```

브라우저에서 Vite가 안내하는 주소(기본 `http://localhost:5173`)로 접속하세요.

공개 랜딩: `/`  
앱 카드 관리: `/admin/apps`

## 빌드 / Build

```bash
npm install
npm run build
```

정적 결과물은 `dist/`에 생성됩니다. 미리 보려면:

```bash
npm run preview
```

## Apps 데이터

공개 Apps 섹션은 HTML에 카드를 하드코딩하지 않습니다.
`src/data/apps.seed.json`을 기준으로 `src/data/apps-repository.js`가 목록을 `order` 오름차순으로 돌려 줍니다.

Firebase 프로젝트가 아직 없으면 시드 + 이 브라우저 `localStorage` (`mooca.apps.v1`)에 저장합니다.
스토어 URL이 비어 있으면 공개 카드의 App Store / Google Play 버튼을 숨깁니다. 가짜 링크를 만들지 마세요.

키워드 칩은 시드에 고정되어 있고, 어드민 v1에서는 편집하지 않습니다.

## 어드민 (`/admin/apps`)

v1 범위: 기존 5개 카드만 수정 (시소·응가타임·랜덤드랍·반짝산책·이음).
편집 필드: 이름, 한 줄 소개, 아이콘 업로드, App Store URL, Google Play URL.
추가/삭제와 포트폴리오·Contact·Hero 관리는 없습니다.

카드마다 저장합니다. 아이콘은 PNG / SVG / WebP, 권장 512×512입니다.

## Firebase (아직 프로젝트 없음)

**프로젝트 ID를 임의로 만들지 마세요.** 콘솔에서 프로젝트가 준비되면 아래만 채웁니다.

1. `.env.example`을 `.env.local`로 복사합니다.
2. Firebase 콘솔 → 프로젝트 설정 → 앱에서 `VITE_FIREBASE_*` 값을 넣습니다.
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`  ← TODO: 실제 프로젝트 ID만
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
3. Authentication에서 Email/Password를 켜고, 관리자 이메일을 확인(verify)합니다.
4. `firestore.rules`와 `storage.rules`의 `adminEmails()`에 그 이메일을 넣거나, Auth custom claim `admin: true`를 설정합니다.
5. Firestore 컬렉션 `apps`에 문서 ID `seesaw`, `pooptime`, `randomdrop`, `banjjak`, `ieum`을 시드하거나, 로그인한 관리자가 어드민에서 한 번 저장하면 문서가 만들어집니다. (`order` 1…5)
6. Storage 경로: `apps/{appId}/icon.png|svg|webp`
7. 규칙 배포: `npx firebase-tools@latest deploy --only firestore:rules,storage`

환경 변수가 비어 있거나 `TODO`로 시작하면 Firebase를 쓰지 않고 로컬 저장으로 동작합니다.

어드민에서 저장한 뒤 공개 페이지는 새로고침하면 반영됩니다. (런타임 조회, 빌드 타임 캐시 없음)

## 플레이스홀더

연락처, 위치, SNS, 사업자 정보는 아직 비어 있습니다.
페이지의 「연락처를 입력해 주세요」 같은 문구를 실제 정보로 바꿔 주세요.
문의 폼은 전송 서버에 연결되어 있지 않습니다.

Contact, location, social, and business fields are labeled placeholders only.
