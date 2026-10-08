import sqlite3
import json
import os
from typing import Dict, Any, List, Optional

DB_FILE = os.path.join(os.path.dirname(__file__), "odim_crm.db")

def get_db_connection():
    conn = sqlite3.connect(DB_FILE, timeout=30.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Roles Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS roles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        color TEXT,
        badge TEXT,
        is_system INTEGER DEFAULT 0,
        permissions TEXT NOT NULL
    )
    ''')

    # 2. Staff Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS staff (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        phone TEXT,
        email TEXT,
        role_id TEXT NOT NULL,
        role_title TEXT,
        status TEXT DEFAULT 'active',
        is_online INTEGER DEFAULT 0,
        assigned_deals INTEGER DEFAULT 0,
        avatar_url TEXT,
        custom_permissions TEXT,
        password TEXT DEFAULT '123456',
        last_login_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id)
    )
    ''')
    try:
        cursor.execute("ALTER TABLE staff ADD COLUMN custom_permissions TEXT")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE staff ADD COLUMN password TEXT DEFAULT '123456'")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE staff ADD COLUMN last_login_at TIMESTAMP")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE staff ADD COLUMN first_name TEXT")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE staff ADD COLUMN last_name TEXT")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE staff ADD COLUMN avatar_url TEXT")
    except Exception:
        pass


    # 3. Calendar Bookings Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS calendar_bookings (
        id TEXT PRIMARY KEY,
        client_name TEXT NOT NULL,
        client_phone TEXT NOT NULL,
        service TEXT NOT NULL,
        specialist_id TEXT NOT NULL,
        date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        status TEXT DEFAULT 'confirmed',
        price TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # 4. Tasks Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        client_name TEXT,
        deal_name TEXT,
        responsible_manager TEXT,
        due_date TEXT,
        due_category TEXT DEFAULT 'today',
        priority TEXT DEFAULT 'medium',
        completed INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # 5. Clients Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        type TEXT DEFAULT 'individual',
        name TEXT NOT NULL,
        company_name TEXT,
        phone TEXT NOT NULL,
        email TEXT,
        socials TEXT,
        total_deals INTEGER DEFAULT 0,
        total_paid TEXT DEFAULT '0 UZS',
        status TEXT DEFAULT 'active',
        responsible_manager TEXT,
        created_date TEXT
    )
    ''')

    # 6. Deals Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS deals (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        assigned_to TEXT,
        deadline TEXT,
        price TEXT,
        color TEXT,
        column_id TEXT,
        last_updated TEXT,
        industry TEXT DEFAULT 'avtosalon',
        entered_column_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_duration_seconds INTEGER DEFAULT 0,
        last_move_duration_seconds INTEGER DEFAULT 0,
        transitions_count INTEGER DEFAULT 0,
        is_sold INTEGER DEFAULT 0,
        sold_at TIMESTAMP,
        sold_by_id TEXT,
        sold_by_name TEXT,
        sale_duration_seconds INTEGER DEFAULT 0
    )
    ''')
    try:
        cursor.execute("ALTER TABLE deals ADD COLUMN industry TEXT DEFAULT 'avtosalon'")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE deals ADD COLUMN entered_column_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE deals ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE deals ADD COLUMN total_duration_seconds INTEGER DEFAULT 0")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE deals ADD COLUMN last_move_duration_seconds INTEGER DEFAULT 0")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE deals ADD COLUMN transitions_count INTEGER DEFAULT 0")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE deals ADD COLUMN is_sold INTEGER DEFAULT 0")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE deals ADD COLUMN sold_at TIMESTAMP")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE deals ADD COLUMN sold_by_id TEXT")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE deals ADD COLUMN sold_by_name TEXT")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE deals ADD COLUMN sale_duration_seconds INTEGER DEFAULT 0")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE deal_stage_history ADD COLUMN total_deal_seconds INTEGER DEFAULT 0")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE deal_stage_history ADD COLUMN is_sale INTEGER DEFAULT 0")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE deal_stage_history ADD COLUMN sale_duration_seconds INTEGER DEFAULT 0")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE deal_stage_history ADD COLUMN industry TEXT DEFAULT 'avtosalon'")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE deal_stage_history ADD COLUMN from_column_title TEXT")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE deal_stage_history ADD COLUMN to_column_title TEXT")
    except Exception:
        pass

    # 8. Internal Staff Messages Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS internal_messages (
        id TEXT PRIMARY KEY,
        sender_id TEXT NOT NULL,
        sender_name TEXT NOT NULL,
        receiver_id TEXT NOT NULL,
        receiver_name TEXT NOT NULL,
        text TEXT,
        media_url TEXT,
        media_type TEXT,
        is_read INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # 9. Kanban Stage SLA Configuration Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS kanban_stage_sla (
        id TEXT PRIMARY KEY,
        industry TEXT NOT NULL DEFAULT 'avtosalon',
        column_id TEXT NOT NULL,
        column_title TEXT NOT NULL,
        time_limit_minutes INTEGER DEFAULT 60,
        warning_threshold_percent INTEGER DEFAULT 80,
        color TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # 10. Deal Stage Movement History Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS deal_stage_history (
        id TEXT PRIMARY KEY,
        deal_id TEXT NOT NULL,
        deal_title TEXT NOT NULL,
        from_column_id TEXT,
        from_column_title TEXT,
        to_column_id TEXT NOT NULL,
        to_column_title TEXT NOT NULL,
        moved_by_id TEXT,
        moved_by_name TEXT,
        duration_seconds INTEGER DEFAULT 0,
        total_deal_seconds INTEGER DEFAULT 0,
        is_sale INTEGER DEFAULT 0,
        sale_duration_seconds INTEGER DEFAULT 0,
        industry TEXT DEFAULT 'avtosalon',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # 11. Deal Current Stage State (stores when card entered current column)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS deal_stage_state (
        deal_id TEXT PRIMARY KEY,
        column_id TEXT NOT NULL,
        entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # 12. Custom Fields Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS custom_fields (
        id TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'text',
        target TEXT NOT NULL DEFAULT 'deal',
        required INTEGER DEFAULT 0,
        options TEXT DEFAULT '',
        industry TEXT DEFAULT 'avtosalon',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # 13. Integrations Settings Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS integrations (
        id TEXT PRIMARY KEY,
        provider TEXT NOT NULL,
        name TEXT NOT NULL,
        is_active INTEGER DEFAULT 0,
        status TEXT DEFAULT 'disconnected',
        config_data TEXT DEFAULT '{}',
        last_sync TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # 14. Temporary Meta Discovery Sessions (Powers Account Selection Modal)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS temp_meta_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        organization_id TEXT NOT NULL,
        user_access_token TEXT NOT NULL,
        discovered_payload TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # 15. OAuth CSRF States Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS oauth_states (
        id TEXT PRIMARY KEY,
        state TEXT UNIQUE NOT NULL,
        user_id TEXT NOT NULL,
        organization_id TEXT NOT NULL,
        platform TEXT DEFAULT 'meta',
        expires_at TIMESTAMP NOT NULL,
        used INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    conn.commit()
    seed_initial_data(cursor, conn)
    conn.close()

def seed_initial_data(cursor, conn):
    # Check if roles already exist
    cursor.execute("SELECT COUNT(*) FROM roles")
    if cursor.fetchone()[0] == 0:
        initial_roles = [
            (
                "super_admin",
                "Super Admin",
                "Bosh boshqaruvchi (Tizim egasi)",
                "Barcha bo'limlar, sozlamalar, rollar va ma'lumotlarni o'chirish huquqiga ega.",
                "#191919",
                "Super Admin",
                1,
                json.dumps({
                    "deals": {"view": True, "create": True, "edit": True, "delete": True},
                    "chat": {"view": True, "create": True, "edit": True, "delete": True},
                    "call_center": {"view": True, "create": True, "edit": True, "delete": True},
                    "clients": {"view": True, "create": True, "edit": True, "delete": True, "export": True},
                    "calendar": {"view": True, "create": True, "edit": True, "delete": True},
                    "tasks": {"view": True, "create": True, "edit": True, "delete": True},
                    "catalog": {"view": True, "create": True, "edit": True, "delete": True},
                    "analytics": {"view": True, "view_revenue": True},
                    "staff": {"view": True, "create": True, "edit": True, "delete": True},
                    "roles": {"view": True, "create": True, "edit": True, "delete": True},
                    "constructor": {"view": True, "edit": True}
                })
            ),
            (
                "admin",
                "Oddiy Admin",
                "Operatsion administrator",
                "CRM ning kundalik operatsiyalarini boshqaradi, xodimlarni nazorat qiladi, lekin yangi admin/rol parametrlarini o'zgartira olmaydi.",
                "#334155",
                "Admin",
                1,
                json.dumps({
                    "deals": {"view": True, "create": True, "edit": True, "delete": False},
                    "chat": {"view": True, "create": True, "edit": True, "delete": True},
                    "call_center": {"view": True, "create": True, "edit": True, "delete": False},
                    "clients": {"view": True, "create": True, "edit": True, "delete": False, "export": True},
                    "calendar": {"view": True, "create": True, "edit": True, "delete": True},
                    "tasks": {"view": True, "create": True, "edit": True, "delete": True},
                    "catalog": {"view": True, "create": True, "edit": True, "delete": False},
                    "analytics": {"view": True, "view_revenue": True},
                    "staff": {"view": True, "create": True, "edit": True, "delete": False},
                    "roles": {"view": True, "create": False, "edit": False, "delete": False},
                    "constructor": {"view": False, "edit": False}
                })
            ),
            (
                "manager",
                "Savdo Menejeri",
                "Savdo va mijozlar bilan ishlash",
                "Faqat savdo, mijozlar va o'z rejalashtirish bo'limlariga kirish huquqiga ega.",
                "#475569",
                "Menejer",
                1,
                json.dumps({
                    "deals": {"view": True, "create": True, "edit": True, "delete": False},
                    "chat": {"view": True, "create": True, "edit": True, "delete": False},
                    "call_center": {"view": True, "create": True, "edit": False, "delete": False},
                    "clients": {"view": True, "create": True, "edit": True, "delete": False, "export": False},
                    "calendar": {"view": True, "create": True, "edit": True, "delete": False},
                    "tasks": {"view": True, "create": True, "edit": True, "delete": False},
                    "catalog": {"view": True, "create": False, "edit": False, "delete": False},
                    "analytics": {"view": False, "view_revenue": False},
                    "staff": {"view": False, "create": False, "edit": False, "delete": False},
                    "roles": {"view": False, "create": False, "edit": False, "delete": False},
                    "constructor": {"view": False, "edit": False}
                })
            ),
            (
                "specialist",
                "Mutaxassis / Master",
                "Xizmat ko'rsatuvchi usta",
                "Faqat o'z kalendar jadvali va o'ziga biriktirilgan vazifalarni ko'ra oladi.",
                "#64748b",
                "Mutaxassis",
                1,
                json.dumps({
                    "deals": {"view": False, "create": False, "edit": False, "delete": False},
                    "chat": {"view": True, "create": True, "edit": False, "delete": False},
                    "call_center": {"view": False, "create": False, "edit": False, "delete": False},
                    "clients": {"view": False, "create": False, "edit": False, "delete": False, "export": False},
                    "calendar": {"view": True, "create": False, "edit": False, "delete": False},
                    "tasks": {"view": True, "create": False, "edit": True, "delete": False},
                    "catalog": {"view": True, "create": False, "edit": False, "delete": False},
                    "analytics": {"view": False, "view_revenue": False},
                    "staff": {"view": False, "create": False, "edit": False, "delete": False},
                    "roles": {"view": False, "create": False, "edit": False, "delete": False},
                    "constructor": {"view": False, "edit": False}
                })
            ),
            (
                "cashier",
                "Kassir",
                "Kassa va Moliya",
                "Kassa, mijozlar va ombor tovarlarini ko'rish hamda bitimlar kiritish huquqiga ega.",
                "#059669",
                "Kassir",
                1,
                json.dumps({
                    "deals": {"view": True, "create": True, "edit": False, "delete": False},
                    "chat": {"view": True, "create": True, "edit": False, "delete": False},
                    "call_center": {"view": False, "create": False, "edit": False, "delete": False},
                    "clients": {"view": True, "create": True, "edit": False, "delete": False, "export": False},
                    "calendar": {"view": True, "create": False, "edit": False, "delete": False},
                    "tasks": {"view": True, "create": False, "edit": False, "delete": False},
                    "catalog": {"view": True, "create": False, "edit": False, "delete": False},
                    "analytics": {"view": False, "view_revenue": False},
                    "staff": {"view": False, "create": False, "edit": False, "delete": False},
                    "roles": {"view": False, "create": False, "edit": False, "delete": False},
                    "constructor": {"view": False, "edit": False}
                })
            )
        ]
        cursor.executemany(
            "INSERT INTO roles (id, name, title, description, color, badge, is_system, permissions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            initial_roles
        )

    # Initial current user state
    cursor.execute("SELECT COUNT(*) FROM session_state WHERE key = 'current_role'")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO session_state (key, value) VALUES ('current_role', 'super_admin')")

    # Seed Staff
    cursor.execute("SELECT COUNT(*) FROM staff")
    if cursor.fetchone()[0] == 0:
        initial_staff = [
            ("st-1", "Diyor Karimov", "Diyor", "Karimov", "+998 99 858 20 06", "diyor@odim.uz", "super_admin", "Super Admin", "active", 1, 42, "admin123"),
            ("st-2", "Sardor Qodirov", "Sardor", "Qodirov", "+998 90 987 65 43", "sardor@odim.uz", "admin", "Tizim Administratori", "active", 1, 35, "123456"),
            ("st-3", "Malika Karimova", "Malika", "Karimova", "+998 93 456 78 90", "malika@odim.uz", "manager", "Savdo bo'limi menejeri", "active", 1, 28, "123456"),
            ("st-4", "Jasur Aliyev", "Jasur", "Aliyev", "+998 97 765 43 21", "jasur@odim.uz", "specialist", "Katta usta / Master", "active", 0, 19, "123456"),
            ("st-5", "Madina Rahimova", "Madina", "Rahimova", "+998 99 876 54 32", "madina@odim.uz", "specialist", "Go'zallik stilisti", "active", 1, 15, "123456")
        ]
        cursor.executemany(
            "INSERT INTO staff (id, name, first_name, last_name, phone, email, role_id, role_title, status, is_online, assigned_deals, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            initial_staff
        )

    # Force Diyor Karimov / 998582006 to always have super_admin role
    cursor.execute("""
        UPDATE staff 
        SET role_id = 'super_admin', role_title = 'Super Admin'
        WHERE phone LIKE '%998582006%' OR phone LIKE '%99 858 20 06%' OR name LIKE '%Diyor Karimov%'
    """)

    # Seed Calendar Bookings
    cursor.execute("SELECT COUNT(*) FROM calendar_bookings")
    if cursor.fetchone()[0] == 0:
        initial_bookings = [
            ("b-1", "Otabek Mirzayev", "+998 90 123 45 67", "Chevrolet Tracker Premier Test-drayv", "sp-1", "2026-09-08", "10:00", "11:30", "confirmed", "Bepul", "Mijoz kelishini kutmoqda"),
            ("b-2", "Sevara Karimova", "+998 93 555 12 34", "Soch turmagi & Vizaj", "sp-2", "2026-09-08", "12:00", "13:30", "confirmed", "450,000 UZS", "VIP xizmat"),
            ("b-3", "Nodir Karimov", "+998 97 111 22 33", "Pol isitish quvurlari hisob-kitobi", "sp-3", "2026-09-08", "14:00", "15:00", "confirmed", "150,000 UZS", "Konsultatsiya"),
            ("b-4", "Shahnoza Alimova", "+998 99 777 88 99", "Brending va Target brifi", "sp-4", "2026-09-08", "15:30", "17:00", "confirmed", "300,000 UZS", "Online taqdimot")
        ]
        cursor.executemany(
            "INSERT INTO calendar_bookings (id, client_name, client_phone, service, specialist_id, date, start_time, end_time, status, price, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            initial_bookings
        )

    # Seed Tasks
    cursor.execute("SELECT COUNT(*) FROM tasks")
    if cursor.fetchone()[0] == 0:
        initial_tasks = [
            ("t-1", "Mijoz bilan shartnoma bo'yicha qayta bog'lanish", "Ko'tarilmagan qo'ng'iroq bo'yicha qayta qo'ng'iroq qilish va KP yuborish.", "Otabek Mirzayev (Silk Road Logistics)", "Yangi yuk mashinasi lizingi", "Sardor Qodirov", "2026-09-08 15:00", "today", "high", 0),
            ("t-2", "To'lov hisob-fakturasini chiqarish va jo'natish", "Buxgalteriya orqali schet-fakturani tasdiqlatish", "Nodir Karimov (Orient Media)", "SMM va Branding paketi", "Malika Karimova", "2026-09-08 17:30", "today", "medium", 0),
            ("t-3", "Avtosalon filiali uchun ehtiyot qismlar aktini tekshirish", "Kelgan aksessuarlar ro'yxatini moslashtirish", "Jamshid Karimov", "Tracker ehtiyot qismlari", "Diyorbek Karimov", "2026-09-09 11:00", "tomorrow", "low", 0),
            ("t-4", "Telegram bot orqali tushgan yangi lidlarni taqsimlash", "3 ta yangi so'rov keldi", "Yangi mijozlar", "Lidlar oqimi", "Sardor Qodirov", "2026-09-08 12:00", "today", "high", 1)
        ]
        cursor.executemany(
            "INSERT INTO tasks (id, title, description, client_name, deal_name, responsible_manager, due_date, due_category, priority, completed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            initial_tasks
        )

    # Seed Clients
    cursor.execute("SELECT COUNT(*) FROM clients")
    if cursor.fetchone()[0] == 0:
        initial_clients = [
            ("cl-1", "company", "Otabek Mirzayev", "Silk Road Logistics", "+998 90 123 45 67", "otabek@silkroad.uz", json.dumps({"telegram": "@otabek_mirzayev"}), 3, "145,000,000 UZS", "active", "Sardor Qodirov", "15.01.2026"),
            ("cl-2", "individual", "Malika Usmanova", "Go'zallik maskani", "+998 93 456 78 90", "malika@usmanova.uz", json.dumps({"instagram": "@malika_beauty"}), 5, "12,500,000 UZS", "active", "Malika Karimova", "20.02.2026"),
            ("cl-3", "company", "Bobur Aliyev", "Aliyev Motors MCHJ", "+998 97 765 43 21", "bobur@aliyev.uz", json.dumps({"telegram": "@bobur_aliyev"}), 2, "640,000,000 UZS", "potential", "Diyorbek Karimov", "01.03.2026")
        ]
        cursor.executemany(
            "INSERT INTO clients (id, type, name, company_name, phone, email, socials, total_deals, total_paid, status, responsible_manager, created_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            initial_clients
        )

    # Seed Kanban Stage SLA
    cursor.execute("SELECT COUNT(*) FROM kanban_stage_sla")
    if cursor.fetchone()[0] == 0:
        initial_sla = [
            # Avtosalon
            ("sla_avto_1", "avtosalon", "col-1", "Lid keldi", 30, 80, "#AE00FF"),
            ("sla_avto_2", "avtosalon", "col-2", "Test-drayv", 120, 80, "#002BFF"),
            ("sla_avto_3", "avtosalon", "col-3", "Qaror qabul qilish", 1440, 80, "#F59E0B"),
            ("sla_avto_4", "avtosalon", "col-4", "Shartnoma", 2880, 80, "#00FF2B"),
            ("sla_avto_5", "avtosalon", "col-5", "Mashina topshirildi", 4320, 80, "#10B981"),
            # Go'zallik saloni
            ("sla_b_1", "beauty", "col-1", "So'rov", 15, 80, "#AE00FF"),
            ("sla_b_2", "beauty", "col-2", "Vaqt bron qilindi", 60, 80, "#002BFF"),
            ("sla_b_3", "beauty", "col-3", "Xizmat ko'rsatildi", 180, 80, "#F59E0B"),
            ("sla_b_4", "beauty", "col-4", "To'lov qilindi", 60, 80, "#10B981"),
            # Reklama agentligi
            ("sla_ag_1", "agency", "col-1", "Brif olindi", 60, 80, "#AE00FF"),
            ("sla_ag_2", "agency", "col-2", "KP yuborildi", 240, 80, "#002BFF"),
            ("sla_ag_3", "agency", "col-3", "Shartnoma", 1440, 80, "#F59E0B"),
            ("sla_ag_4", "agency", "col-4", "Ish jarayonda", 4320, 80, "#8B5CF6"),
            ("sla_ag_5", "agency", "col-5", "Qabul qilindi", 1440, 80, "#10B981"),
            # Santexnika
            ("sla_pl_1", "plumbing", "col-1", "Buyurtma", 30, 80, "#AE00FF"),
            ("sla_pl_2", "plumbing", "col-2", "Qoldiq tekshirildi", 60, 80, "#002BFF"),
            ("sla_pl_3", "plumbing", "col-3", "To'lov", 240, 80, "#F59E0B"),
            ("sla_pl_4", "plumbing", "col-4", "Yuk jo'natildi", 1440, 80, "#10B981"),
        ]
        cursor.executemany(
            "INSERT INTO kanban_stage_sla (id, industry, column_id, column_title, time_limit_minutes, warning_threshold_percent, color) VALUES (?, ?, ?, ?, ?, ?, ?)",
            initial_sla
        )

    # Seed Sample Movement History
    cursor.execute("SELECT COUNT(*) FROM deal_stage_history")
    if cursor.fetchone()[0] == 0:
        initial_history = [
            ("hist-1", "t-avto-2", "Kia K5 Style Test-drayv", "col-1", "Lid keldi", "col-2", "Test-drayv", "st-1", "Diyor Karimov", 2700, "avtosalon"),
            ("hist-2", "t-avto-3", "BYD Song Plus EV", "col-2", "Test-drayv", "col-3", "Qaror qabul qilish", "st-2", "Sardor Qodirov", 7200, "avtosalon"),
            ("hist-3", "t-b-2", "Makiyaj & Stilistika", "col-1", "So'rov", "col-2", "Vaqt bron qilindi", "st-5", "Madina Rahimova", 1800, "beauty"),
        ]
        cursor.executemany(
            "INSERT INTO deal_stage_history (id, deal_id, deal_title, from_column_id, from_column_title, to_column_id, to_column_title, moved_by_id, moved_by_name, duration_seconds, industry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            initial_history
        )

    # Seed Deals
    cursor.execute("SELECT COUNT(*) FROM deals")
    if cursor.fetchone()[0] == 0:
        initial_deals = [
            # Avtosalon
            ("t-avto-1", "Chevrolet Tracker Premier", "Mijoz: Jamshid Karimov | Tel: +998 90 123 45 67", "JK", "Bugun, 15:00", "250,000,000 UZS", "#AE00FF", "col-1", "10 daq oldin", "avtosalon"),
            ("t-avto-2", "Kia K5 Style Test-drayv", "Mijoz: Bobur Aliyev | Shartnoma ko'rish", "BA", "Ertaga, 11:30", "380,000,000 UZS", "#002BFF", "col-2", "1 soat oldin", "avtosalon"),
            ("t-avto-3", "BYD Song Plus EV", "Kredit yoki lizing hisob-kitobi", "MR", "Bugun, 18:00", "360,000,000 UZS", "#F59E0B", "col-3", "3 soat oldin", "avtosalon"),
            # Beauty
            ("t-b-1", "Soch turmagi & Spa", "Mijoz: Madina Usmanova | Usta: Malika", "MU", "Bugun, 14:00", "650,000 UZS", "#AE00FF", "col-1", "15 daq oldin", "beauty"),
            ("t-b-2", "Makiyaj & Stilistika", "Mijoz: Sevara Karimova", "SK", "Bugun, 16:30", "1,200,000 UZS", "#002BFF", "col-2", "40 daq oldin", "beauty"),
            # Agency
            ("t-ag-1", "Brending & Rebranding", "Silk Road MCHJ logotip va brandbook", "SR", "12-Sentabr", "25,000,000 UZS", "#AE00FF", "col-1", "2 soat oldin", "agency"),
            ("t-ag-2", "SMM & Target kampaniyasi", "Oylik obuna va video roliklar", "AB", "Bugun, 19:00", "18,000,000 UZS", "#002BFF", "col-2", "1 soat oldin", "agency"),
            # Plumbing
            ("t-pl-1", "Grohe smesitel to'plami (10 dona)", "Qurilish ob'ekti buyurtmasi", "DK", "Bugun, 17:00", "14,500,000 UZS", "#AE00FF", "col-1", "30 daq oldin", "plumbing"),
            ("t-pl-2", "Italiya pol isitish quvurlari 500m", "Ombordan zaxiraga ajratildi", "OM", "Ertaga, 10:00", "32,000,000 UZS", "#002BFF", "col-2", "2 soat oldin", "plumbing"),
        ]
        cursor.executemany(
            "INSERT INTO deals (id, title, description, assigned_to, deadline, price, color, column_id, last_updated, industry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            initial_deals
        )

    # Ensure rich sold deals and audit history for workers
    ensure_sold_deals_and_audit(cursor, conn)

    conn.commit()

def ensure_sold_deals_and_audit(cursor, conn):
    cursor.execute("SELECT COUNT(*) FROM deals WHERE is_sold = 1")
    count_sold = cursor.fetchone()[0]
    
    if count_sold < 3:
        sample_sales = [
            ("t-avto-1", "Chevrolet Tracker Premier", "Mijoz: Jamshid Karimov | Tel: +998 90 123 45 67", "DK", "Bugun, 15:00", "250,000,000 UZS", "#10B981", "col-5", "Hozir", "avtosalon", 50400, 50400, 4, 1, "2026-09-20 18:30:00", "st-1", "Diyor Karimov", 50400),
            ("t-avto-sold-2", "Kia K5 Style 2026", "Mijoz: Bobur Aliyev | Shartnoma to'liq to'landi", "SQ", "Ertaga, 11:30", "380,000,000 UZS", "#10B981", "col-5", "Hozir", "avtosalon", 86400, 86400, 5, 1, "2026-09-21 10:15:00", "st-2", "Sardor Qodirov", 86400),
            ("t-avto-sold-3", "BYD Song Plus EV Champion", "Mijoz: Nigora Rahimova | To'lov to'liq qilindi", "MK", "Bugun, 18:00", "360,000,000 UZS", "#10B981", "col-5", "Hozir", "avtosalon", 32400, 32400, 4, 1, "2026-09-21 11:45:00", "st-3", "Malika Karimova", 32400)
        ]
        for deal in sample_sales:
            cursor.execute("""
                INSERT INTO deals (id, title, description, assigned_to, deadline, price, color, column_id, last_updated, industry, total_duration_seconds, last_move_duration_seconds, transitions_count, is_sold, sold_at, sold_by_id, sold_by_name, sale_duration_seconds)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    column_id = excluded.column_id,
                    is_sold = excluded.is_sold,
                    sold_at = excluded.sold_at,
                    sold_by_id = excluded.sold_by_id,
                    sold_by_name = excluded.sold_by_name,
                    sale_duration_seconds = excluded.sale_duration_seconds,
                    total_duration_seconds = excluded.total_duration_seconds
            """, deal)

        # Audit histories for these sales
        histories = [
            ("hist-sold-1a", "t-avto-1", "Chevrolet Tracker Premier", "col-1", "Lid keldi", "col-2", "Test-drayv", "st-1", "Diyor Karimov", 7200, 7200, 0, 0, "avtosalon", "2026-09-20 09:30:00"),
            ("hist-sold-1b", "t-avto-1", "Chevrolet Tracker Premier", "col-2", "Test-drayv", "col-3", "Qaror qabul qilish", "st-1", "Diyor Karimov", 14400, 21600, 0, 0, "avtosalon", "2026-09-20 13:30:00"),
            ("hist-sold-1c", "t-avto-1", "Chevrolet Tracker Premier", "col-3", "Qaror qabul qilish", "col-4", "Shartnoma", "st-1", "Diyor Karimov", 21600, 43200, 0, 0, "avtosalon", "2026-09-20 17:00:00"),
            ("hist-sold-1d", "t-avto-1", "Chevrolet Tracker Premier", "col-4", "Shartnoma", "col-5", "Mashina topshirildi", "st-1", "Diyor Karimov", 7200, 50400, 1, 50400, "avtosalon", "2026-09-20 18:30:00"),

            ("hist-sold-2a", "t-avto-sold-2", "Kia K5 Style 2026", "col-1", "Lid keldi", "col-2", "Test-drayv", "st-2", "Sardor Qodirov", 18000, 18000, 0, 0, "avtosalon", "2026-09-20 10:00:00"),
            ("hist-sold-2b", "t-avto-sold-2", "Kia K5 Style 2026", "col-2", "Test-drayv", "col-4", "Shartnoma", "st-2", "Sardor Qodirov", 43200, 61200, 0, 0, "avtosalon", "2026-09-20 22:00:00"),
            ("hist-sold-2c", "t-avto-sold-2", "Kia K5 Style 2026", "col-4", "Shartnoma", "col-5", "Mashina topshirildi", "st-2", "Sardor Qodirov", 25200, 86400, 1, 86400, "avtosalon", "2026-09-21 10:15:00"),

            ("hist-sold-3a", "t-avto-sold-3", "BYD Song Plus EV Champion", "col-1", "Lid keldi", "col-3", "Qaror qabul qilish", "st-3", "Malika Karimova", 10800, 10800, 0, 0, "avtosalon", "2026-09-21 02:45:00"),
            ("hist-sold-3b", "t-avto-sold-3", "BYD Song Plus EV Champion", "col-3", "Qaror qabul qilish", "col-4", "Shartnoma", "st-3", "Malika Karimova", 14400, 25200, 0, 0, "avtosalon", "2026-09-21 07:45:00"),
            ("hist-sold-3c", "t-avto-sold-3", "BYD Song Plus EV Champion", "col-4", "Shartnoma", "col-5", "Mashina topshirildi", "st-3", "Malika Karimova", 7200, 32400, 1, 32400, "avtosalon", "2026-09-21 11:45:00"),
        ]

        for h in histories:
            cursor.execute("""
                INSERT INTO deal_stage_history 
                (id, deal_id, deal_title, from_column_id, from_column_title, to_column_id, to_column_title, moved_by_id, moved_by_name, duration_seconds, total_deal_seconds, is_sale, sale_duration_seconds, industry, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO NOTHING
            """, h)
        conn.commit()

    # Seed default integrations (initially disconnected and clean)
    cursor.execute("SELECT COUNT(*) FROM integrations")
    if cursor.fetchone()[0] == 0:
        initial_integrations = [
            (
                "telegram",
                "telegram",
                "Telegram Bot & Kanallar",
                0,
                "disconnected",
                "{}",
                None
            ),
            (
                "instagram",
                "instagram",
                "Instagram Direct & Izohlar",
                0,
                "disconnected",
                "{}",
                None
            ),
            (
                "facebook",
                "facebook",
                "Facebook Messenger & Leads",
                0,
                "disconnected",
                "{}",
                None
            ),
            (
                "whatsapp",
                "whatsapp",
                "WhatsApp Business API",
                0,
                "disconnected",
                "{}",
                None
            )
        ]
        for integ in initial_integrations:
            cursor.execute("""
                INSERT INTO integrations (id, provider, name, is_active, status, config_data, last_sync)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, integ)
        conn.commit()

