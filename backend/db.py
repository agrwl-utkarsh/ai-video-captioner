import sqlite3
import os

DATABASE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'captions.db')

def get_db():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON;")
    
    # Videos Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS videos (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        status TEXT NOT NULL,
        error_message TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    # Segments Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS segments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        video_id TEXT NOT NULL,
        start_time REAL NOT NULL,
        end_time REAL NOT NULL,
        text TEXT NOT NULL,
        speaker TEXT NOT NULL,
        display_order INTEGER NOT NULL,
        FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
    );
    """)
    
    # Presets Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS presets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        font_color TEXT NOT NULL,
        border_color TEXT NOT NULL,
        font_size INTEGER NOT NULL,
        border_width REAL NOT NULL,
        font_family TEXT NOT NULL,
        bg_color TEXT NOT NULL,
        bg_opacity REAL NOT NULL,
        bold INTEGER NOT NULL DEFAULT 0,
        italic INTEGER NOT NULL DEFAULT 0
    );
    """)
    
    # Seed Presets if none exist
    cursor.execute("SELECT COUNT(*) FROM presets;")
    if cursor.fetchone()[0] == 0:
        presets = [
            ("Default Yellow", "#ffff00", "#000000", 24, 1.5, "Inter", "#000000", 0.0, 1, 0),
            ("Minimal White", "#ffffff", "#000000", 22, 1.0, "Inter", "#000000", 0.4, 0, 0),
            ("Neon Green", "#39ff14", "#000000", 28, 2.0, "Bebas Neue", "#000000", 0.0, 1, 0),
            ("Bold Red", "#ff0000", "#ffffff", 26, 1.5, "Arial", "#000000", 0.2, 1, 1),
        ]
        cursor.executemany("""
        INSERT INTO presets (name, font_color, border_color, font_size, border_width, font_family, bg_color, bg_opacity, bold, italic)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, presets)
    
    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
    print("Database initialized successfully at:", DATABASE_PATH)
