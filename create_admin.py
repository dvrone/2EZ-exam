from app import create_app, db
from app.models import User

app = create_app()

with app.app_context():
    admin = User(username="admin", email="admin@2ez.com", is_admin=True)
    admin.set_password("admin123")
    db.session.add(admin)
    db.session.commit()
    print("✅ Admin yaratildi! email: admin@2ez.com | parol: admin123")
