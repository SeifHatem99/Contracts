(function () {
  const textEncoder = new TextEncoder();
  const textDecoder = new TextDecoder();

  function crc32(buffer) {
    let crc = ~0;
    for (let i = 0; i < buffer.length; i += 1) {
      crc ^= buffer[i];
      for (let j = 0; j < 8; j += 1) {
        const mask = -(crc & 1);
        crc = (crc >>> 1) ^ (0xEDB88320 & mask);
      }
    }
    return (~crc) >>> 0;
  }

  function u16(n) {
    return [n & 255, (n >>> 8) & 255];
  }

  function u32(n) {
    return [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
  }

  function concat(chunks) {
    const total = chunks.reduce((sum, c) => sum + c.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    chunks.forEach((chunk) => {
      out.set(chunk, offset);
      offset += chunk.length;
    });
    return out;
  }

  async function inflateRaw(bytes) {
    if (typeof DecompressionStream !== "undefined") {
      const source = new Blob([bytes]);
      const stream = source.stream().pipeThrough(new DecompressionStream("deflate-raw"));
      const chunks = [];
      const reader = stream.getReader();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const out = new Uint8Array(total);
      let offset = 0;
      chunks.forEach((chunk) => {
        out.set(chunk, offset);
        offset += chunk.length;
      });
      return out;
    }
    if (typeof require === "function") {
      const zlib = require("zlib");
      return new Uint8Array(zlib.inflateRawSync(Buffer.from(bytes)));
    }
    throw new Error("Compressed DOCX templates are not supported in this runtime.");
  }

  async function parse(buffer) {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let eocd = -1;
    for (let i = bytes.length - 22; i >= 0; i -= 1) {
      if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error("Corrupted DOCX template.");
    const totalEntries = dv.getUint16(eocd + 10, true);
    const centralOffset = dv.getUint32(eocd + 16, true);
    const entries = {};
    let ptr = centralOffset;
    for (let i = 0; i < totalEntries; i += 1) {
      if (dv.getUint32(ptr, true) !== 0x02014b50) throw new Error("Corrupted DOCX central directory.");
      const method = dv.getUint16(ptr + 10, true);
      const compressedSize = dv.getUint32(ptr + 20, true);
      const uncompressedSize = dv.getUint32(ptr + 24, true);
      const nameLen = dv.getUint16(ptr + 28, true);
      const extraLen = dv.getUint16(ptr + 30, true);
      const commentLen = dv.getUint16(ptr + 32, true);
      const localOffset = dv.getUint32(ptr + 42, true);
      const name = textDecoder.decode(bytes.slice(ptr + 46, ptr + 46 + nameLen));
      const localNameLen = dv.getUint16(localOffset + 26, true);
      const localExtraLen = dv.getUint16(localOffset + 28, true);
      const dataStart = localOffset + 30 + localNameLen + localExtraLen;
      const data = bytes.slice(dataStart, dataStart + compressedSize);
      let output = data;
      if (method === 8) output = await inflateRaw(data);
      if (method !== 0 && method !== 8) throw new Error(`Unsupported compression for ${name}.`);
      entries[name] = { name, data: output, uncompressedSize };
      ptr += 46 + nameLen + extraLen + commentLen;
    }
    return entries;
  }

  function build(entries) {
    const fileParts = [];
    const centralParts = [];
    let offset = 0;
    Object.keys(entries).forEach((name) => {
      const data = entries[name] instanceof Uint8Array ? entries[name] : textEncoder.encode(String(entries[name]));
      const nameBytes = textEncoder.encode(name);
      const crc = crc32(data);
      const localHeader = concat([
        Uint8Array.from([0x50, 0x4b, 0x03, 0x04]),
        Uint8Array.from(u16(20)),
        Uint8Array.from(u16(0)),
        Uint8Array.from(u16(0)),
        Uint8Array.from(u16(0)),
        Uint8Array.from(u16(0)),
        Uint8Array.from(u32(crc)),
        Uint8Array.from(u32(data.length)),
        Uint8Array.from(u32(data.length)),
        Uint8Array.from(u16(nameBytes.length)),
        Uint8Array.from(u16(0)),
        nameBytes,
      ]);
      fileParts.push(localHeader, data);

      const centralHeader = concat([
        Uint8Array.from([0x50, 0x4b, 0x01, 0x02]),
        Uint8Array.from(u16(20)),
        Uint8Array.from(u16(20)),
        Uint8Array.from(u16(0)),
        Uint8Array.from(u16(0)),
        Uint8Array.from(u16(0)),
        Uint8Array.from(u16(0)),
        Uint8Array.from(u32(crc)),
        Uint8Array.from(u32(data.length)),
        Uint8Array.from(u32(data.length)),
        Uint8Array.from(u16(nameBytes.length)),
        Uint8Array.from(u16(0)),
        Uint8Array.from(u16(0)),
        Uint8Array.from(u16(0)),
        Uint8Array.from(u16(0)),
        Uint8Array.from(u32(0)),
        Uint8Array.from(u32(offset)),
        nameBytes,
      ]);
      centralParts.push(centralHeader);
      offset += localHeader.length + data.length;
    });
    const centralStart = offset;
    const centralData = concat(centralParts);
    const eocd = concat([
      Uint8Array.from([0x50, 0x4b, 0x05, 0x06]),
      Uint8Array.from(u16(0)),
      Uint8Array.from(u16(0)),
      Uint8Array.from(u16(Object.keys(entries).length)),
      Uint8Array.from(u16(Object.keys(entries).length)),
      Uint8Array.from(u32(centralData.length)),
      Uint8Array.from(u32(centralStart)),
      Uint8Array.from(u16(0)),
    ]);
    return concat([...fileParts, centralData, eocd]);
  }

  window.DocxZip = { parse, build };
})();
