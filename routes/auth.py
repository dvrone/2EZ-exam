from flask import Blueprint, flash, redirect, render_template, request, url_for
from flask_login import current_user, login_required, login_user, logout_user

from app import db
from app.models import Exam, Result, User

auth = Blueprint("auth", __name__)


@auth.route("/")
def index():
    if current_user.is_authenticated:
        return redirect(url_for("auth.dashboard"))
    return redirect(url_for("auth.login"))


@auth.route("/register", methods=["GET", "POST"])
def register():
    if current_user.is_authenticated:
        return redirect(url_for("auth.dashboard"))

    if request.method == "POST":
        username = request.form.get("username")
        email = request.form.get("email")
        password = request.form.get("password")

        # Username validatsiya
        import re

        if not re.match(r"^[a-zA-Z0-9_]{3,20}$", username):
            flash(
                "Username faqat harflar, raqamlar va _ belgisidan iborat bo'lishi kerak (3-20 ta belgi).",
                "danger",
            )
            return redirect(url_for("auth.register"))

        if len(password) < 6:
            flash("Parol kamida 6 ta belgidan iborat bo'lishi kerak!", "danger")
            return redirect(url_for("auth.register"))

        if User.query.filter_by(email=email).first():
            flash("Bu email allaqachon ro'yxatdan o'tgan!", "danger")
            return redirect(url_for("auth.register"))

        if User.query.filter_by(username=username).first():
            flash("Bu username band!", "danger")
            return redirect(url_for("auth.register"))

        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        login_user(user)
        return redirect(url_for("auth.dashboard"))

    return render_template("auth/register.html")


@auth.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for("auth.dashboard"))

    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")
        user = User.query.filter_by(email=email).first()

        if user and user.check_password(password):
            login_user(user)
            return redirect(url_for("auth.dashboard"))

        flash("Email yoki parol noto'g'ri!", "danger")

    return render_template("auth/login.html")


@auth.route("/dashboard")
@login_required
def dashboard():
    results = (
        Result.query.filter_by(user_id=current_user.id)
        .order_by(Result.finished_at.desc())
        .all()
    )
    exams = Exam.query.all()
    return render_template("auth/dashboard.html", results=results, exams=exams)


@auth.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("auth.login"))


@auth.route("/leaderboard")
@login_required
def leaderboard():
    if current_user.is_admin:
        users = User.query.order_by(User.xp.desc()).all()
    else:
        users = User.query.order_by(User.xp.desc()).limit(20).all()

    return render_template("auth/leaderboard.html", users=users)


@auth.route("/profile")
@login_required
def profile():
    results = Result.query.filter_by(user_id=current_user.id).all()
    total_exams = len(results)
    total_correct = sum(r.score for r in results)
    total_questions = sum(r.total for r in results)
    avg_percentage = (
        round(total_correct / total_questions * 100) if total_questions > 0 else 0
    )

    return render_template(
        "auth/profile.html",
        results=results,
        total_exams=total_exams,
        total_correct=total_correct,
        total_questions=total_questions,
        avg_percentage=avg_percentage,
    )
