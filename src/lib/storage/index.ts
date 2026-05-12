import { S3StorageProvider } from "./s3";

export function sanitizeFilename(name: string): string {
  const base = name.replace(/^.*[\\/]/, "");
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^\.+/, "_") || "file";
}

export interface StorageProvider {
  save(key: string, data: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getUrl(key: string): Promise<string>;
  getUploadUrl(
    key: string,
    contentType: string,
    expiresIn?: number,
  ): Promise<string>;
  exists(key: string): Promise<boolean>;
}

let cachedProvider: StorageProvider | null = null;

export function getStorage(): StorageProvider {
  if (cachedProvider) return cachedProvider;
  cachedProvider = new S3StorageProvider();
  return cachedProvider;
}
