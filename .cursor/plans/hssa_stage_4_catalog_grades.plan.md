---
name: HSSA Stage 4 Catalog & Grades
overview: "Etapa 4: funcționalitatea de bază a aplicației, catalogul școlar. Note, absențe, medii semestriale și anuale, purtare, diriginte, vizualizare pentru elev (și părinte, dacă se decide), cu istoric de modificări și audit. Extinde modelul existent (SubjectGroup, GroupMembership, Notification, AuditLog) fără a schimba stiva."
todos:
  - id: catalog-schema
    content: Model de date și migrații Prisma - Term, GradeEntry, GradeRevision, Absence, ConductGrade, TermAverage, HomeroomAssignment
    status: pending
  - id: grades-api
    content: API note - adăugare, corectare, anulare, listare pe elev/grup, cu reguli de acces și istoric
    status: pending
  - id: absences-api
    content: API absențe - înregistrare, motivare, listare, totaluri pe semestru
    status: pending
  - id: averages-closing
    content: Calcul medii (semestriale, anuale), teză, închidere semestru, situație școlară
    status: pending
  - id: homeroom-conduct
    content: Diriginte (rol pe clasă), motivări, notă purtare, vedere de ansamblu pe clasă
    status: pending
  - id: catalog-ui
    content: Interfață - catalog profesor (tabel clasă x note), foaie elev, absențe, medii, exporturi CSV/PDF
    status: pending
  - id: catalog-security-tests
    content: Teste de permisiuni, izolare între licee, imutabilitate, audit, calcul medii; Playwright pe roluri
    status: pending
isProject: false
---

# High School Students' App - etapa 4 (Catalog: note, absențe, medii)

> Continuă etapele 1-3. Extinde [PLAN_APLICATIE.md](PLAN_APLICATIE.md); catalogul nu apare în planul inițial, deci regulile de mai jos trebuie confirmate de liceul pilot înainte de implementare (vezi secțiunea 9).

**Obiectiv:** profesorii țin evidența notelor și absențelor pe grupurile lor, elevii își văd situația, diriginții administrează absențele și purtarea, administratorul închide semestrele. Fiecare modificare a unei note este păstrată în istoric.

**Principii (aceleași ca până acum):** autorizare pe server la fiecare cerere, izolare pe `schoolId`, validare strictă, audit pentru operațiile sensibile, fără secrete în loguri. Datele de evaluare ale minorilor sunt date personale sensibile: se afișează doar celor care au nevoie.

---

## 1. Reguli de domeniu (de confirmat cu liceul)

- **Scala:** note întregi 1-10. Calificativele (învățământ primar) sunt în afara scopului.
- **Semestre:** an școlar cu două semestre (`Term`), cu date de început și sfârșit.
- **Tipuri de notă:** `ORAL`, `TEST`, `HOMEWORK`, `PROJECT`, `THESIS` (teză). Teza este opțională per grup și semestru.
- **Media semestrială:** media aritmetică a notelor din semestru, rotunjită la două zecimale. Dacă există teză: `(3 * medie_note + teză) / 4`, rotunjit la întreg conform regulamentului. Formula este configurabilă într-un singur loc (funcție pură, testată).
- **Media anuală:** media celor două medii semestriale.
- **Absențe:** per elev, dată și, opțional, grup (oră). Stare `UNEXCUSED` sau `EXCUSED`. Motivarea o face dirigintele, cu motiv scris.
- **Purtare:** notă 1-10 per elev și semestru, introdusă de diriginte.
- **Situație:** medie sub 5 la o materie înseamnă corigență; stările finale (promovat, corigent, repetent) sunt calculate și afișate, nu decise automat în producție (închiderea o confirmă administratorul).

## 2. Roluri și permisiuni

| Acțiune | Elev | Profesor (grupul său) | Diriginte (clasa sa) | Admin (liceul său) |
| --- | --- | --- | --- | --- |
| Vede notele proprii | da | - | - | - |
| Vede notele elevilor | nu | doar grupul său | toate materiile clasei | citire |
| Adaugă / corectează / anulează note | nu | doar în grupul său, semestru deschis | nu | doar corectare cu motiv, audit |
| Înregistrează absențe | nu | grupul său | clasa sa | da |
| Motivează absențe | nu | nu | da | da |
| Notă purtare | nu | nu | da | da |
| Închide semestrul | nu | nu | nu | da |

Regula de bază: un elev nu vede niciodată notele altui elev; un profesor nu vede și nu modifică note din alt grup sau alt liceu. Rolul **diriginte** nu este un rol global, ci o atribuire pe clasă (`HomeroomAssignment`), ca un profesor să poată fi și diriginte.

Rol de **părinte** (`PARENT`, legat de unul sau mai mulți elevi, vedere doar în citire): decizie deschisă, vezi secțiunea 9. Nu se construiește până la confirmare.

## 3. Model de date (Prisma)

Toate modelele au `schoolId` (izolare) și `createdAt`/`updatedAt`.

- `Term`: `id, schoolId, schoolYear, number (1|2), startsAt, endsAt, status (OPEN|CLOSED)`. Unic pe `(schoolId, schoolYear, number)`.
- `GradeEntry`: `id, schoolId, termId, groupId, studentId, teacherId, type, value (Int 1-10), gradedAt, comment?, status (ACTIVE|VOIDED), voidedReason?`. Index pe `(studentId, termId)` și `(groupId, termId)`. Constrângere CHECK `value BETWEEN 1 AND 10`.
- `GradeRevision`: `id, gradeId, actorId, previousValue, newValue, previousStatus, newStatus, reason, createdAt`. Doar adăugare, niciodată ștergere. Nicio notă nu se șterge fizic: se anulează.
- `Absence`: `id, schoolId, studentId, groupId?, date, status (UNEXCUSED|EXCUSED), excuseReason?, excusedById?, recordedById`. Unic pe `(studentId, groupId, date)` pentru a evita dublurile.
- `ConductGrade`: `id, schoolId, termId, studentId, value (1-10), setById`. Unic pe `(termId, studentId)`.
- `TermAverage`: `id, termId, groupId, studentId, average, thesis?, computedAt`. Se scrie doar la închiderea semestrului (înainte se calculează din note).
- `HomeroomAssignment`: `id, schoolId, classId, teacherId, schoolYear`. Unic pe `(classId, schoolYear)`.
- Extindere `NotificationType`: `GRADE_ADDED`, `GRADE_CHANGED`, `ABSENCE_RECORDED`, `TERM_CLOSED`.
- Extindere `AuditLog`: acțiuni noi (`grade.void`, `grade.correct`, `term.close`, `absence.excuse`, `conduct.set`).

Migrațiile sunt aditive (tabele noi), deci nu afectează datele existente.

## 4. API REST (`/api/v1`)

**Semestre:** `GET /terms`, `POST /terms` (admin), `POST /terms/:id/close` (admin).

**Note:**
- `GET /groups/:id/grades?termId=` - profesor/diriginte/admin: toate notele grupului. Elev: doar ale sale.
- `POST /groups/:id/grades` - `{ studentId, type, value, gradedAt, comment? }`. Verifică: profesorul grupului, elevul membru al grupului, semestrul deschis, data în semestru.
- `PATCH /grades/:id` - corectare valoare; cere `reason`, scrie `GradeRevision`.
- `DELETE /grades/:id` - anulare (soft), cere `reason`.
- `GET /grades/:id/history` - profesor și admin.
- `GET /students/:id/grades?termId=` - foaia elevului (elevul pentru sine; profesorii doar materiile lor; dirigintele toate).

**Absențe:** `GET /classes/:id/absences?from&to`, `POST /absences`, `PATCH /absences/:id/excuse` (diriginte/admin), `GET /students/:id/absences`.

**Medii și situație:** `GET /students/:id/averages?termId=`, `GET /classes/:id/summary?termId=` (diriginte/admin: tabel elev x materie cu medii, absențe, purtare).

**Purtare:** `PUT /classes/:id/conduct/:studentId?termId=`.

**Exporturi:** `GET /classes/:id/export.csv?termId=` (diriginte/admin). PDF pentru elev (`/students/:id/report.pdf`) la final, dacă timpul permite.

Toate rutele: validare DTO, `forbidNonWhitelisted`, limite de rată existente, `X-Requested-With` pe mutații.

## 5. Notificări

- La notă nouă sau corectată: notificare în aplicație pentru elev (fără duplicate pe aceeași notă și aceeași valoare).
- La absență înregistrată: notificare pentru elev (și părinte, dacă există rolul).
- La închiderea semestrului: notificare pentru toți elevii clasei.
- Folosește mecanismul existent din `notifications`; fără e-mail pentru note (decizie de confidențialitate: e-mailul nu conține note).

## 6. Interfață (React)

- **Profesor:** în pagina grupului, tab nou „Catalog": tabel elevi x note, adăugare rapidă (celulă sau modal), editare cu motiv, filtru pe semestru, media curentă pe elev.
- **Elev:** pagină „Situația mea": note pe materii, medii, absențe (motivate/nemotivate), purtare. Doar citire.
- **Diriginte:** pagină „Clasa mea": sumar clasă, absențe de motivat, purtare.
- **Admin:** semestre (creare, închidere), atribuire diriginți, export CSV.
- Fără reguli de securitate în frontend; UI-ul ascunde doar ce backend-ul oricum refuză.

## 7. Securitate și confidențialitate

- Verificarea apartenenței la grup/clasă/liceu în `AccessService` (extins cu `assertCanGrade`, `assertHomeroom`), nu în controllere.
- Imutabilitate: fără UPDATE/DELETE direct pe note în afara serviciului; revizii obligatorii; semestrul închis blochează orice modificare, cu excepția corecției admin cu motiv și audit.
- Jurnalul de audit nu conține valoarea notei în clar în loguri aplicației (doar id-uri); valoarea rămâne în `GradeRevision`.
- Răspunsurile elevului nu includ note ale colegilor, nici agregate care permit deducerea lor (de exemplu media clasei cu un singur elev).
- Retenție: notele și absențele sunt date școlare cu retenție stabilită de liceu; se documentează în `docs/MVP_DECISIONS.md` și în runbook.

## 8. Ordinea implementării (cu ce intră în prima versiune)

Prima livrare utilizabilă în pilot (nucleu):

1. **Schema și migrații** (`Term`, `GradeEntry`, `GradeRevision`, `Absence`) + seed de dezvoltare.
2. **API note** cu permisiuni, istoric și teste de autorizare/izolare.
3. **API absențe** (înregistrare, motivare).
4. **Medii calculate la cerere** (funcție pură testată; fără `TermAverage` încă).
5. **UI**: catalog profesor, „Situația mea" pentru elev.
6. **Teste**: unit pe calcul, e2e pe permisiuni, Playwright pe profesor și elev.

A doua livrare:

7. Diriginte, motivări în UI, purtare, sumar clasă.
8. Închidere semestru + `TermAverage` + notificări de închidere.
9. Export CSV, apoi PDF.
10. Rol părinte (dacă se confirmă).

## 9. Decizii necesare înainte de a începe

1. Formula exactă a mediei și rotunjirea (cu sau fără teză; regula liceului).
2. Absențe: per oră (pe grup) sau per zi; cine le poate introduce.
3. Rol de părinte: da sau nu în pilot (impact GDPR și conturi noi; recomandare: nu în prima livrare).
4. Cine poate corecta o notă după închiderea semestrului (doar admin cu motiv?).
5. Purtarea și dirigenția intră în pilot sau rămân pe hârtie.
6. Retenția datelor și acordul părinților (obligație a liceului, nu a aplicației).
7. Înlocuiește aplicația catalogul oficial (cerințe legale, registru matricol) sau este un instrument paralel? Dacă este oficial, cerințele cresc mult (semnături, arhivare, SIIIR).

## 10. Criterii de finalizare

- [ ] Profesorul adaugă, corectează și anulează note doar în grupurile sale; fiecare schimbare are revizie și intrare de audit.
- [ ] Elevul își vede doar notele, mediile și absențele; încercările de a accesa date ale altui elev sau liceu primesc 404.
- [ ] Mediile se calculează corect pe cazurile limită (fără note, o notă, cu teză, note anulate excluse), acoperite de teste unitare.
- [ ] Semestrul închis blochează modificările obișnuite.
- [ ] Testele existente (unit, e2e, Playwright) rămân verzi; testele noi acoperă permisiunile critice.
- [ ] Runbook și `MVP_DECISIONS.md` actualizate cu regulile confirmate.

---

## 11. Integrarea cu funcționalitățile existente

- **Teme și teste → note:** `GradeEntry` poate referi opțional `assignmentId` sau `examId`. Din lista unei teme, profesorul poate nota direct elevii grupului („Notează tema"), iar nota apare în catalog cu sursa afișată. O singură notă per elev și sursă (unic pe `(studentId, assignmentId)` / `(studentId, examId)`).
- **Calendar:** testele cu notele introduse apar marcate „notat"; elevul vede în calendar și termenele de închidere a semestrului. Absențele nu apar în calendarul general.
- **Teza:** ca tip de examen (`Exam`) marcat `isThesis`, ca să apară în calendar și să fie legată de nota de teză.
- **Notificările existente:** aceleași reguli anti-duplicat (cheie pe `userId + type + resourceId + valoare`).
- **Audit:** același `AuditLog`; filtrare după tipul acțiunii în panoul de administrare.

## 12. Funcționalități suplimentare (după nucleu)

1. **Introducere în masă:** import CSV de note pentru un grup (previzualizare, validare rând cu rând, raport de erori, totul-sau-nimic). Util la teze și la începutul digitalizării.
2. **Statistici pentru profesor:** distribuția notelor pe test (histogramă), media grupului, elevi sub 5, trend pe semestru. Afișate doar profesorului grupului; fără nume în statisticile agregate partajate.
3. **Evoluția elevului:** grafic simplu al mediilor pe materie, pe semestre, doar pentru elevul însuși.
4. **Alertă de risc:** notificare pentru diriginte când un elev depășește un prag de absențe nemotivate sau are media sub 5 la o materie (praguri configurabile pe liceu).
5. **Motivări cu cerere:** elevul trimite o cerere de motivare (text, opțional document scanat), dirigintele o aprobă sau o respinge. Folosește fluxul de fișiere existent, cu aceleași verificări de tip și acces.
6. **Fereastră de anulare:** o notă introdusă greșit poate fi anulată de profesor în primele 10 minute fără motiv; după aceea, motiv obligatoriu.
7. **Comentarii la note:** observație scurtă vizibilă elevului (fără conținut sensibil; câmp limitat la 280 de caractere).
8. **Rapoarte pe clasă:** situația școlară pe semestru (PDF/CSV) pentru diriginte și administrator, cu antet de liceu.
9. **Dreptul de acces GDPR:** export al tuturor datelor catalogului unui elev (JSON/PDF) la cerere, doar de administrator, cu audit.
10. **Retenție:** job programat (dezactivat implicit) care anonimizează sau arhivează date mai vechi de perioada stabilită de liceu; se rulează manual în pilot.

## 13. Concurență, consistență și performanță

- **Editări simultane:** `GradeEntry` are `version`; `PATCH` trimite versiunea citită, iar serverul răspunde 409 dacă s-a schimbat între timp (UI-ul reîncarcă și arată diferența).
- **Calcule în tranzacție:** închiderea semestrului rulează într-o singură tranzacție (blocare pe `Term`, calcul, scriere `TermAverage`, schimbare stare). O a doua închidere simultană este respinsă.
- **Indexuri:** `(groupId, termId)`, `(studentId, termId)`, `(classId, schoolYear)` pe `HomeroomAssignment`, `(studentId, date)` pe `Absence`. Interogările catalogului clasei se fac cu un singur `groupBy`, nu pe câte elev.
- **Paginare:** liste de note și absențe cu paginare și limită maximă (aceeași convenție ca anunțurile).
- **Dimensionare:** o clasă de 30 de elevi, 12 materii, ~20 de note per elev și semestru înseamnă circa 7.000 de rânduri pe clasă și semestru; un liceu de 600 de elevi rămâne sub 150.000 de note pe an. PostgreSQL singur este suficient.
- **Limite de rată:** mutațiile de note și absențe au o limită per utilizator (ex. 120/min), pentru a opri scripturile greșite.

## 14. Eroare, validare și mesaje

- **Reguli de validare** centralizate: valoare 1-10 întreagă; dată în semestrul deschis și nu în viitor; elev membru al grupului; semestru deschis; motiv obligatoriu la corectare, anulare și motivare.
- **Coduri:** 400 (validare), 403 (rol greșit în propriul liceu), 404 (resursă din alt liceu sau inexistentă, fără scurgeri), 409 (versiune învechită sau duplicat), 423 (semestru închis).
- **Mesaje către utilizator** în română, scurte și fără detalii interne; jurnalele conțin tipul erorii, nu datele elevului.

## 15. Date inițiale și migrare

- **Seed de dezvoltare:** doi ani școlari, două semestre, o clasă cu 5 elevi, 3 materii, note și absențe variate (inclusiv cazuri limită: fără note, media 4,99, teză).
- **Producție:** pornește cu catalogul gol; semestrul curent se creează din panoul de administrare.
- **Migrații:** doar tabele noi și coloane nule, fără blocare lungă; rulează automat la pornirea containerului, ca până acum. Backup obligatoriu înainte de prima migrare a etapei (documentat în runbook).
- **Retrocompatibilitate:** endpoint-urile existente nu se schimbă; `Exam` și `Assignment` primesc doar relații inverse.

## 16. Strategia de testare

| Nivel | Ce acoperă |
| --- | --- |
| Unitar | calculul mediilor (fără note, o notă, teză, note anulate, rotunjire), validatori, mapări de stare |
| Integrare/e2e backend | matricea de permisiuni din secțiunea 2 (fiecare rol x fiecare acțiune), izolare între licee, semestru închis (423), conflicte de versiune (409), revizii și audit, notificări fără duplicate |
| Securitate | elev încearcă notele colegului (404), profesor din alt grup (403/404), mass assignment (câmpuri interzise respinse), valori în afara intervalului, IDOR pe `/grades/:id` |
| Playwright | profesor notează și corectează, elev vede nota și media, diriginte motivează o absență, admin închide semestrul și modificările sunt blocate |
| Performanță | seed de 150.000 de note; catalogul unei clase sub 300 ms la p95 |
| Regresie | toate suitele din etapele 1-3 rămân verzi |

## 17. Accesibilitate și utilizare

- Catalogul profesorului funcționează pe tastatură (navigare cu săgeți, Enter pentru editare) și pe telefon (vedere pe card, nu tabel lat).
- Culori și contrast conforme WCAG AA; nota nu este indicată doar prin culoare.
- Etichete asociate câmpurilor (`htmlFor`) pentru cititoare de ecran; mesaje de eroare legate de câmp. Rezolvă și problema actuală a testelor care caută câmpurile după placeholder.
- Interfața rămâne în română; textele sunt grupate într-un singur fișier pentru o eventuală traducere.

## 18. Livrare, risc și estimare

**Faze și ordine de livrare**

| Fază | Conținut | Estimare (1 dezvoltator) |
| --- | --- | --- |
| A | schema, migrații, seed, calcul medii (funcție pură + teste) | 2-3 zile |
| B | API note + permisiuni + istoric + teste e2e | 3-4 zile |
| C | API absențe + motivare + teste | 2 zile |
| D | UI profesor și elev + Playwright | 4-5 zile |
| E | diriginte, purtare, sumar clasă | 3 zile |
| F | închidere semestru, notificări, export CSV | 3 zile |
| G | funcționalități din secțiunea 12 (după prioritate) | la alegere |

Nucleul (A-D) este de circa 2-3 săptămâni; estimările presupun deciziile din secțiunea 9 luate înainte de faza A.

**Riscuri**

| Risc | Impact | Măsură |
| --- | --- | --- |
| Reguli de calcul diferite de cele ale liceului | medii greșite, pierderea încrederii | formula confirmată în scris; funcție unică, testată pe exemple reale ale liceului |
| Aplicația este percepută ca registru oficial | cerințe legale (registru matricol, arhivare) | declarat explicit: instrument de lucru paralel, până la decizie |
| Scurgere de note între elevi sau licee | încălcare GDPR, minori | teste de securitate obligatorii în CI; 404 uniform; revizuire pe fiecare endpoint nou |
| Corecturi abuzive sau accidentale | note contestate | revizii imutabile, motiv obligatoriu, audit vizibil administratorului |
| Termen scurt | livrare incompletă | livrare pe faze; nucleul A-D este utilizabil singur |
| Volum mare de introducere manuală la start | adoptare slabă | import CSV (secțiunea 12.1) prioritar |

**Lansare:** funcționalitatea intră în pilot pe un singur grup/clasă, cu o a doua clasă după o săptămână fără incidente; feedback colectat de la profesori înainte de extindere. Fiecare fază se livrează pe ramură proprie, cu testele etapelor anterioare verzi înainte de îmbinare.

## 19. Întrebări deschise suplimentare

8. Notele pot fi vizibile elevului imediat sau cu întârziere/aprobare (unii profesori vor să anunțe verbal întâi)?
9. Există materii fără note (educație fizică, dirigenție) sau cu calificative?
10. Câte semestre/module are anul școlar al liceului pilot (unele licee folosesc module)?
11. Cine este responsabilul pentru date personale la liceu și poate aproba exporturile?
12. Notele din anii anteriori trebuie importate sau catalogul începe de la zero?
