# ==============================
# 1️⃣ دیتابیس PostgreSQL
# ==============================
# ساخت دیتابیس
createdb admin_panel

# اجرای فایل SQL
psql -d admin_panel -f server/database/init.sql

# ==============================
# 2️⃣ سرور
# ==============================
cd server
npm install

# تنظیم .env (DATABASE_URL, JWT_SECRET را عوض کنید)
npm run dev

# ==============================
# 3️⃣ کلاینت
# ==============================
cd client
npm install
npm start

# ==============================
# 🔑 ورود پیش‌فرض ادمین
# ==============================
# Email: admin@panel.com
# Password: Admin@123

