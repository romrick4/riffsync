import fs from "fs/promises";
import path from "path";
import type { StorageProvider } from "./index";

export class LocalStorageProvider implements StorageProvider {
  private basePath: string;

  constructor() {
    this.basePath = process.env.STORAGE_PATH ?? "./storage";
  }

  private resolve(key: string): string {
    const resolved = path.resolve(this.basePath, key);
    const base = path.resolve(this.basePath);
    if (!resolved.startsWith(base + path.sep) && resolved !== base) {
      throw new Error("Path traversal detected");
    }
    return resolved;
  }

  async save(key: string, data: Buffer, _contentType: string): Promise<void> {
    const filePath = this.resolve(key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, data);
  }

  async get(key: string): Promise<Buffer> {
    return fs.readFile(this.resolve(key));
  }

  async delete(key: string): Promise<void> {
    await fs.unlink(this.resolve(key));
  }

  async getUrl(key: string): Promise<string> {
    return `/api/files/${key}`;
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.resolve(key));
      return true;
    } catch {
      return false;
    }
  }
}
