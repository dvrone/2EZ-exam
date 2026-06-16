import os
import re

from dotenv import load_dotenv
from flask import Flask, render_template
from flask_bcrypt import Bcrypt
from flask_login import LoginManager
from flask_sqlalchemy import SQLAlchemy
from markdown import markdown as md_to_html

load_dotenv()

db = SQLAlchemy()
login_manager = LoginManager()
bcrypt = Bcrypt()


def create_app():
    app = Flask(__name__)

    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "fallback-secret-key")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL", "sqlite:///2ez_exam.db"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["DEBUG"] = os.getenv("DEBUG", "False") == "True"

    db.init_app(app)
    login_manager.init_app(app)
    bcrypt.init_app(app)

    login_manager.login_view = "auth.login"
    login_manager.login_message = "Iltimos, avval tizimga kiring!"
    login_manager.login_message_category = "warning"

    from routes.auth import auth
    from routes.exam import exam_bp
    from routes.reference import reference_bp
    from routes.vocab import vocab_bp

    app.register_blueprint(auth)
    app.register_blueprint(exam_bp)
    app.register_blueprint(reference_bp)
    app.register_blueprint(vocab_bp)

    @app.errorhandler(404)
    def page_not_found(e):
        return render_template("errors/404.html"), 404

    @app.errorhandler(500)
    def internal_error(e):
        return render_template("errors/500.html"), 500

    @app.template_filter("md")
    def markdown_filter(text):
        if not text:
            return ""

        placeholders = {}
        counter = [0]

        def protect(match):
            key = f"XMATH{counter[0]}X"
            placeholders[key] = match.group(0)
            counter[0] += 1
            return key

        # Matematikani vaqtincha yashirish
        text = re.sub(r"\$\$([\s\S]*?)\$\$", protect, text)
        text = re.sub(r"\$([^\$\n]+)\$", protect, text)

        # Markdown render
        html = md_to_html(text, extensions=["fenced_code", "nl2br"])

        # Matematikani qaytarish — lekin endi KaTeX uchun HTML format
        for key, original in placeholders.items():
            # $...$ → span bilan wrap qilish
            if original.startswith("$$"):
                inner = original[2:-2]
                html = html.replace(key, f'<span class="math-display">\\[{inner}\\]</span>')
            else:
                inner = original[1:-1]
                html = html.replace(key, f'<span class="math-inline">\\({inner}\\)</span>')

        return html

    return app