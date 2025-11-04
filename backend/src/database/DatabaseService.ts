import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

/**
 * SQLiteベースのDatabaseService実装
 * インメモリ実装をSQLiteによる永続化ストレージに置き換える
 */
export class DatabaseService {
  private db: Database.Database;
  private static instance: DatabaseService;

  private constructor() {
    // 環境変数からデータベースパスを取得、なければデフォルトを使用
    const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/database.sqlite');
    const dbDir = path.dirname(dbPath);

    // データディレクトリが存在しない場合は作成
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log(`Created database directory: ${dbDir}`);
    }

    // SQLiteデータベースを初期化
    console.log(`Initializing SQLite database at: ${dbPath}`);
    this.db = new Database(dbPath);

    // 並行性向上のためWALモードを有効化
    this.db.pragma('journal_mode = WAL');

    // 外部キー制約を有効化
    this.db.pragma('foreign_keys = ON');

    console.log('SQLite database connection established');
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * schema.sqlファイルからデータベーススキーマを初期化
   */
  public async initialize(): Promise<void> {
    try {
      const schemaPath = path.join(__dirname, 'schema.sql');

      if (!fs.existsSync(schemaPath)) {
        console.error(`Schema file not found at: ${schemaPath}`);
        throw new Error('Schema file not found');
      }

      const schema = fs.readFileSync(schemaPath, 'utf-8');

      // スキーマSQLを実行
      this.db.exec(schema);

      console.log('Database schema initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * SQL文を実行（INSERT, UPDATE, DELETE）
   * lastInsertRowidとchangesを含むオブジェクトを返す
   */
  public run(sql: string, params: any[] = []): any {
    try {
      const stmt = this.db.prepare(sql);
      const result = stmt.run(...params);

      return {
        lastInsertRowid: result.lastInsertRowid,
        changes: result.changes
      };
    } catch (error) {
      console.error('[DB.run] Error executing SQL:', sql, 'params:', params, 'error:', error);
      throw error;
    }
  }

  /**
   * SELECTクエリを実行し、単一行を返す
   */
  public get<T = any>(sql: string, params: any[] = []): T | undefined {
    try {
      const stmt = this.db.prepare(sql);
      const result = stmt.get(...params);
      return result as T | undefined;
    } catch (error) {
      console.error('[DB.get] Error executing SQL:', sql, 'params:', params, 'error:', error);
      throw error;
    }
  }

  /**
   * SELECTクエリを実行し、一致する全ての行を返す
   */
  public all<T = any>(sql: string, params: any[] = []): T[] {
    try {
      const stmt = this.db.prepare(sql);
      const result = stmt.all(...params);
      return result as T[];
    } catch (error) {
      console.error('[DB.all] Error executing SQL:', sql, 'params:', params, 'error:', error);
      throw error;
    }
  }

  /**
   * 複数の操作をトランザクション内で実行
   * コールバックがエラーをスローした場合、トランザクションはロールバックされる
   */
  public transaction<T>(callback: () => T): T {
    const transactionFn = this.db.transaction(callback);
    return transactionFn();
  }

  /**
   * データベース接続を閉じる
   */
  public close(): void {
    try {
      this.db.close();
      console.log('Database connection closed');
    } catch (error) {
      console.error('Error closing database:', error);
    }
  }

  // 共通データベース操作のヘルパーメソッド（互換性のため維持）

  public exists(table: string, where: string, params: any[] = []): boolean {
    const sql = `SELECT 1 FROM ${table} WHERE ${where} LIMIT 1`;
    const result = this.get(sql, params);
    return result !== undefined;
  }

  public count(table: string, where?: string, params: any[] = []): number {
    const sql = where
      ? `SELECT COUNT(*) as count FROM ${table} WHERE ${where}`
      : `SELECT COUNT(*) as count FROM ${table}`;
    const result = this.get<{ count: number }>(sql, params);
    return result?.count || 0;
  }

  public insert(table: string, data: Record<string, any>): string {
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(data);

    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
    const result = this.run(sql, values);

    return result.lastInsertRowid.toString();
  }

  public update(table: string, data: Record<string, any>, where: string, whereParams: any[] = []): number {
    const columns = Object.keys(data);
    const setClause = columns.map(col => `${col} = ?`).join(', ');
    const values = [...Object.values(data), ...whereParams];

    const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
    const result = this.run(sql, values);

    return result.changes;
  }

  public delete(table: string, where: string, params: any[] = []): number {
    const sql = `DELETE FROM ${table} WHERE ${where}`;
    const result = this.run(sql, params);
    return result.changes;
  }

  /**
   * テーブルの内容を検査するデバッグメソッド
   */
  public debugTable(tableName: string): any[] {
    try {
      const sql = `SELECT * FROM ${tableName}`;
      const rows = this.all(sql);
      console.log(`Table '${tableName}' contains ${rows.length} records:`, rows);
      return rows;
    } catch (error) {
      console.error(`Error reading table '${tableName}':`, error);
      return [];
    }
  }

  /**
   * データベース統計情報を取得
   */
  public getStats(): any {
    const tables = [
      'users',
      'user_stats',
      'game_type_stats',
      'friend_requests',
      'friendships',
      'match_history',
      'games',
      'tournaments'
    ];

    const stats: Record<string, number> = {};

    for (const table of tables) {
      stats[table] = this.count(table);
    }

    return stats;
  }
}
