import json
import random

from flask import (Blueprint, flash, jsonify, redirect, render_template,
                   request, url_for)
from flask_login import current_user, login_required

from app import db
from app.models import StudyProgress, Vocab, VocabSet

vocab_bp = Blueprint("vocab", __name__)


CATEGORIES = [
    ("noun", "Noun — ot"),
    ("verb", "Verb — fe'l"),
    ("adj", "Adjective — sifat"),
    ("adv", "Adverb — ravish"),
    ("phrase", "Phrase — ibora"),
    ("prep", "Preposition — predlog"),
    ("pron", "Pronoun — olmosh"),
    ("conj", "Conjunction — bog'lovchi"),
    ("other", "Other — boshqa"),
]


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
    return render_template(
        "vocab/detail.html", vocab_set=vocab_set, categories=CATEGORIES
    )


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
            category=request.form.get("category") or None,
        )
        db.session.add(word)
        db.session.commit()

        if request.form.get("action") == "finish":
            flash("So'zlar saqlandi!", "success")
            return redirect(url_for("vocab.detail_set", set_id=vocab_set.id))

        flash("So'z qo'shildi!", "success")

    return render_template(
        "vocab/add_word.html", vocab_set=vocab_set, categories=CATEGORIES
    )


@vocab_bp.route("/vocab/word/<int:word_id>/edit", methods=["GET", "POST"])
@login_required
@admin_required
def edit_word(word_id):
    word = Vocab.query.get_or_404(word_id)

    if request.method == "POST":
        word.word = request.form.get("word")
        word.translation = request.form.get("translation")
        word.example = request.form.get("example")
        word.category = request.form.get("category") or None
        db.session.commit()
        flash("So'z yangilandi!", "success")
        return redirect(url_for("vocab.detail_set", set_id=word.set_id))

    return render_template("vocab/edit_word.html", word=word, categories=CATEGORIES)


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


@vocab_bp.route("/vocab/<int:set_id>/upload-words", methods=["GET", "POST"])
@login_required
@admin_required
def upload_words(set_id):
    vocab_set = VocabSet.query.get_or_404(set_id)

    if request.method == "POST":
        file = request.files.get("file")

        if not file or not file.filename.endswith(".json"):
            flash("Faqat .json fayl qabul qilinadi!", "danger")
            return redirect(request.url)

        try:
            data = json.loads(file.read().decode("utf-8"))
        except Exception:
            flash("JSON fayl noto'g'ri formatda!", "danger")
            return redirect(request.url)

        if not isinstance(data, list):
            flash("JSON fayl ro'yxat bo'lishi kerak!", "danger")
            return redirect(request.url)

        # Mavjud so'zlarni olish (kichik harfda taqqoslash)
        existing_words = {w.word.strip().lower() for w in vocab_set.words}

        count = 0
        skipped = 0

        for item in data:
            if "word" not in item or "translation" not in item:
                continue

            word_text = item["word"].strip()

            # Mavjud bo'lsa o'tkazib yuborish
            if word_text.lower() in existing_words:
                skipped += 1
                continue

            word = Vocab(
                set_id=vocab_set.id,
                word=word_text,
                translation=item["translation"],
                example=item.get("example", None),
                category=item.get("category", None),
            )
            db.session.add(word)
            existing_words.add(word_text.lower())
            count += 1

        db.session.commit()

        if skipped > 0:
            flash(
                f"{count} ta so'z yuklandi, {skipped} ta mavjud bo'lgani o'tkazib yuborildi!",
                "success",
            )
        else:
            flash(f"{count} ta so'z yuklandi!", "success")

        return redirect(url_for("vocab.detail_set", set_id=vocab_set.id))

    return render_template("vocab/upload_words.html", vocab_set=vocab_set)


@vocab_bp.route("/vocab/<int:set_id>/quiz/submit", methods=["POST"])
@login_required
def submit_quiz(set_id):
    vocab_set = VocabSet.query.get_or_404(set_id)
    score = request.json.get("score", 0)
    total = request.json.get("total", 0)

    if total > 0:
        percentage = round(score / total * 100)
        if percentage >= 70:
            xp_earned = total * 10
        elif percentage >= 50:
            xp_earned = total * 5
        else:
            xp_earned = total * 2

        current_user.add_xp(xp_earned)
        db.session.commit()
        return {"xp": xp_earned, "total_xp": current_user.xp}

    return {"xp": 0, "total_xp": current_user.xp}


@vocab_bp.route("/vocab/<int:set_id>/pronounce")
@login_required
def pronounce(set_id):
    vocab_set = VocabSet.query.get_or_404(set_id)

    if len(vocab_set.words) < 1:
        flash("Bu to'plamda so'zlar yo'q!", "warning")
        return redirect(url_for("vocab.detail_set", set_id=set_id))

    words = list(vocab_set.words)
    random.shuffle(words)
    return render_template("vocab/pronounce.html", vocab_set=vocab_set, words=words)


@vocab_bp.route("/vocab/<int:set_id>/typing")
@login_required
def typing(set_id):
    vocab_set = VocabSet.query.get_or_404(set_id)

    if len(vocab_set.words) < 1:
        flash("Bu to'plamda so'zlar yo'q!", "warning")
        return redirect(url_for("vocab.detail_set", set_id=set_id))

    words = list(vocab_set.words)
    random.shuffle(words)
    return render_template("vocab/typing.html", vocab_set=vocab_set, words=words)


# Learn sahifasi
@vocab_bp.route("/vocab/<int:set_id>/learn")
@login_required
def learn(set_id):
    vocab_set = VocabSet.query.get_or_404(set_id)

    if len(vocab_set.words) < 1:
        flash("Bu to'plamda so'zlar yo'q!", "warning")
        return redirect(url_for("vocab.detail_set", set_id=set_id))

    # So'zlarni order_index bo'yicha tartiblash
    words = sorted(vocab_set.words, key=lambda w: w.order_index)

    return render_template("vocab/learn.html", vocab_set=vocab_set, words=words)


# Progress saqlash API
@vocab_bp.route("/vocab/<int:set_id>/learn/progress", methods=["POST"])
@login_required
def save_progress(set_id):
    data = request.get_json()
    vocab_id = data.get("vocab_id")
    current_step = data.get("current_step", "flashcard")

    if not vocab_id:
        return jsonify({"error": "vocab_id kerak"}), 400

    progress = StudyProgress.query.filter_by(
        user_id=current_user.id,
        set_id=set_id,
        vocab_id=vocab_id,
    ).first()

    if progress:
        progress.current_step = current_step
        progress.completed = current_step == "completed"
    else:
        progress = StudyProgress(
            user_id=current_user.id,
            set_id=set_id,
            vocab_id=vocab_id,
            current_step=current_step,
            completed=current_step == "completed",
        )
        db.session.add(progress)

    db.session.commit()
    return jsonify({"ok": True})


# Joriy holatni olish API
@vocab_bp.route("/vocab/<int:set_id>/learn/state")
@login_required
def get_learn_state(set_id):
    vocab_set = VocabSet.query.get_or_404(set_id)
    words = sorted(vocab_set.words, key=lambda w: w.order_index)

    # Barcha progresslarni olish
    all_progress = {
        p.vocab_id: p
        for p in StudyProgress.query.filter_by(
            user_id=current_user.id,
            set_id=set_id,
        ).all()
    }

    # Birinchi tugallanmagan so'zni topish
    resume_word_id = None
    resume_step = "flashcard"
    completed_count = 0

    for word in words:
        p = all_progress.get(word.id)
        if p and p.completed:
            completed_count += 1
        elif p and not p.completed:
            resume_word_id = word.id
            resume_step = p.current_step
            break
        else:
            if resume_word_id is None:
                resume_word_id = word.id
                resume_step = "flashcard"

    return jsonify(
        {
            "resume_word_id": resume_word_id,
            "resume_step": resume_step,
            "completed_count": completed_count,
            "total": len(words),
        }
    )
