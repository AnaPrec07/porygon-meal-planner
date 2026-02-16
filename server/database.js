import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, 'meal-planner.db'));

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    food_allergies TEXT,
    foods_dislike TEXT,
    foods_like TEXT,
    meals_per_day INTEGER,
    meal_preference TEXT,
    goals TEXT,
    bad_habits TEXT,
    body_scan_info TEXT,
    onboarding_complete BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS progress_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date DATE NOT NULL,
    meals_logged TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS user_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    points INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    last_check_in_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id)
  );

  CREATE TABLE IF NOT EXISTS badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    badge_name TEXT NOT NULL,
    badge_description TEXT,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS meal_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    week_start_date DATE NOT NULL,
    plan_data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Helper functions
export const dbHelpers = {
  // User operations
  createUser: (email, passwordHash, name) => {
    const stmt = db.prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)');
    return stmt.run(email, passwordHash, name);
  },

  getUserByEmail: (email) => {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  },

  getUserById: (id) => {
    const stmt = db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?');
    return stmt.get(id);
  },

  // Preferences operations
  getPreferences: (userId) => {
    const stmt = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?');
    return stmt.get(userId);
  },

  upsertPreferences: (userId, preferences) => {
    const existing = dbHelpers.getPreferences(userId);
    if (existing) {
      const stmt = db.prepare(`
        UPDATE user_preferences 
        SET food_allergies = ?, foods_dislike = ?, foods_like = ?, 
            meals_per_day = ?, meal_preference = ?, goals = ?, 
            bad_habits = ?, body_scan_info = ?, onboarding_complete = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `);
      return stmt.run(
        preferences.food_allergies || null,
        preferences.foods_dislike || null,
        preferences.foods_like || null,
        preferences.meals_per_day || null,
        preferences.meal_preference || null,
        preferences.goals || null,
        preferences.bad_habits || null,
        preferences.body_scan_info || null,
        preferences.onboarding_complete ? 1 : 0,
        userId
      );
    } else {
      const stmt = db.prepare(`
        INSERT INTO user_preferences 
        (user_id, food_allergies, foods_dislike, foods_like, meals_per_day, 
         meal_preference, goals, bad_habits, body_scan_info, onboarding_complete)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      return stmt.run(
        userId,
        preferences.food_allergies || null,
        preferences.foods_dislike || null,
        preferences.foods_like || null,
        preferences.meals_per_day || null,
        preferences.meal_preference || null,
        preferences.goals || null,
        preferences.bad_habits || null,
        preferences.body_scan_info || null,
        preferences.onboarding_complete ? 1 : 0
      );
    }
  },

  // Progress operations
  addProgressEntry: (userId, date, mealsLogged, notes) => {
    const stmt = db.prepare('INSERT INTO progress_entries (user_id, date, meals_logged, notes) VALUES (?, ?, ?, ?)');
    return stmt.run(userId, date, mealsLogged, notes);
  },

  getProgressEntries: (userId, limit = 30) => {
    const stmt = db.prepare('SELECT * FROM progress_entries WHERE user_id = ? ORDER BY date DESC LIMIT ?');
    return stmt.all(userId, limit);
  },

  // Stats operations
  getStats: (userId) => {
    const stmt = db.prepare('SELECT * FROM user_stats WHERE user_id = ?');
    return stmt.get(userId);
  },

  initializeStats: (userId) => {
    const existing = dbHelpers.getStats(userId);
    if (!existing) {
      const stmt = db.prepare('INSERT INTO user_stats (user_id) VALUES (?)');
      return stmt.run(userId);
    }
    return existing;
  },

  updateStats: (userId, updates) => {
    const existing = dbHelpers.getStats(userId);
    if (!existing) {
      dbHelpers.initializeStats(userId);
    }
    const fields = [];
    const values = [];
    if (updates.points !== undefined) {
      fields.push('points = ?');
      values.push(updates.points);
    }
    if (updates.streak !== undefined) {
      fields.push('streak = ?');
      values.push(updates.streak);
    }
    if (updates.last_check_in_date !== undefined) {
      fields.push('last_check_in_date = ?');
      values.push(updates.last_check_in_date);
    }
    if (fields.length > 0) {
      values.push(userId);
      const stmt = db.prepare(`UPDATE user_stats SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`);
      return stmt.run(...values);
    }
  },

  // Badge operations
  getBadges: (userId) => {
    const stmt = db.prepare('SELECT * FROM badges WHERE user_id = ? ORDER BY earned_at DESC');
    return stmt.all(userId);
  },

  addBadge: (userId, badgeName, badgeDescription) => {
    const stmt = db.prepare('INSERT INTO badges (user_id, badge_name, badge_description) VALUES (?, ?, ?)');
    return stmt.run(userId, badgeName, badgeDescription);
  },

  // Meal plan operations
  saveMealPlan: (userId, weekStartDate, planData) => {
    const stmt = db.prepare('INSERT INTO meal_plans (user_id, week_start_date, plan_data) VALUES (?, ?, ?)');
    return stmt.run(userId, weekStartDate, JSON.stringify(planData));
  },

  getMealPlan: (userId, weekStartDate) => {
    const stmt = db.prepare('SELECT * FROM meal_plans WHERE user_id = ? AND week_start_date = ? ORDER BY created_at DESC LIMIT 1');
    const result = stmt.get(userId, weekStartDate);
    if (result) {
      result.plan_data = JSON.parse(result.plan_data);
    }
    return result;
  },
};

export default db;
