export type Chunk = {
  chunk_index: number;
  content: string;
  char_count: number;
};

export function chunkText(
  text: string,
  chunkSize = 800,
  overlap = 120
): Chunk[] {
  if (chunkSize <= 0) {
    throw new Error("chunkSize must be greater than 0");
  }

  if (overlap < 0) {
    throw new Error("overlap must be greater than or equal to 0");
  }

  if (overlap >= chunkSize) {
    throw new Error("overlap must be smaller than chunkSize");
  }

  const clean = text.replace(/\s+/g, " ").trim();

  if (clean.length === 0) {
    return [];
  }

  const chunks: Chunk[] = [];
  const step = chunkSize - overlap;

  let i = 0;
  let idx = 0;

  while (i < clean.length) {
    const end = Math.min(i + chunkSize, clean.length);
    const content = clean.slice(i, end);

    if (content.length > 0) {
      chunks.push({
        chunk_index: idx++,
        content,
        char_count: content.length,
      });
    }

    i += step;
  }

  return chunks;
}
