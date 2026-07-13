# 2EZ-exam

A test, vocabulary, and reference platform for students.

## Tech Stack

- **Backend:** Python, Flask, SQLAlchemy, Flask-Login, Flask-Bcrypt
- **Frontend:** Jinja2, Bootstrap 5, Bootstrap Icons, Google Sans
- **Database:** SQLite
- **Server:** Gunicorn
- **Rendering:** Python-Markdown, KaTeX, Highlight.js

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

```bash
SECRET_KEY=your-super-secret-key
DATABASE_URL=sqlite:///2ez_exam.db
FLASK_ENV=production
DEBUG=False
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

|URL|Description|
|---|---|
|`/`|Home / Dashboard|
|`/register`|Sign up|
|`/login`|Sign in|
|`/dashboard`|User dashboard|
|`/exams`|Exam list|
|`/vocab`|Vocabulary sets|
|`/reference`|Reference materials|
|`/leaderboard`|Rankings|
|`/profile`|User profile|
|`/settings`|User settings|
|`/admin`|Admin panel|

## Features

- 🔐 User authentication (register, login, logout)
- 👑 Admin panel with user management
- 📝 Exam creation and management
- 📂 Bulk question upload via `.txt`
- 🎮 Duolingo-style quiz interface
- 🔢 Math rendering with KaTeX (`$...$`)
- 💻 Code highlighting with Highlight.js
- 📖 Markdown support in questions and references
- 📚 Reference materials section with markdown
- 🔤 Vocabulary module (Flashcard + Quiz + TTS)
- 📦 Bulk vocabulary upload via `.json`
- ⚡ XP and level system (Rookie → Platinum)
- 🏆 Leaderboard (Top 20 / Admin sees all)
- 👤 User profiles with bio and social links
- 🖼️ Avatar via URL
- 🌙 Dark / Light mode toggle
- 📱 Mobile responsive + PWA (installable)
- 🔊 Sound effects and vibration feedback
- ⌨️ Keyboard shortcuts (Space, Enter, ←, →)
- 🔍 Question review navigation
- 📊 Personal statistics dashboard

## Changelog

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
