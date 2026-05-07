from flask import Blueprint, flash, redirect, render_template, request, url_for
from flask_login import current_user, login_required

from app import db
from app.models import Reference

reference_bp = Blueprint("reference", __name__)


# Barcha ma'lumotnomalar
@reference_bp.route("/reference")
@login_required
def list_reference():
    references = Reference.query.order_by(Reference.created_at.desc()).all()
    return render_template("reference/list.html", references=references)


# Ma'lumotnoma detail
@reference_bp.route("/reference/<int:ref_id>")
@login_required
def detail_reference(ref_id):
    reference = Reference.query.get_or_404(ref_id)
    return render_template("reference/detail.html", reference=reference)


# Yaratish (faqat admin)
@reference_bp.route("/reference/create", methods=["GET", "POST"])
@login_required
def create_reference():
    if not current_user.is_admin:
        flash("Ruxsat yo'q!", "danger")
        return redirect(url_for("reference.list_reference"))

    if request.method == "POST":
        reference = Reference(
            title=request.form.get("title"), content=request.form.get("content")
        )
        db.session.add(reference)
        db.session.commit()
        flash("Ma'lumotnoma qo'shildi!", "success")
        return redirect(url_for("reference.list_reference"))

    return render_template("reference/create.html")


# Tahrirlash (faqat admin)
@reference_bp.route("/reference/<int:ref_id>/edit", methods=["GET", "POST"])
@login_required
def edit_reference(ref_id):
    if not current_user.is_admin:
        flash("Ruxsat yo'q!", "danger")
        return redirect(url_for("reference.list_reference"))

    reference = Reference.query.get_or_404(ref_id)

    if request.method == "POST":
        reference.title = request.form.get("title")
        reference.content = request.form.get("content")
        db.session.commit()
        flash("Ma'lumotnoma yangilandi!", "success")
        return redirect(url_for("reference.detail_reference", ref_id=reference.id))

    return render_template("reference/edit.html", reference=reference)


# O'chirish (faqat admin)
@reference_bp.route("/reference/<int:ref_id>/delete", methods=["POST"])
@login_required
def delete_reference(ref_id):
    if not current_user.is_admin:
        flash("Ruxsat yo'q!", "danger")
        return redirect(url_for("reference.list_reference"))

    reference = Reference.query.get_or_404(ref_id)
    db.session.delete(reference)
    db.session.commit()
    flash("Ma'lumotnoma o'chirildi!", "success")
    return redirect(url_for("reference.list_reference"))
