export interface StorageProvider {
  save(key: string, data: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getUrl(key: string): Promise<string>;
  exists(key: string): Promise<boolean>;
}

let cachedProvider: StorageProvider | null = null;

export function getStorage(): StorageProvider {
  if (cachedProvider) return cachedProvider;

  const provider = process.env.STORAGE_PROVIDER ?? "local";

  if (provider === "s3") {
    const { S3StorageProvider } = require("./s3");
    cachedProvider = new S3StorageProvider();
  } else {
    const { LocalStorageProvider } = require("./local");
    cachedProvider = new LocalStorageProvider();
  }

  return cachedProvider!;
}
