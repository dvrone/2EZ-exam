from datetime import date

from flask_login import UserMixin

from app import bcrypt, db, login_manager


@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))


class User(db.Model, UserMixin):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    avatar_url = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    def set_password(self, password):
        self.password = bcrypt.generate_password_hash(password).decode("utf-8")

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password, password)

    def __repr__(self):
        return f"<User {self.username}>"


class VocabSet(db.Model):
    __tablename__ = "vocab_sets"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    order_index = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, onupdate=db.func.now())

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
    category = db.Column(db.String(50), nullable=True)
    ipa = db.Column(db.String(100), nullable=True)
    order_index = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, onupdate=db.func.now())

    def __repr__(self):
        return f"<Vocab {self.word}>"


class StudyProgress(db.Model):
    __tablename__ = "study_progress"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    set_id = db.Column(db.Integer, db.ForeignKey("vocab_sets.id"), nullable=False)
    vocab_id = db.Column(db.Integer, db.ForeignKey("vocab.id"), nullable=False)
    current_step = db.Column(db.String(20), default="flashcard")
    completed = db.Column(db.Boolean, default=False)
    updated_at = db.Column(
        db.DateTime,
        server_default=db.func.now(),
        onupdate=db.func.now(),
    )

    user = db.relationship("User", backref="study_progress")
    vocab = db.relationship("Vocab", backref="progress")

    __table_args__ = (
        db.UniqueConstraint("user_id", "set_id", "vocab_id", name="unique_progress"),
    )

    def __repr__(self):
        return f"<StudyProgress user={self.user_id} vocab={self.vocab_id} step={self.current_step}>"
