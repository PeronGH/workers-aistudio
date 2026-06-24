export async function* streamJsonEvents<T>(
  stream: ReadableStream<BufferSource>
): AsyncGenerator<T> {
  for await (const event of parseSseFrames(stream)) {
    if (event.data === "[DONE]") return;
    try {
      yield JSON.parse(event.data) as T;
    } catch {
      // skip malformed frames
    }
  }
}

interface SseEvent {
  data: string;
}

async function* parseSseFrames(
  stream: ReadableStream<BufferSource>
): AsyncGenerator<SseEvent> {
  const reader = stream.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;

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
