export interface SseEvent {
  data: string;
}

export async function* parseSseStream(
  stream: ReadableStream<Uint8Array>
): AsyncGenerator<SseEvent> {
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let sep: number;
      while ((sep = indexOfDoubleNewline(buffer)) !== -1) {
        const rawEvent = buffer.slice(0, sep);
        buffer = buffer.slice(sep + delimiterLength(buffer, sep));
        const data = collectData(rawEvent);
        if (data !== null) yield { data };
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function indexOfDoubleNewline(s: string): number {
  const lf = s.indexOf("\n\n");
  const crlf = s.indexOf("\r\n\r\n");
  if (lf === -1) return crlf;
  if (crlf === -1) return lf;
  return Math.min(lf, crlf);
}

function delimiterLength(s: string, idx: number): number {
  return s.startsWith("\r\n\r\n", idx) ? 4 : 2;
}

function collectData(rawEvent: string): string | null {
  const lines = rawEvent.split(/\r?\n/);
  const dataLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).replace(/^ /, ""));
    }
  }
  return dataLines.length > 0 ? dataLines.join("\n") : null;
}
