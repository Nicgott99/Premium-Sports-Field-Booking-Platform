export class ConnectionPool {
  constructor(createFn, maxSize = 10) {
    this.createFn = createFn;
    this.maxSize = maxSize;
    this.available = [];
    this.inUse = new Set();
  }
  async acquire() {
    if (this.available.length > 0) return this.available.pop();
    if (this.inUse.size < this.maxSize) {
      const conn = await this.createFn();
      this.inUse.add(conn);
      return conn;
    }
    throw new Error("Connection pool exhausted");
  }
  release(conn) {
    this.inUse.delete(conn);
    this.available.push(conn);
  }
}
