# High School Students' App
## Plan tehnic și arhitectură pentru dezvoltare

**Versiune:** 1.0  
**Tip proiect:** Aplicație web pentru elevi și profesori de liceu  
**Prioritate:** Backend, autentificare, baze de date și reguli de acces  
**Obiectiv:** Centralizarea temelor, testelor, materialelor și anunțurilor școlare.

---

# 1. Scopul aplicației

Aplicația trebuie să faciliteze comunicarea dintre profesori și elevi.

Principalele probleme pe care le rezolvă:

- Elevii uită sau nu află ce teme au de făcut.
- Informațiile despre teste sunt răspândite în mai multe locuri.
- Materialele didactice sunt greu de găsit.
- Anunțurile importante nu ajung la toți elevii.
- Elevii nu știu întotdeauna când trebuie să predea proiectele.
- Informațiile despre evenimentele liceului nu sunt centralizate.

Toate aceste informații vor fi organizate într-un singur sistem.

---

# 2. Tipuri de utilizatori

Aplicația va avea trei roluri principale.

## 2.1. Administrator

Administratorul gestionează structura generală a aplicației.

Permisiuni:
- Creează și gestionează liceele.
- Gestionează conturile profesorilor.
- Gestionează clasele și materiile.
- Poate suspenda conturile care încalcă regulile.
- Poate administra anunțurile generale.
- Poate verifica activitatea administrativă.

## 2.2. Profesor

Profesorul gestionează materiile și grupurile asociate acestora.

Permisiuni:
- Creează anunțuri.
- Publică teme și proiecte.
- Anunță testele.
- Încarcă materiale didactice.
- Alege elevii care pot publica mesaje în grupul materiei.
- Modifică sau șterge propriile anunțuri.
- Stabilește termene-limită.
- Consultă lista elevilor înscriși la materia sa.

## 2.3. Elev

Elevul utilizează aplicația pentru a urmări activitatea școlară.

Permisiuni:
- Consultă anunțurile materiilor sale.
- Consultă temele și proiectele.
- Vizualizează datele testelor.
- Accesează materialele publicate de profesori.
- Primește notificări.
- Consultă calendarul personal.
- Publică mesaje în grupurile unde profesorul i-a acordat permisiunea.
- Marchează temele ca finalizate pentru propria evidență.

---

# 3. Funcționalități principale

## 3.1. Autentificare și conturi

Fiecare utilizator trebuie să aibă propriul cont.

Funcționalități:
- Înregistrare sau creare de cont prin invitație.
- Autentificare cu e-mail și parolă.
- Deconectare.
- Resetarea parolei.
- Verificarea adresei de e-mail.
- Asocierea utilizatorului cu un liceu.
- Asocierea elevului cu o clasă.
- Asocierea profesorului cu materiile predate.
- Gestionarea profilului.
- Dezactivarea conturilor.

Reguli:
- Rolul utilizatorului trebuie verificat pe server.
- Un utilizator nu își poate atribui singur rolul de administrator.
- Parolele nu se stochează în format text simplu.
- Datele private nu trebuie expuse utilizatorilor neautorizați.

## 3.2. Grupuri pentru materii

Fiecare materie va avea un grup principal.

Exemple:
- Matematică
- Limba română
- Informatică
- Fizică
- Chimie
- Biologie
- Istorie
- Geografie
- Limbi străine

Fiecare grup va conține:
- Profesorul responsabil.
- Elevii înscriși.
- Anunțurile publicate.
- Temele și proiectele.
- Testele programate.
- Materialele didactice.
- Mesajele permise.

Reguli:
- Numai membrii grupului pot vedea conținutul privat al acestuia.
- Profesorul poate publica anunțuri.
- Profesorul poate acorda permisiunea de publicare anumitor elevi.
- Elevii fără această permisiune pot consulta conținutul, dar nu pot publica mesaje.
- Profesorul poate retrage permisiunea de publicare.
- Permisiunile sunt verificate la fiecare cerere către server.

## 3.3. Teme și proiecte

Fiecare temă sau proiect va avea următoarele câmpuri:

- Titlu.
- Descriere.
- Materie.
- Profesor responsabil.
- Data publicării.
- Termen-limită.
- Fișiere atașate.
- Instrucțiuni suplimentare.
- Stare de publicare.
- Data ultimei modificări.

Funcționalități:
- Publicarea unei teme.
- Editarea unei teme.
- Ștergerea sau arhivarea unei teme.
- Afișarea temelor viitoare.
- Afișarea temelor cu termen depășit.
- Marcarea temelor ca finalizate.
- Notificarea elevilor înainte de termenul-limită.

Starea unei teme în evidența elevului:
- De făcut.
- În lucru.
- Finalizată.

Starea personală a temei nu trebuie să modifice tema pentru ceilalți elevi.

## 3.4. Teste și evaluări

Fiecare test va conține:
- Titlu.
- Materie.
- Profesor.
- Data și ora testului.
- Capitolul sau materia evaluată.
- Descriere.
- Materiale de pregătire.
- Data publicării.

Funcționalități:
- Publicarea unui test.
- Modificarea datei.
- Anularea testului.
- Notificarea elevilor.
- Afișarea testelor în calendar.

Modificările importante trebuie să genereze notificări pentru elevii afectați.

## 3.5. Materiale didactice

Profesorii pot publica:
- Documente PDF.
- Prezentări.
- Fișiere text.
- Imagini.
- Linkuri către resurse educaționale.

Reguli:
- Fișierele trebuie să respecte limitele de dimensiune.
- Tipurile de fișiere acceptate trebuie verificate pe server.
- Accesul la fișiere trebuie să respecte permisiunile grupului.
- Fișierele private nu trebuie accesibile doar prin ghicirea unui URL.

## 3.6. Știri și evenimente ale liceului

Va exista o secțiune separată pentru informații generale.

Exemple:
- Evenimente școlare.
- Concursuri.
- Olimpiade.
- Activități extracurriculare.
- Modificări de program.
- Anunțuri administrative.

Permisiuni:
- Administratorii pot publica anunțuri generale.
- Personalul autorizat poate publica evenimente.
- Elevii pot consulta informațiile publicate.

## 3.7. Notificări

Aplicația va avea un sistem de notificări.

Tipuri:
- Temă nouă.
- Modificarea unei teme.
- Termen-limită apropiat.
- Test nou.
- Modificarea unui test.
- Material nou.
- Anunț important.
- Eveniment școlar.

Canale posibile:
- Notificări în aplicație.
- E-mail.
- Notificări push, într-o versiune ulterioară.

Reguli:
- Utilizatorii trebuie să primească numai notificări relevante pentru ei.
- Notificările duplicate trebuie evitate.
- Notificările trebuie asociate utilizatorului corect.
- Notificările programate trebuie procesate de un mecanism de fundal.

## 3.8. Calendar

Calendarul va afișa:
- Temele cu termene-limită.
- Proiectele.
- Testele.
- Evenimentele școlare.

Funcționalități:
- Vizualizare pe zi.
- Vizualizare pe săptămână.
- Vizualizare pe lună.
- Filtrare după materie.
- Evidențierea termenelor apropiate.

---

# 4. Tehnologii recomandate

## Backend

- Node.js
- TypeScript
- NestJS sau Express
- API REST
- Validare a datelor primite de la client

Recomandare inițială: NestJS cu TypeScript, pentru organizarea clară a modulelor și a permisiunilor.

## Baza de date

- PostgreSQL
- Prisma ORM

Avantaje:
- Relații clare între utilizatori, clase și materii.
- Integritate referențială.
- Interogări eficiente.
- Migrații controlate ale bazei de date.

## Autentificare

- Sesiuni securizate sau tokenuri de acces.
- Parole stocate folosind un algoritm sigur de hashing.
- Verificarea identității utilizatorului.
- Autorizare bazată pe roluri și apartenența la grupuri.

## Fișiere

- Stocare privată compatibilă cu S3.
- URL-uri semnate, cu expirare, pentru accesarea fișierelor.
- Verificarea fișierelor încărcate.

## Notificări

- PostgreSQL pentru notificările persistente.
- Un worker pentru notificările programate.
- Un mecanism de coadă, dacă volumul aplicației îl justifică.
- Un serviciu de e-mail pentru notificările externe.

## Testare

- Jest sau Vitest.
- Teste unitare.
- Teste de integrare.
- Teste pentru autorizare.
- Teste pentru scenarii cu utilizatori diferiți.

---

# 5. Structura backendului

Structura orientativă a proiectului:

src/
├── app.module.ts
├── main.ts
├── common/
│   ├── decorators/
│   ├── guards/
│   ├── filters/
│   ├── interceptors/
│   └── validators/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── dto/
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── dto/
├── schools/
├── classes/
├── subjects/
├── groups/
├── announcements/
├── assignments/
├── tests/
├── materials/
├── events/
├── notifications/
├── calendar/
└── audit/

prisma/
├── schema.prisma
└── migrations/

test/
├── auth/
├── permissions/
├── assignments/
└── notifications/

---

# 6. Structura bazei de date

## 6.1. User

Reprezintă un utilizator.

Câmpuri:
- id
- email
- passwordHash
- firstName
- lastName
- role
- schoolId
- createdAt
- updatedAt
- isActive

Roluri:
- ADMIN
- TEACHER
- STUDENT

## 6.2. School

Reprezintă un liceu.

Câmpuri:
- id
- name
- address
- createdAt

## 6.3. SchoolClass

Reprezintă o clasă de elevi.

Câmpuri:
- id
- name
- schoolId
- schoolYear

Exemple:
- IX A
- X B
- XI C
- XII A

## 6.4. ClassMembership

Leagă elevii de clase.

Câmpuri:
- id
- studentId
- classId
- joinedAt

Această structură permite păstrarea istoricului claselor, dacă va fi necesar.

## 6.5. Subject

Reprezintă o materie.

Câmpuri:
- id
- name
- schoolId
- createdAt

## 6.6. SubjectGroup

Reprezintă grupul asociat unei materii, unei clase și unui profesor.

Câmpuri:
- id
- subjectId
- classId
- teacherId
- name
- createdAt

O materie poate avea grupuri diferite pentru clase diferite.

## 6.7. GroupMembership

Reprezintă apartenența unui utilizator la un grup.

Câmpuri:
- id
- groupId
- userId
- membershipRole
- canPost
- joinedAt

Reguli:
- Profesorul responsabil are permisiunile necesare pentru administrarea grupului.
- Elevii pot avea permisiunea de a publica sau numai de a citi.
- Profesorul poate modifica permisiunea `canPost`.
- Un utilizator nu poate modifica singur această permisiune.

## 6.8. Announcement

Reprezintă un anunț.

Câmpuri:
- id
- groupId
- authorId
- title
- content
- createdAt
- updatedAt
- isPinned

## 6.9. Assignment

Reprezintă o temă sau un proiect.

Câmpuri:
- id
- groupId
- authorId
- title
- description
- dueAt
- createdAt
- updatedAt
- status

## 6.10. AssignmentProgress

Reprezintă starea personală a temei pentru un elev.

Câmpuri:
- id
- assignmentId
- studentId
- status
- updatedAt

Stări:
- TODO
- IN_PROGRESS
- COMPLETED

Constrângere:
- Un elev trebuie să aibă cel mult o înregistrare de progres pentru aceeași temă.

## 6.11. Exam

Reprezintă un test sau o evaluare.

Câmpuri:
- id
- groupId
- authorId
- title
- description
- scheduledAt
- createdAt
- updatedAt
- status

## 6.12. Material

Reprezintă un material didactic.

Câmpuri:
- id
- groupId
- authorId
- title
- description
- fileKey
- fileType
- createdAt

## 6.13. SchoolEvent

Reprezintă un eveniment școlar.

Câmpuri:
- id
- schoolId
- authorId
- title
- description
- startsAt
- endsAt
- createdAt

## 6.14. Notification

Reprezintă o notificare pentru un utilizator.

Câmpuri:
- id
- userId
- type
- title
- message
- resourceType
- resourceId
- scheduledAt
- sentAt
- readAt
- createdAt

## 6.15. AuditLog

Reprezintă o acțiune importantă efectuată în sistem.

Câmpuri:
- id
- actorId
- action
- resourceType
- resourceId
- createdAt

Nu trebuie stocate parole, tokenuri sau alte secrete în jurnalul de audit.

---

# 7. Reguli de securitate și autorizare

Aceste reguli sunt obligatorii, nu funcționalități opționale pentru o versiune viitoare.

1. Toate datele primite de la client trebuie validate.
2. Autentificarea trebuie verificată pe server.
3. Rolurile trebuie verificate pe server.
4. Apartenența la liceu, clasă și grup trebuie verificată.
5. Elevii nu pot modifica permisiunile proprii.
6. Elevii nu pot publica în grupuri unde nu au permisiunea necesară.
7. Profesorii nu pot modifica arbitrar datele altor licee.
8. Un utilizator nu poate accesa datele private ale altui liceu.
9. Fișierele private trebuie protejate.
10. Parolele trebuie stocate prin hashing sigur.
11. Operațiunile sensibile trebuie înregistrate în jurnalul de audit.
12. Trebuie implementate limite pentru autentificare și încărcarea fișierelor.
13. Datele personale trebuie protejate.
14. Accesul trebuie verificat pentru fiecare resursă, nu doar pentru pagina de interfață.
15. Conturile și datele minorilor trebuie tratate cu atenție specială.

Pentru utilizarea într-un liceu real, trebuie stabilite și regulile privind protecția datelor personale, retenția datelor și responsabilitățile instituției.

---

# 8. API REST

Prefix general:

/api/v1

## Autentificare

POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
GET  /api/v1/auth/me

## Utilizatori

GET   /api/v1/users/me
PATCH /api/v1/users/me
GET   /api/v1/users/:id

Accesul la informațiile altor utilizatori trebuie limitat la datele necesare funcționării aplicației.

## Clase

GET  /api/v1/classes
GET  /api/v1/classes/:id
POST /api/v1/classes

Crearea claselor trebuie permisă numai rolurilor autorizate.

## Materii și grupuri

GET   /api/v1/subjects
GET   /api/v1/groups
GET   /api/v1/groups/:id
POST  /api/v1/groups
PATCH /api/v1/groups/:id

## Membrii grupurilor

GET   /api/v1/groups/:id/members
PATCH /api/v1/groups/:id/members/:userId/permissions

Numai profesorul responsabil sau un administrator autorizat poate modifica permisiunile de publicare.

## Anunțuri

GET    /api/v1/groups/:id/announcements
POST   /api/v1/groups/:id/announcements
GET    /api/v1/announcements/:id
PATCH  /api/v1/announcements/:id
DELETE /api/v1/announcements/:id

## Teme și proiecte

GET    /api/v1/groups/:id/assignments
POST   /api/v1/groups/:id/assignments
GET    /api/v1/assignments/:id
PATCH  /api/v1/assignments/:id
DELETE /api/v1/assignments/:id

## Progresul elevilor

GET   /api/v1/assignments/:id/progress
PATCH /api/v1/assignments/:id/progress/me

Elevul își poate modifica numai propriul progres.

## Teste

GET    /api/v1/groups/:id/exams
POST   /api/v1/groups/:id/exams
GET    /api/v1/exams/:id
PATCH  /api/v1/exams/:id
DELETE /api/v1/exams/:id

## Materiale

GET    /api/v1/groups/:id/materials
POST   /api/v1/groups/:id/materials
GET    /api/v1/materials/:id
DELETE /api/v1/materials/:id

Încărcarea fișierelor poate folosi un flux separat pentru URL-uri de încărcare securizate.

## Evenimente școlare

GET   /api/v1/events
POST  /api/v1/events
GET   /api/v1/events/:id
PATCH /api/v1/events/:id

## Notificări

GET   /api/v1/notifications
PATCH /api/v1/notifications/:id/read
PATCH /api/v1/notifications/read-all

## Calendar

GET /api/v1/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD

Calendarul trebuie să returneze numai evenimentele și activitățile la care utilizatorul are drept de acces.

---

# 9. Logica notificărilor

## La publicarea unei teme

1. Profesorul creează tema.
2. Serverul validează datele.
3. Serverul verifică permisiunile profesorului.
4. Tema este salvată în baza de date.
5. Sistemul identifică elevii grupului.
6. Sunt create notificările relevante.
7. Elevii pot consulta tema.

## Înainte de termenul-limită

1. Un proces de fundal caută temele cu termene apropiate.
2. Verifică dacă notificarea trebuie trimisă.
3. Verifică dacă notificarea respectivă nu a fost deja trimisă.
4. Creează sau trimite notificarea.
5. Înregistrează rezultatul operațiunii.

Intervale configurabile pentru MVP:
- Cu 24 de ore înainte.
- Cu 2 ore înainte.

Aceste intervale trebuie configurate și nu trebuie presupuse obligatorii pentru fiecare liceu.

## La modificarea unui test

1. Profesorul modifică testul.
2. Serverul verifică drepturile.
3. Testul este actualizat.
4. Sistemul identifică elevii afectați.
5. Sunt create notificări privind schimbarea.

---

# 10. Etapele dezvoltării

## Etapa 1: Configurarea proiectului

- Inițializarea repository-ului Git.
- Configurarea Node.js și TypeScript.
- Configurarea NestJS.
- Configurarea PostgreSQL.
- Configurarea Prisma.
- Configurarea variabilelor de mediu.
- Configurarea formatării și verificării codului.
- Configurarea testelor.

Rezultat:
Backend funcțional, conectat la baza de date.

## Etapa 2: Autentificare

- Înregistrare sau creare de cont.
- Autentificare.
- Deconectare.
- Recuperarea parolei.
- Endpoint pentru utilizatorul curent.
- Validarea rolurilor.
- Protejarea endpointurilor private.

Rezultat:
Utilizatorii se pot autentifica în siguranță.

## Etapa 3: Structura școlii

- Licee.
- Clase.
- Materii.
- Profesori.
- Elevi.
- Înscrierea elevilor în clase.
- Asocierea profesorilor cu grupurile.

Rezultat:
Există structura organizațională a aplicației.

## Etapa 4: Grupuri și permisiuni

- Crearea grupurilor pentru materii.
- Asocierea membrilor.
- Permisiuni de citire.
- Permisiuni de publicare.
- Modificarea permisiunilor de către profesor.
- Testarea accesului neautorizat.

Rezultat:
Fiecare grup respectă regulile de acces.

## Etapa 5: Anunțuri

- Crearea anunțurilor.
- Modificarea anunțurilor.
- Ștergerea sau arhivarea.
- Fixarea anunțurilor importante.
- Listarea și paginarea anunțurilor.

Rezultat:
Profesorii pot comunica organizat cu elevii.

## Etapa 6: Teme și proiecte

- Crearea temelor.
- Stabilirea termenelor-limită.
- Modificarea și arhivarea temelor.
- Evidența progresului elevilor.
- Filtrarea temelor după termen.

Rezultat:
Elevii își pot organiza activitatea școlară.

## Etapa 7: Teste

- Publicarea testelor.
- Modificarea datelor.
- Anularea testelor.
- Listarea evaluărilor.
- Integrarea cu calendarul.

Rezultat:
Testele sunt centralizate.

## Etapa 8: Materiale

- Încărcarea fișierelor.
- Validarea tipurilor de fișiere.
- Controlul dimensiunilor.
- Stocare privată.
- Descărcare autorizată.

Rezultat:
Materialele pot fi distribuite în siguranță.

## Etapa 9: Notificări

- Notificări în aplicație.
- Notificări la publicarea temelor.
- Notificări la modificarea testelor.
- Notificări programate.
- Prevenirea duplicatelor.

Rezultat:
Elevii sunt informați despre activitățile relevante.

## Etapa 10: Evenimente și calendar

- Evenimente școlare.
- Vizualizarea calendarului.
- Filtrarea activităților.
- Integrarea temelor și testelor.

Rezultat:
Activitățile școlare sunt vizibile într-un singur loc.

## Etapa 11: Testare și securitate

- Teste pentru autentificare.
- Teste pentru fiecare rol.
- Teste pentru izolarea liceelor.
- Teste pentru permisiunile grupurilor.
- Teste pentru termene și notificări.
- Teste pentru accesul la fișiere.
- Verificarea jurnalelor de audit.

Rezultat:
Aplicația este pregătită pentru o testare controlată.

## Etapa 12: Lansare pilot

- Crearea mediului de producție.
- Configurarea bazei de date.
- Configurarea backupurilor.
- Configurarea monitorizării.
- Crearea primelor conturi.
- Testarea cu un număr limitat de utilizatori.
- Colectarea feedbackului.

Rezultat:
Prima versiune poate fi testată într-un liceu.

---

# 11. Teste obligatorii

## Teste de autentificare

- Utilizatorul se poate autentifica cu date valide.
- Parola greșită este respinsă.
- Utilizatorul neautentificat nu poate accesa date private.
- Utilizatorul nu își poate atribui rolul de administrator.

## Teste de permisiuni

- Elevul poate citi anunțurile grupului său.
- Elevul fără permisiune nu poate publica mesaje.
- Elevul autorizat poate publica în grupul corespunzător.
- Profesorul poate modifica permisiunile grupului său.
- Profesorul nu poate administra grupuri fără drepturi.
- Utilizatorii unui liceu nu pot accesa date private ale altui liceu.

## Teste pentru teme

- Profesorul autorizat poate crea teme.
- Elevul nu poate modifica tema altui utilizator.
- Elevul poate modifica numai propriul progres.
- Termenele-limită sunt validate.
- Notificările nu se dublează.

## Teste pentru fișiere

- Fișierele nepermise sunt respinse.
- Fișierele prea mari sunt respinse.
- Un utilizator neautorizat nu poate descărca materiale private.

---

# 12. Cerințe pentru interfața viitoare

Deși prima prioritate este backendul, API-ul trebuie proiectat astfel încât să poată fi folosit de o interfață web sau mobilă.

Ecrane viitoare:
- Autentificare.
- Pagina principală.
- Materiile mele.
- Grupul unei materii.
- Lista temelor.
- Detaliile unei teme.
- Calendar.
- Teste.
- Materiale.
- Notificări.
- Știri și evenimente.
- Profil.

Interfața nu trebuie să fie responsabilă de aplicarea regulilor de securitate. Acestea trebuie impuse de backend.

---

# 13. Cerințe pentru calitatea codului

- TypeScript cu verificări stricte.
- Validarea tuturor datelor de intrare.
- Separarea controllerelor de logica de business.
- Accesul la date prin servicii sau repository-uri bine definite.
- Tratarea coerentă a erorilor.
- Documentarea API-ului.
- Teste automate pentru funcționalitățile importante.
- Migrații versionate pentru baza de date.
- Fără parole sau chei secrete în repository.
- Fără reguli de autorizare implementate exclusiv în frontend.
- Fără endpointuri administrative publice.
- Fără presupunerea că identificatorii trimiși de client sunt autorizați.

---

# 14. Criterii de acceptare pentru MVP

Prima versiune este considerată funcțională când:

- Utilizatorii se pot autentifica.
- Elevii sunt asociați claselor corecte.
- Profesorii sunt asociați grupurilor corecte.
- Grupurile pot fi create și consultate.
- Permisiunile de publicare funcționează.
- Profesorii pot publica teme.
- Profesorii pot anunța teste.
- Materialele pot fi distribuite cu acces controlat.
- Elevii își pot urmări progresul la teme.
- Notificările de bază funcționează.
- Evenimentele școlare pot fi publicate.
- Calendarul returnează activitățile relevante.
- Testele automate verifică permisiunile critice.
- Datele unui liceu sunt izolate de cele ale altuia.
- Backupurile și monitorizarea sunt configurate.

---

# 15. Ordinea recomandată de implementare

Ordinea practică de dezvoltare:

1. Configurarea backendului.
2. Configurarea bazei de date.
3. Autentificarea.
4. Utilizatorii și rolurile.
5. Liceele și clasele.
6. Materiile și grupurile.
7. Permisiunile de publicare.
8. Anunțurile.
9. Temele și proiectele.
10. Testele.
11. Materialele.
12. Notificările.
13. Evenimentele școlare.
14. Calendarul.
15. Testele de securitate.
16. Lansarea pilot.

Nu se recomandă construirea tuturor funcționalităților simultan. Mai întâi trebuie să funcționeze corect autentificarea, modelul de date și autorizarea.

---

# 16. Decizii care trebuie stabilite înainte de producție

- Dacă fiecare liceu își poate crea singur conturile.
- Dacă elevii se înregistrează singuri sau primesc invitații.
- Dacă profesorii pot administra mai multe clase.
- Dacă o materie poate avea mai mulți profesori.
- Dacă elevii pot încărca teme în aplicație.
- Dacă aplicația va trimite notificări prin e-mail.
- Dacă sunt necesare notificări push.
- Ce limite se aplică fișierelor.
- Cât timp sunt păstrate datele.
- Cine poate șterge conturile.
- Cum sunt gestionate conturile elevilor care schimbă clasa sau liceul.
- Ce politici de protecție a datelor sunt necesare.

Aceste decizii trebuie documentate înainte de lansarea publică.

---

# 17. Obiectivul final

High School Students' App trebuie să devină un spațiu centralizat pentru comunicarea școlară.

Prioritățile fundamentale sunt:

1. Informații organizate pe materii.
2. Permisiuni clare pentru profesori și elevi.
3. Teme și proiecte cu termene vizibile.
4. Teste și evaluări anunțate din timp.
5. Materiale didactice ușor de găsit.
6. Notificări relevante.
7. Evenimente școlare centralizate.
8. Protejarea datelor personale.
9. Backend testat și ușor de extins.

**Prima țintă de dezvoltare:** un backend funcțional, cu autentificare, bază de date, grupuri pentru materii, permisiuni și publicarea temelor.