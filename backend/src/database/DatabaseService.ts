import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// File-based SQLite database with better-sqlite3
export class DatabaseService {
  private db: Database.Database;
  private static instance: DatabaseService;

  private constructor() {
    // Database file path (relative to project root)
    const dbPath = path.join(process.cwd(), process.env.DB_PATH || 'database.db');

    // Ensure the directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Initialize database connection
    this.db = new Database(dbPath);

    // Enable foreign keys and WAL mode for better performance
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('journal_mode = WAL');

    console.log(`SQLite database initialized at: ${dbPath}`);
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async initialize(): Promise<void> {
    this.createTables();
    console.log('Database tables initialized successfully');
  }

  private createTables(): void {
    // Users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        email TEXT,
        display_name TEXT,
        bio TEXT,
        avatar TEXT,
        is_online INTEGER DEFAULT 0,
        is_in_game INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login_at DATETIME
      )
    `);

    // User stats table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_stats (
        user_id TEXT PRIMARY KEY,
        total_games INTEGER DEFAULT 0,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        win_rate REAL DEFAULT 0.0,
        tournament_wins INTEGER DEFAULT 0,
        longest_win_streak INTEGER DEFAULT 0,
        current_win_streak INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Game type stats table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS game_type_stats (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        game_type TEXT NOT NULL,
        games_played INTEGER DEFAULT 0,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        win_rate REAL DEFAULT 0.0,
        average_game_duration INTEGER DEFAULT 0,
        best_score INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, game_type)
      )
    `);

    // Friend requests table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS friend_requests (
        id TEXT PRIMARY KEY,
        from_user_id TEXT NOT NULL,
        to_user_id TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(from_user_id, to_user_id)
      )
    `);

    // Friendships table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS friendships (
        user_id TEXT NOT NULL,
        friend_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, friend_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Match history table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS match_history (
        id TEXT PRIMARY KEY,
        game_id TEXT,
        game_type TEXT NOT NULL,
        game_mode TEXT,
        player_id TEXT NOT NULL,
        opponent_ids TEXT,
        opponent_names TEXT,
        result TEXT NOT NULL,
        score INTEGER,
        opponent_scores TEXT,
        duration INTEGER,
        date_played DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_ranked INTEGER DEFAULT 0,
        tournament_id TEXT,
        FOREIGN KEY (player_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('Database tables created/verified');
  }

  public run(sql: string, params: any[] = []): any {
    const stmt = this.db.prepare(sql);
    const info = stmt.run(...params);
    return {
      lastInsertRowid: info.lastInsertRowid,
      changes: info.changes
    };
  }

  public get<T = any>(sql: string, params: any[] = []): T | undefined {
    const stmt = this.db.prepare(sql);
    return stmt.get(...params) as T | undefined;
  }

  public all<T = any>(sql: string, params: any[] = []): T[] {
    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as T[];
  }

  public transaction<T>(callback: () => T): T {
    const transaction = this.db.transaction(callback);
    return transaction();
  }

  public close(): void {
    this.db.close();
    console.log('Database connection closed');
  }

  // Helper methods for common database operations
  public exists(table: string, where: string, params: any[] = []): boolean {
    const sql = `SELECT EXISTS(SELECT 1 FROM ${table} WHERE ${where}) as exists`;
    const result = this.get<{ exists: number }>(sql, params);
    return result?.exists === 1;
  }

  public count(table: string, where?: string, params: any[] = []): number {
    const sql = where
      ? `SELECT COUNT(*) as count FROM ${table} WHERE ${where}`
      : `SELECT COUNT(*) as count FROM ${table}`;
    const result = this.get<{ count: number }>(sql, params);
    return result?.count || 0;
  }

  public insert(table: string, data: Record<string, any>): string {
    const keys = Object.keys(data);
    const placeholders = keys.map(() => '?').join(', ');
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    const result = this.run(sql, Object.values(data));
    return result.lastInsertRowid.toString();
  }

  public update(table: string, data: Record<string, any>, where: string, whereParams: any[] = []): number {
    const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
    const result = this.run(sql, [...Object.values(data), ...whereParams]);
    return result.changes;
  }

  public delete(table: string, where: string, params: any[] = []): number {
    const sql = `DELETE FROM ${table} WHERE ${where}`;
    const result = this.run(sql, params);
    return result.changes;
  }

  // Debug method to inspect table contents
  public debugTable(tableName: string): any[] {
    try {
      const rows = this.all(`SELECT * FROM ${tableName}`);
      console.log(`Table '${tableName}' contains ${rows.length} records:`, rows);
      return rows;
    } catch (error) {
      console.log(`Error reading table '${tableName}':`, error);
      return [];
    }
  }
}
