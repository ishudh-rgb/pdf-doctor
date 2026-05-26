import { createDeflateRaw } from "zlib";
import { promisify } from "util";

const deflateRaw = promisify(createDeflateRaw);

/**
 * Builds a minimal valid .docx (PKZIP/OOXML) from a map of file paths to
 * their XML string contents. Uses raw Node.js zlib — no external zip library.
 */
export async function buildDocx(
  files: Record<string, string>
): Promise<Buffer> {
  const entries: { name: Buffer; compressed: Buffer; crc: number; uncompressedSize: number }[] = [];

  for (const [path, content] of Object.entries(files)) {
    const uncompressed = Buffer.from(content, "utf-8");
    const crc = crc32(uncompressed);

    const stream = createDeflateRaw();
    const chunks: Buffer[] = [];
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    const finished = new Promise<void>((resolve, reject) => {
      stream.on("end", resolve);
      stream.on("error", reject);
    });
    stream.end(uncompressed);
    await finished;
    const compressed = Buffer.concat(chunks);

    entries.push({
      name: Buffer.from(path, "utf-8"),
      compressed,
      crc,
      uncompressedSize: uncompressed.length,
    });
  }

  const parts: Buffer[] = [];
  const centralDir: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    // Local file header
    const local = buildLocalHeader(entry);
    centralDir.push(buildCentralHeader(entry, offset));
    parts.push(local, entry.compressed);
    offset += local.length + entry.compressed.length;
  }

  const centralDirBuf = Buffer.concat(centralDir);
  const centralDirOffset = offset;

  // End of central directory
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralDirBuf.length, 12);
  eocd.writeUInt32LE(centralDirOffset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...parts, centralDirBuf, eocd]);
}

function buildLocalHeader(entry: {
  name: Buffer;
  compressed: Buffer;
  crc: number;
  uncompressedSize: number;
}): Buffer {
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0, 6);
  header.writeUInt16LE(8, 8); // deflate
  header.writeUInt16LE(0, 10);
  header.writeUInt16LE(0, 12);
  header.writeUInt32LE(entry.crc, 14);
  header.writeUInt32LE(entry.compressed.length, 18);
  header.writeUInt32LE(entry.uncompressedSize, 22);
  header.writeUInt16LE(entry.name.length, 26);
  header.writeUInt16LE(0, 28);
  return Buffer.concat([header, entry.name]);
}

function buildCentralHeader(
  entry: {
    name: Buffer;
    compressed: Buffer;
    crc: number;
    uncompressedSize: number;
  },
  localOffset: number
): Buffer {
  const header = Buffer.alloc(46);
  header.writeUInt32LE(0x02014b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(20, 6);
  header.writeUInt16LE(0, 8);
  header.writeUInt16LE(8, 10); // deflate
  header.writeUInt16LE(0, 12);
  header.writeUInt16LE(0, 14);
  header.writeUInt32LE(entry.crc, 16);
  header.writeUInt32LE(entry.compressed.length, 20);
  header.writeUInt32LE(entry.uncompressedSize, 24);
  header.writeUInt16LE(entry.name.length, 28);
  header.writeUInt16LE(0, 30);
  header.writeUInt16LE(0, 32);
  header.writeUInt16LE(0, 34);
  header.writeUInt16LE(0, 36);
  header.writeUInt32LE(0, 38);
  header.writeUInt32LE(localOffset, 42);
  return Buffer.concat([header, entry.name]);
}

/**
 * CRC-32 (ISO 3309 / ITU-T V.42) used by PKZIP.
 */
function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
