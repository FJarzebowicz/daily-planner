# Daily Planner

Minimalistyczny daily planner — aplikacja do planowania dnia.

## Stack
- **Frontend:** React (Vite + TypeScript)
- **Backend:** Java Spring Boot (planowany później) — API projektować z myślą o przyszłej integracji
- **Dane:** Na razie React state, struktura gotowa pod REST API

## UI/UX
- Prosty, czysty, minimalistyczny design
- Estetyka inspirowana Claude: dużo whitespace, stonowane kolory, czytelna typografia
- Kolory statusów: zielony = zrobione/zjedzone, czerwony = niezrobione po zamknięciu dnia

## Struktura aplikacji

### Nagłówek (zawsze widoczny)
- Aktualny dzień tygodnia i data
- Godzina wstania i zaśnięcia (edytowalne)
- Licznik tasków: wykonane/wszystkie + pasek procentowy
- Przycisk „Zamknij dzień" — niewykonane taski i nieoznaczone posiłki podświetlone na czerwono, akcja nieodwracalna

### Sekcja 1 — Todo
- Taski z kategoriami (kolorowe)
- CRUD na kategoriach
- Task: nazwa + opis + tagi (czas, priorytet, kolejność)
- Zrobione → zielono, niezrobione po zamknięciu dnia → czerwono

### Sekcja 2 — Jedzenie
- 5 slotów: śniadanie, II śniadanie, obiad, podwieczorek, kolacja
- Pole tekstowe + status zjedzony/nie
- Zielono/czerwono jak w Todo

### Sekcja 3 — Rozkminki
- Prosta lista notatek/myśli
- Dodajemy wpisy tekstowe, nic więcej

### Sekcja 4 — Stałe wydarzenia
- Cykliczne aktywności (np. „Siłka 10:00–11:30")
- Nazwa + zakres godzinowy
- Lista chronologiczna
- Powtarzają się każdego dnia

## Dane
- Pogrupowane per dzień
- Możliwość przeglądania historii

## Komendy
- `npm run dev` — dev server
- `npm run build` — build produkcyjny
- `npm run lint` — linting
