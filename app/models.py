from flask_login import UserMixin

from app import bcrypt, db, login_manager


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


class User(db.Model, UserMixin):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    avatar_url = db.Column(db.String(500), nullable=True)
    xp = db.Column(db.Integer, default=0)
    bio = db.Column(db.String(300), nullable=True)
    github = db.Column(db.String(100), nullable=True)
    telegram = db.Column(db.String(100), nullable=True)
    instagram = db.Column(db.String(100), nullable=True)
    website = db.Column(db.String(200), nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    def set_password(self, password):
        self.password = bcrypt.generate_password_hash(password).decode("utf-8")

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password, password)

    def add_xp(self, amount):
        self.xp += amount

    @property
    def level(self):
        if self.xp < 100:
            return 1
        elif self.xp < 300:
            return 2
        elif self.xp < 600:
            return 3
        elif self.xp < 1000:
            return 4
        else:
            return 5

    @property
    def level_name(self):
        names = {
            1: "Rookie",
            2: "Bronze",
            3: "Silver",
            4: "Gold",
            5: "Platinum",
        }
        return names[self.level]

    @property
    def xp_progress(self):
        thresholds = [0, 100, 300, 600, 1000]
        if self.level == 5:
            return 100
        current = thresholds[self.level - 1]
        next_level = thresholds[self.level]
        return round((self.xp - current) / (next_level - current) * 100)

    def __repr__(self):
        return f"<User {self.username}>"


class Exam(db.Model):
    __tablename__ = "exams"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    duration = db.Column(db.Integer, default=30)
    question_count = db.Column(db.Integer, nullable=True)  # None = hammasi
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    questions = db.relationship(
        "Question", backref="exam", cascade="all, delete-orphan"
    )
    results = db.relationship(
        "Result", back_populates="exam", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Exam {self.title}>"


class Question(db.Model):
    __tablename__ = "questions"

    id = db.Column(db.Integer, primary_key=True)
    exam_id = db.Column(db.Integer, db.ForeignKey("exams.id"), nullable=False)
    text = db.Column(db.Text, nullable=False)
    option_a = db.Column(db.String(300), nullable=False)
    option_b = db.Column(db.String(300), nullable=False)
    option_c = db.Column(db.String(300), nullable=False)
    option_d = db.Column(db.String(300), nullable=False)
    correct = db.Column(db.String(1), nullable=False)

    def __repr__(self):
        return f"<Question {self.id}>"


class Result(db.Model):
    __tablename__ = "results"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    exam_id = db.Column(db.Integer, db.ForeignKey("exams.id"), nullable=False)
    score = db.Column(db.Integer, default=0)
    total = db.Column(db.Integer, default=0)
    finished_at = db.Column(db.DateTime, server_default=db.func.now())

    user = db.relationship("User", backref="results")
    exam = db.relationship("Exam", back_populates="results")


class Reference(db.Model):
    __tablename__ = "references"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    def __repr__(self):
        return f"<Reference {self.title}>"


class VocabSet(db.Model):
    __tablename__ = "vocab_sets"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    words = db.relationship("Vocab", backref="set", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<VocabSet {self.title}>"


class Vocab(db.Model):
    __tablename__ = "vocab"

    id = db.Column(db.Integer, primary_key=True)
    set_id = db.Column(db.Integer, db.ForeignKey("vocab_sets.id"), nullable=False)
    word = db.Column(db.String(200), nullable=False)
    translation = db.Column(db.String(200), nullable=False)
    example = db.Column(db.Text, nullable=True)
    category = db.Column(
        db.String(50), nullable=True
    )  # noun, verb, adj, adv, phrase...
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    def __repr__(self):
        return f"<Vocab {self.word}>"
