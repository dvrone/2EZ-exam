# 2EZ-exam

A test and reference platform for students.

## Tech Stack

- **Backend:** Python, Flask, SQLAlchemy, Flask-Login, Flask-Bcrypt
- **Frontend:** Jinja2, Bootstrap 5, Bootstrap Icons
- **Database:** SQLite
- **Server:** Gunicorn

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/username/2EZ-exam.git
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

```env
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

| URL | Description |
|-----|-------------|
| `/register` | Sign up |
| `/login` | Sign in |
| `/dashboard` | Home page |
| `/exams` | Exam list |
| `/reference` | Reference materials |
| `/leaderboard` | Rankings |

## Question File Format

Questions can be uploaded via `.txt` file:

```
? Question text
option A
option B
#correct option
option D

? Next question
...
```

`#` marks the correct answer.

## Features

- 🔐 User authentication
- 👑 Admin panel
- 📝 Exam creation and management
- 📚 Reference materials section
- 🎮 Duolingo-style quiz interface
- ⚡ XP and level system
- 🏆 Leaderboard (Top 20 / Admin sees all)
- 🌙 Dark / Light mode toggle
- 📱 Mobile responsive
- 📂 Bulk question upload via `.txt`
- 🔊 Sound effects and vibration feedback

## License

MIT
