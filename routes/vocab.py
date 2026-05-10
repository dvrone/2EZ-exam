import random

from flask import Blueprint, flash, redirect, render_template, request, url_for
from flask_login import current_user, login_required

from app import db
from app.models import Vocab, VocabSet

vocab_bp = Blueprint("vocab", __name__)


def admin_required(f):
    from functools import wraps

    @wraps(f)
    def decorated(*args, **kwargs):
        if not current_user.is_admin:
            flash("Ruxsat yo'q!", "danger")
            return redirect(url_for("vocab.list_sets"))
        return f(*args, **kwargs)

    return decorated


# To'plamlar ro'yxati
@vocab_bp.route("/vocab")
@login_required
def list_sets():
    sets = VocabSet.query.all()
    return render_template("vocab/list.html", sets=sets)


# To'plam detail
@vocab_bp.route("/vocab/<int:set_id>")
@login_required
def detail_set(set_id):
    vocab_set = VocabSet.query.get_or_404(set_id)
    return render_template("vocab/detail.html", vocab_set=vocab_set)


# To'plam yaratish
@vocab_bp.route("/vocab/create", methods=["GET", "POST"])
@login_required
@admin_required
def create_set():
    if request.method == "POST":
        vocab_set = VocabSet(
            title=request.form.get("title"),
            description=request.form.get("description"),
        )
        db.session.add(vocab_set)
        db.session.commit()
        flash("To'plam yaratildi!", "success")
        return redirect(url_for("vocab.add_word", set_id=vocab_set.id))

    return render_template("vocab/create_set.html")


# To'plamni tahrirlash
@vocab_bp.route("/vocab/<int:set_id>/edit", methods=["GET", "POST"])
@login_required
@admin_required
def edit_set(set_id):
    vocab_set = VocabSet.query.get_or_404(set_id)

    if request.method == "POST":
        vocab_set.title = request.form.get("title")
        vocab_set.description = request.form.get("description")
        db.session.commit()
        flash("To'plam yangilandi!", "success")
        return redirect(url_for("vocab.detail_set", set_id=vocab_set.id))

    return render_template("vocab/edit_set.html", vocab_set=vocab_set)


# To'plamni o'chirish
@vocab_bp.route("/vocab/<int:set_id>/delete", methods=["POST"])
@login_required
@admin_required
def delete_set(set_id):
    vocab_set = VocabSet.query.get_or_404(set_id)
    db.session.delete(vocab_set)
    db.session.commit()
    flash("To'plam o'chirildi!", "success")
    return redirect(url_for("vocab.list_sets"))


# So'z qo'shish
@vocab_bp.route("/vocab/<int:set_id>/add-word", methods=["GET", "POST"])
@login_required
@admin_required
def add_word(set_id):
    vocab_set = VocabSet.query.get_or_404(set_id)

    if request.method == "POST":
        word = Vocab(
            set_id=vocab_set.id,
            word=request.form.get("word"),
            translation=request.form.get("translation"),
            example=request.form.get("example"),
        )
        db.session.add(word)
        db.session.commit()

        if request.form.get("action") == "finish":
            flash("So'zlar saqlandi!", "success")
            return redirect(url_for("vocab.detail_set", set_id=vocab_set.id))

        flash("So'z qo'shildi!", "success")

    return render_template("vocab/add_word.html", vocab_set=vocab_set)


# So'zni tahrirlash
@vocab_bp.route("/vocab/word/<int:word_id>/edit", methods=["GET", "POST"])
@login_required
@admin_required
def edit_word(word_id):
    word = Vocab.query.get_or_404(word_id)

    if request.method == "POST":
        word.word = request.form.get("word")
        word.translation = request.form.get("translation")
        word.example = request.form.get("example")
        db.session.commit()
        flash("So'z yangilandi!", "success")
        return redirect(url_for("vocab.detail_set", set_id=word.set_id))

    return render_template("vocab/edit_word.html", word=word)


# So'zni o'chirish
@vocab_bp.route("/vocab/word/<int:word_id>/delete", methods=["POST"])
@login_required
@admin_required
def delete_word(word_id):
    word = Vocab.query.get_or_404(word_id)
    set_id = word.set_id
    db.session.delete(word)
    db.session.commit()
    flash("So'z o'chirildi!", "success")
    return redirect(url_for("vocab.detail_set", set_id=set_id))


# Flashcard quiz
@vocab_bp.route("/vocab/<int:set_id>/flashcard")
@login_required
def flashcard(set_id):
    vocab_set = VocabSet.query.get_or_404(set_id)

    if len(vocab_set.words) < 1:
        flash("Bu to'plamda so'zlar yo'q!", "warning")
        return redirect(url_for("vocab.detail_set", set_id=set_id))

    words = list(vocab_set.words)
    random.shuffle(words)
    return render_template("vocab/flashcard.html", vocab_set=vocab_set, words=words)


# 4 variant quiz
@vocab_bp.route("/vocab/<int:set_id>/quiz")
@login_required
def quiz(set_id):
    vocab_set = VocabSet.query.get_or_404(set_id)

    if len(vocab_set.words) < 4:
        flash("Quiz uchun kamida 4 ta so'z kerak!", "warning")
        return redirect(url_for("vocab.detail_set", set_id=set_id))

    words = list(vocab_set.words)
    random.shuffle(words)
    return render_template("vocab/quiz.html", vocab_set=vocab_set, words=words)
