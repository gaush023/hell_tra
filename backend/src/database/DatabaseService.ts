import Database from 'better-sqlite3';

export class DatabaseService {
  private static instance: DatabaseService;
  private db: Database.Database;

  private constructor() {
    this.db = new Database('/data/db.sqlite');
    this.db.exec('PRAGMA foreign_keys = ON;');
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async initialize(): Promise<void> {

    return;
  }

  public run(sql: string, params: any[] = []) {
    return this.db.prepare(sql).run(...params);
  }

  public get<T = any>(sql: string, params: any[] = []): T | undefined {
    return this.db.prepare(sql).get(...params) as T | undefined;
  }

  public all<T = any>(sql: string, params: any[] = []): T[] {
    return this.db.prepare(sql).all(...params) as T[];
  }

  public transaction<T>(callback: () => T): T {
    const trx = this.db.transaction(callback);
    return trx();
  }

  public debugTable(tableName: string): any[] {
    return this.all(`SELECT * FROM ${tableName}`) as any[];
  }
}
