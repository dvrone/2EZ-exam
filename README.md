# 2EZ-exam

A test, vocabulary, and reference platform for students.

## Tech Stack

- **Backend:** Python, Flask, SQLAlchemy, Flask-Login, Flask-Bcrypt, Authlib
- **Frontend:** Jinja2, Bootstrap 5, Bootstrap Icons, Google Sans
- **Database:** SQLite
- **Server:** Gunicorn
- **Rendering:** Python-Markdown, KaTeX, Highlight.js
- **Auth:** Google OAuth2

## Installation

### 1. Clone the repository

```bash
git clone git@github.com:dvrone/2EZ-exam.git
cd 2EZ-exam
```

### 2. Create a virtual environment

```bash
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
.venv\Scripts\activate     # Windows
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Create `.env` file

```bash
cp .env.example .env
```

Edit `.env`:

```
SECRET_KEY=your-super-secret-key
DATABASE_URL=sqlite:///2ez_exam.db
FLASK_ENV=production
DEBUG=False
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 5. Initialize the database

```bash
python init_db.py
```

### 6. Create an admin user

```bash
python create_admin.py
```

### 7. Run the server

Development:

```bash
python run.py
```

Production:

```bash
gunicorn wsgi:app
```

## Routes

| URL | Description |
|-----|-------------|
| `/` | Home / Dashboard |
| `/register` | Sign up |
| `/login` | Sign in (email or Google) |
| `/auth/google` | Google OAuth2 login |
| `/dashboard` | User dashboard |
| `/exams` | Exam list |
| `/vocab` | Vocabulary sets |
| `/reference` | Reference materials |
| `/leaderboard` | Rankings |
| `/profile` | User profile |
| `/settings` | User settings |
| `/admin` | Admin panel |

## Question File Format (.txt)

<pre>
? Question text
```python
print("Hello")
```
- Option A
- #Correct option
- Option C
- Option D

? Math question $E = mc^2$
- Option A
- Option B
- #Correct option
- Option D
</pre>

`-` marks an option, `#` before option marks the correct answer.
Supports **markdown**, `code blocks`, and `$math$` formulas.

## Vocabulary File Format (.json)

```json
[
  {
    "word": "Apple",
    "translation": "Olma",
    "category": "noun",
    "example": "I eat an apple every day."
  },
  {
    "word": "Run",
    "translation": "Yugurmoq",
    "category": "verb"
  }
]
```

## Features

- 🔐 User authentication (register, login, logout)
- 🔑 Google OAuth2 login
- 👑 Admin panel with user management
- 📝 Exam creation and management
- 📂 Bulk question upload via `.txt`
- 🎮 Duolingo-style quiz interface
- 🔢 Math rendering with KaTeX (`$...$`)
- 💻 Code highlighting with Highlight.js
- 📖 Markdown support in questions and references
- 📚 Reference materials section with markdown
- 🔤 Vocabulary module:
  - ⚡ Flashcard (with progress saving)
  - ❓ Quiz (4 options)
  - 🎤 Pronunciation (Web Speech API)
  - ⌨️ Typing practice
- 📦 Bulk vocabulary upload via `.json`
- 🏷️ Word categories (noun, verb, adj, etc.)
- ⚡ XP and level system (Rookie → Mythic, 10 levels)
- 🔥 Daily streak system
- 🏆 Leaderboard (Top 20 / Admin sees all)
- 👤 User profiles with bio and social links
- 🖼️ Avatar via URL
- 🌙 Dark / Light mode toggle (Duolingo-style dark)
- 📱 Mobile responsive + PWA (installable)
- 🔊 Sound effects and vibration feedback
- ⌨️ Keyboard shortcuts (Space, Enter, ←, →)
- 🔍 Question review navigation
- 📊 Personal statistics dashboard

## Level System

| Level | Name | XP Required |
|-------|------|-------------|
| 1 | Rookie | 0 |
| 2 | Bronze | 500 |
| 3 | Silver | 1,500 |
| 4 | Gold | 3,500 |
| 5 | Platinum | 7,000 |
| 6 | Diamond | 13,000 |
| 7 | Master | 23,000 |
| 8 | Grandmaster | 40,000 |
| 9 | Legend | 70,000 |
| 10 | Mythic | 120,000 |

## Changelog

- **v1.1.1** — Flashcard progress saving, CSS refactor
- **v1.1.0** — Streak system, typing practice, pronunciation fixes, level system update (10 levels)
- **v1.0.0** — Typing practice, pronunciation, PWA, Google OAuth, markdown, KaTeX
- **v0.9.0** — PWA support (manifest, service worker, icons)
- **v0.8.0** — Markdown, KaTeX math, code highlighting
- **v0.7.0** — Fullscreen mode, question review navigation
- **v0.6.0** — Avatar support, question count selection, bug fixes
- **v0.5.0** — Admin panel, user profiles, bio, social links
- **v0.4.0** — Vocab module (Flashcard, Quiz, TTS)
- **v0.3.0** — Dark mode, XP system, Leaderboard, UI refactor
- **v0.2.0** — Auth, Exam CRUD, Reference module
- **v0.1.0** — Initial release

## License

MIT
