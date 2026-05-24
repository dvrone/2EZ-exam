import random

from flask import Blueprint, flash, redirect, render_template, request, url_for
from flask_login import current_user, login_required

from app import db
from app.models import Exam, Question, Result

exam_bp = Blueprint("exam", __name__)


def admin_required(f):
    from functools import wraps

    @wraps(f)
    def decorated(*args, **kwargs):
        if not current_user.is_admin:
            flash("Ruxsat yo'q!", "danger")
            return redirect(url_for("exam.list_exams"))
        return f(*args, **kwargs)

    return decorated


# Barcha imtihonlar
@exam_bp.route("/exams")
@login_required
def list_exams():
    exams = Exam.query.all()
    return render_template("exam/list.html", exams=exams)


# Imtihon yaratish (faqat admin)
@exam_bp.route("/exams/create", methods=["GET", "POST"])
@login_required
@admin_required
def create_exam():
    if request.method == "POST":
        question_count = request.form.get("question_count")
        exam = Exam(
            title=request.form.get("title"),
            description=request.form.get("description"),
            duration=int(request.form.get("duration", 30)),
            question_count=int(question_count) if question_count else None,
        )
        db.session.add(exam)
        db.session.commit()
        flash("Imtihon yaratildi!", "success")
        return redirect(url_for("exam.add_question", exam_id=exam.id))

    return render_template("exam/create.html")


@exam_bp.route("/exams/<int:exam_id>/edit", methods=["GET", "POST"])
@login_required
@admin_required
def edit_exam(exam_id):
    exam = Exam.query.get_or_404(exam_id)

    if request.method == "POST":
        question_count = request.form.get("question_count")
        exam.title = request.form.get("title")
        exam.description = request.form.get("description")
        exam.duration = int(request.form.get("duration", 30))
        exam.question_count = int(question_count) if question_count else None
        db.session.commit()
        flash("Imtihon yangilandi!", "success")
        return redirect(url_for("exam.exam_detail", exam_id=exam.id))

    return render_template("exam/edit_exam.html", exam=exam)


# Imtihonni o'chirish
@exam_bp.route("/exams/<int:exam_id>/delete", methods=["POST"])
@login_required
@admin_required
def delete_exam(exam_id):
    exam = Exam.query.get_or_404(exam_id)
    db.session.delete(exam)
    db.session.commit()
    flash("Imtihon o'chirildi!", "success")
    return redirect(url_for("exam.list_exams"))


# Savol qo'shish
@exam_bp.route("/exams/<int:exam_id>/add-question", methods=["GET", "POST"])
@login_required
@admin_required
def add_question(exam_id):
    exam = Exam.query.get_or_404(exam_id)

    if request.method == "POST":
        question = Question(
            exam_id=exam.id,
            text=request.form.get("text"),
            option_a=request.form.get("option_a"),
            option_b=request.form.get("option_b"),
            option_c=request.form.get("option_c"),
            option_d=request.form.get("option_d"),
            correct=request.form.get("correct"),
        )
        db.session.add(question)
        db.session.commit()

        if request.form.get("action") == "finish":
            flash("Imtihon tayyor!", "success")
            return redirect(url_for("exam.exam_detail", exam_id=exam.id))

        flash("Savol qo'shildi!", "success")

    return render_template("exam/add_question.html", exam=exam)


# .txt yuklash
@exam_bp.route("/exams/<int:exam_id>/upload-questions", methods=["GET", "POST"])
@login_required
@admin_required
def upload_questions(exam_id):
    exam = Exam.query.get_or_404(exam_id)

    if request.method == "POST":
        file = request.files.get("file")

        if not file or not file.filename.endswith(".txt"):
            flash("Faqat .txt fayl qabul qilinadi!", "danger")
            return redirect(request.url)

        content = file.read().decode("utf-8")
        questions = parse_questions(content)

        if not questions:
            flash("Faylda savollar topilmadi!", "danger")
            return redirect(request.url)

        for q in questions:
            question = Question(
                exam_id=exam.id,
                text=q["text"],
                option_a=q["options"][0],
                option_b=q["options"][1],
                option_c=q["options"][2],
                option_d=q["options"][3],
                correct=q["correct"],
            )
            db.session.add(question)

        db.session.commit()
        flash(f"{len(questions)} ta savol yuklandi!", "success")
        return redirect(url_for("exam.exam_detail", exam_id=exam.id))

    return render_template("exam/upload_questions.html", exam=exam)


def parse_questions(content):
    # Windows \r\n va Mac \r ni ham qo'llab quvvatlash
    content = content.replace("\r\n", "\n").replace("\r", "\n")

    questions = []
    blocks = content.strip().split("\n\n")

    for block in blocks:
        lines = [line.strip() for line in block.strip().split("\n") if line.strip()]
        if not lines or not lines[0].startswith("?"):
            continue

        text = lines[0][1:].strip()
        options = []
        correct_index = None

        for line in lines[1:]:
            if line.startswith("#"):
                correct_index = len(options)
                options.append(line[1:].strip())
            else:
                options.append(line.strip())

        if len(options) != 4 or correct_index is None:
            continue

        questions.append(
            {
                "text": text,
                "options": options,
                "correct": ["a", "b", "c", "d"][correct_index],
            }
        )

    return questions


# Savol tahrirlash
@exam_bp.route("/questions/<int:question_id>/edit", methods=["GET", "POST"])
@login_required
@admin_required
def edit_question(question_id):
    question = Question.query.get_or_404(question_id)

    if request.method == "POST":
        question.text = request.form.get("text")
        question.option_a = request.form.get("option_a")
        question.option_b = request.form.get("option_b")
        question.option_c = request.form.get("option_c")
        question.option_d = request.form.get("option_d")
        question.correct = request.form.get("correct")
        db.session.commit()
        flash("Savol yangilandi!", "success")
        return redirect(url_for("exam.exam_detail", exam_id=question.exam_id))

    return render_template("exam/edit_question.html", question=question)


# Savol o'chirish
@exam_bp.route("/questions/<int:question_id>/delete", methods=["POST"])
@login_required
@admin_required
def delete_question(question_id):
    question = Question.query.get_or_404(question_id)
    exam_id = question.exam_id
    db.session.delete(question)
    db.session.commit()
    flash("Savol o'chirildi!", "success")
    return redirect(url_for("exam.exam_detail", exam_id=exam_id))


# Imtihon detail
@exam_bp.route("/exams/<int:exam_id>")
@login_required
def exam_detail(exam_id):
    exam = Exam.query.get_or_404(exam_id)
    return render_template("exam/detail.html", exam=exam)


# Imtihonni boshlash
@exam_bp.route("/exams/<int:exam_id>/start")
@login_required
def start_exam(exam_id):
    exam = Exam.query.get_or_404(exam_id)

    if not exam.questions:
        flash("Bu imtihonda savollar yo'q!", "warning")
        return redirect(url_for("exam.exam_detail", exam_id=exam_id))

    questions = list(exam.questions)
    random.shuffle(questions)

    # question_count belgilangan bo'lsa, shuncha savol ol
    if exam.question_count and exam.question_count < len(questions):
        questions = questions[:exam.question_count]

    return render_template("exam/take.html", exam=exam, questions=questions)


# Imtihonni yakunlash
@exam_bp.route("/exams/<int:exam_id>/submit", methods=["POST"])
@login_required
def submit_exam(exam_id):
    exam = Exam.query.get_or_404(exam_id)
    score = 0
    total = len(exam.questions)

    for question in exam.questions:
        user_answer = request.form.get(f"question_{question.id}")
        if user_answer and user_answer == question.correct:
            score += 1

    result = Result(
        user_id=current_user.id,
        exam_id=exam.id,
        score=score,
        total=total,
    )
    db.session.add(result)

    # XP hisoblash
    percentage = round((score / total) * 100) if total > 0 else 0

    xp_earned = total * 10  # har bir savol uchun 10 XP

    if percentage >= 70:
        xp_earned = total * 10
    elif percentage >= 50:
        xp_earned = total * 5
    else:
        xp_earned = total * 2

    current_user.add_xp(xp_earned)
    db.session.commit()

    return redirect(url_for("exam.exam_result", result_id=result.id, xp=xp_earned))


# Natija
@exam_bp.route("/results/<int:result_id>")
@login_required
def exam_result(result_id):
    result = Result.query.get_or_404(result_id)

    if result.user_id != current_user.id and not current_user.is_admin:
        flash("Ruxsat yo'q!", "danger")
        return redirect(url_for("exam.list_exams"))

    percentage = round((result.score / result.total) * 100) if result.total > 0 else 0
    xp_earned = request.args.get("xp", 0, type=int)

    return render_template(
        "exam/result.html",
        result=result,
        percentage=percentage,
        xp_earned=xp_earned,
    )
