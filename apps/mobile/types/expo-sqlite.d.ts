declare module 'expo-sqlite' {
  export interface SQLiteCallback {
    (tx: SQLiteTransaction, resultSet: ResultSet): void;
    (tx: SQLiteTransaction, error: SQLiteError): boolean | void;
  }
  export interface SQLiteTransaction {
    executeSql(sqlStatement: string, arguments?: any[]): Promise<[SQLiteTransaction, ResultSet]>;
  }
  export interface ResultSet {
    insertId?: number;
    rowsAffected: number;
    rows: ResultSetRowList;
  }
  export interface ResultSetRowList {
    length: number;
    item(index: number): any;
    _array: any[];
  }
  export interface SQLiteError {
    message: string;
    code: number;
  }
  export class SQLiteDatabase {
    constructor(databasePath: string, options?: any): void;
    exec(queries: string[]): void;
    execAsync(sql: string): Promise<void>;
    closeAsync(): Promise<void>;
    getFirstAsync<T = any>(sql: string, ...params: any[]): Promise<T | null>;
    getAllAsync<T = any>(sql: string, ...params: any[]): Promise<T[]>;
    runAsync(sql: string, ...params: any[]): Promise<ResultSet>;
  }
  export function openDatabaseAsync(databaseName: string, options?: any): Promise<SQLiteDatabase>;
}
