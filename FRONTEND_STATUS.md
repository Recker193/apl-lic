# Status Frontend Oktapod — Noiembrie 2026

**Ultimul update:** 9 noiembrie 2026  
**Status build:** ✅ TypeScript 0 erori | ✅ Vite build 0 erori  
**Versiune:** v0.4.5-social-news-hub-and-rebrand

---

## 📋 Rezumat Executiv

Aplicația a fost rebranduită oficial în **Oktapod**, integrând **logo-ul caracatiță** (fără fundalul albastru, extras la transparență completă) și un **sistem dinamic de teme și culori personalizabile** pentru fiecare utilizator în parte.

În plus, a fost adăugat modulul complet **Noutăți & Social Media Hub** (`/news`), permițând administratorilor și coordonatorilor de cluburi să conecteze și să transmită știri automat prin **Discord**, **WhatsApp** și **Instagram**, acestea apărând instant în fluxul aplicației și pe dashboard-ul utilizatorilor.

---

## ✅ Completat

### 1. **Noutăți & Social Media Hub (Discord, WhatsApp, Instagram)**
- ✅ `web/src/api/types.ts`: Definite tipurile de date pentru canale sociale (`DISCORD`, `WHATSAPP`, `INSTAGRAM`), `SocialFeedPost` și `SocialIntegrationConfig`.
- ✅ `web/src/common/SocialFeedService.ts`: Serviciu centralizat cu suport pentru stocare locală, adăugare/ștergere știri, management webhooks și sincronizare automată/la cerere (`triggerSync`).
- ✅ `web/src/news/NewsHubView.tsx`:
  - **Flux Noutăți**: Carduri interactive cu badge specific fiecărei rețele (culoare/iconiță nativă), imagini, club emitent, autor și link extern către postarea originală.
  - **Filtrare rapidă**: Filtre pill pentru vizualizare după platformă (Toate, Discord, WhatsApp, Instagram).
  - **Panou de Transmitere Știri**: Formular complet pentru administratori și responsabili de cluburi pentru a trimite știri către feed.
  - **Panou Canale & Webhooks**: Setare webhook-uri, canale și sincronizare instantanee.
- ✅ **Integrare Dashboard (Mobil & Desktop)**:
  - Pe ecranul principal (`MobileHome.tsx`), widget-ul de știri din cluburi afișează automat cele mai noi mesaje venite prin canalele sociale.
- ✅ **Navigație & Rute**: Rută dedicată `/news`, link în sidebar desktop și în drawer-ul mobil.

### 2. **Rebranding Oficial: Oktapod & Logo Caracatiță Transparent**
- ✅ **Extracție Logo Transparent**: Imaginea încărcată a fost procesată, eliminând fundalul cyan și marginile, păstrând doar caracatița violetă și ochii conturați, salvată în `web/public/logo.png`, `web/src/assets/logo.png` și `web/public/favicon.png`.
- ✅ **Favicon & Titlu Document**: `web/index.html` actualizat cu titlul `<title>Oktapod</title>` și iconița caracatiță.
- ✅ **Header & Sidebar Desktop**: Logo-ul caracatiță apare proeminent în `desktop-sidebar-header` alături de textul **Oktapod**.
- ✅ **Header & Drawer Mobil**: Header-ul mobil include logo-ul caracatiță lângă titlul **Oktapod**, precum și în meniul lateral drawer.
- ✅ **Ecrane de Autentificare**: Paginile de `Login` și `Register` afișează logo-ul caracatiță animat și denumirea Oktapod.

### 3. **Sistem de Teme & Personalizare Culori (Theme & Accent Color Customizer)**
- ✅ `web/src/common/ThemeContext.tsx`:
  - Context React complet pentru Dark Mode și gestionarea accentului cromatic al aplicației.
  - 6 palete de culori gata definite (Oktapod Violet, Ocean Cyan, Smarald Tonic, Classic Indigo, Solar Amber, Coral Rose).
  - Actualizare dinamică a variabilelor CSS `--primary`, `--primary-hover`, `--mobile-school-color`, `--mobile-school-color-light` și atributului `data-accent`.
- ✅ `web/src/common/AccentColorPicker.tsx`: Componentă UI interactivă cu butoane circulare animate pentru selectarea culorii de accent în timp real.
- ✅ **Accesibilitate Customizare**: Disponibilă în footer-ul sidebar-ului de desktop, în drawer-ul mobil și în pagina de **Profil**.
- ✅ `web/src/app/Layout.tsx` (Desktop):
  - Sidebar modernizat cu brandingul verde al liceului identic cu cel mobil (`--mobile-school-color`)
  - Profil utilizator compact cu avatar tematic și badge de rol
  - Linkuri de navigație cu indicator activ vertical și tranziții elastice la hover
  - Notificări cu badge pill animat
  - Header și structură curate
- ✅ `web/src/app/MobileHome.tsx` & Desktop View:
  - Adăugat card de salut generos cu orarul zilei, salut dinamic ("Bună dimineața/ziua/seara"), numărul de ore și prima oră de curs
  - Grid pe două coloane pentru desktop (coloana stângă: *Ce ai de făcut* & *Orar astăzi*, coloana dreaptă: *Catalog quick-card*, *Notificări noi* & *În liceu*)
  - Păstrat layout-ul nativ pe mobil cu optimizări de spațiere

### 2. **Sistem de Animații & Micro-Interacțiuni**
- ✅ `web/src/index.css`:
  - Animații keyframes: `@keyframes fadeIn`, `@keyframes slideDown`, `@keyframes pulseGlow`
  - Efect de intrare fluidă pe pagini și carduri (`cubic-bezier(0.16, 1, 0.3, 1)`)
  - **Butoane**: Efect de apăsare fizică (`transform: translateY(-1px)`, active: `scale(0.98)`), glow subtil la hover
  - **Carduri interactive**: Efect de ridicare lină la hover (`translateY(-2px)` + umbră adâncă)
  - **Tab bar mobil**: Iconițe animate la selecție/apăsare (`scale(1.08)` activ, tap bounce)
  - **Task & Notification items**: Slide-in la hover (`translateX(4px)`) și fundal subtil rotunjit
  - **Drawer mobil**: Deschidere mai elastică și organică (`cubic-bezier(0.32, 0.72, 0, 1)`)
  - **Badge-uri**: Animație subtilă de mărire la hover

### 3. **Mobile Layout & Navigation**
- ✅ `web/src/app/MobileLayout.tsx` — Layout mobil cu:
  - Header fix cu școală centrat (verde), dot notificări
  - 6 taburi bottom bar (Acasă, Materii, Orar, Catalog, Cluburi, Profil)
  - Drawer lateral cu meniu complet + toggle dark mode
  - Tab activ cu bold font și stroke mai gros
  
- ✅ `web/src/common/useMobile.ts` — Hook reactiv care detectează viewport < 768px cu `MediaQueryList`

- ✅ `web/src/app/MobileHome.tsx` — Dashboard mobil cu:
  - Card salut cu data, mesaj personalizat (dimineață/zi/seară), orele zilei
  - Secțiune "Ce ai de făcut" cu iconuri colorate + badge-uri tip (Proiect/Temă/Test/Teză)
  - Secțiune notificări necitite
  - Secțiune evenimente "În liceu" cu thumbnail
  - Fallback la `Home.tsx` desktop pe ecrane largi

### 2. **Dark Mode — CSS Variables Safe (Toate View-urile Curățate)**
- ✅ Teme complete în `web/src/index.css`:
  - `:root` cu variabile light mode
  - `[data-theme='dark']` cu echivalente dark
  - Variabile specifice mobil: `--mobile-school-color` (#2d7a3a light / #4caf50 dark)
- ✅ Eliminat toate culorile hexazecimale hardcodate din view-uri în favoarea claselor semantice:
  - `web/src/clubs/ClubsView.tsx` — înlocuit `#e0e7ff` cu `.bg-accent-blue`, `#fee2e2` cu `.alert-error`, modal-inner
  - `web/src/exams/ExamsView.tsx` — înlocuit `#fee2e2` cu `.bg-danger-subtle` și `.alert-error`, `var(--danger)`
  - `web/src/calendar/CalendarView.tsx` — înlocuit `#b91c1c`, `#d97706`, `#1d4ed8` cu `var(--danger)`, `var(--warning)`, `var(--primary)`, plus `.bg-danger-subtle`, `.bg-info-subtle`
  - `web/src/classes/ClassesView.tsx` — înlocuit `#e0e7ff` cu `.bg-accent-blue`, `.modal-inner`, `.table-row-alt`
  - `web/src/groups/GroupsList.tsx` — înlocuit `#fee2e2` cu `.alert-error`
  - `web/src/subjects/SubjectsView.tsx` — înlocuit `#eff6ff` cu `.bg-accent-blue`, `.modal-inner`, `.alert-error`
  - `web/src/profile/Profile.tsx` — înlocuit `#dcfce7`, `#fee2e2` cu `.bg-success-subtle` și `.alert-error`
  - `web/src/timetable/TimetableView.tsx` — modal erori cu `.alert-error`, badge-uri și culori semantice

### 3. **Responsive Design & Tabele pe Mobil**
- ✅ `web/src/index.css`:
  - Media query `@media (max-width: 767px)` extins cu clase `.table-wrapper` și `.table-responsive`
  - Scroll orizontal fluid (`-webkit-overflow-scrolling: touch`) pe tabele
- ✅ `web/src/timetable/TimetableView.tsx`:
  - Vizualizare dedicată pe mobil cu **selector pill orizontal pentru zilele săptămânii**
  - Carduri individuale pentru fiecare oră / activitate în loc de grid orizontal rigid pe mobil
  - Păstrat tabelul complet cu toate zilele pentru desktop

---

## 🔍 Build Status

```
✅ TypeScript: 0 erori (tsc -b)
✅ Vite: 0 erori, 418.38 KB JS, 14.95 KB CSS (gzip: 112.10 KB / 3.41 KB)
✅ Compilare CSS: Complete
✅ Import statements: Clean
```

---

## 🚀 Deployment & Pași Următori

1. **Commit & Push pe `main`**: Vercel va rula automat build-ul de producție.
2. **Device Testing**:
   - Deschide https://apl-lic.vercel.app pe telefon (sau Chrome DevTools în Device Mode)
   - Testează navigarea pe cele 6 taburi de pe bara inferioară
   - Verifică comutatorul de Dark Mode din Drawer/Setări
   - Verifică afișarea orarului pe mobil (selector zi + carduri) și tabelele din Catalog/Clase.

