/**
 * Minimal markdown → HTML for browser lesson viewing (no extra deps).
 * Supports headings, bold, italic, unordered lists, paragraphs, horizontal rules.
 */
export function markdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let inList = false;

  const flushList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };

  const inline = (text: string) =>
    text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>");

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushList();
      continue;
    }
    if (/^---+$/.test(line.trim())) {
      flushList();
      out.push("<hr />");
      continue;
    }
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flushList();
      const level = heading[1].length;
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }
    const bullet = line.match(/^\*\s+(.+)$/);
    if (bullet) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${inline(bullet[1])}</li>`);
      continue;
    }
    flushList();
    out.push(`<p>${inline(line.trim())}</p>`);
  }
  flushList();
  return out.join("\n");
}

export function renderLessonPage(slug: string, markdown: string): string {
  const body = markdownToHtml(markdown);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${slug} · VettedME RLHF</title>
  <style>
    :root {
      --ink: #14212b;
      --muted: #5b6b76;
      --line: #d7e0e6;
      --bg: #f4f7f8;
      --card: #ffffff;
      --accent: #0f766e;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
      color: var(--ink);
      background:
        radial-gradient(circle at top right, rgba(15,118,110,0.12), transparent 40%),
        linear-gradient(180deg, #eef5f4 0%, var(--bg) 45%, #e8eef1 100%);
      min-height: 100vh;
    }
    main {
      max-width: 46rem;
      margin: 0 auto;
      padding: 2.5rem 1.25rem 4rem;
    }
    .meta {
      font-family: ui-sans-serif, system-ui, sans-serif;
      font-size: 0.75rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 0.75rem;
    }
    article {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 1rem;
      padding: 1.75rem 1.5rem;
      box-shadow: 0 10px 30px rgba(20, 33, 43, 0.06);
      animation: rise 420ms ease-out;
    }
    @keyframes rise {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    h1, h2, h3, h4 {
      font-weight: 700;
      letter-spacing: -0.02em;
      line-height: 1.2;
      margin: 1.4rem 0 0.7rem;
    }
    h1 { font-size: 2rem; margin-top: 0; color: #0b1c24; }
    h2 { font-size: 1.35rem; color: var(--accent); }
    p, li {
      font-family: ui-sans-serif, system-ui, sans-serif;
      font-size: 1.02rem;
      line-height: 1.65;
      color: #24343d;
    }
    ul { padding-left: 1.2rem; margin: 0.6rem 0 1rem; }
    li { margin: 0.35rem 0; }
    strong { color: #0b1c24; }
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.92em;
      background: #eef4f3;
      padding: 0.1rem 0.35rem;
      border-radius: 0.3rem;
    }
    hr { border: 0; border-top: 1px solid var(--line); margin: 1.5rem 0; }
    nav {
      margin-top: 1.25rem;
      font-family: ui-sans-serif, system-ui, sans-serif;
      font-size: 0.9rem;
    }
    a { color: var(--accent); }
  </style>
</head>
<body>
  <main>
    <div class="meta">VettedME · Module 1 · ${slug}</div>
    <article>
      ${body}
    </article>
    <nav>
      <a href="/api/v1/modules/rlhf-core-rubric/lessons/03-core-rubric-dimensions">Lesson 03</a>
      ·
      <a href="/api/v1/modules/rlhf-core-rubric/lessons/04-scoring-calibration">Lesson 04</a>
      ·
      <a href="/api/v1/modules/rlhf-core-rubric/lessons/03-core-rubric-dimensions?format=json">JSON</a>
    </nav>
  </main>
</body>
</html>`;
}

export function wantsHtml(req: {
  query: Record<string, unknown>;
  headers: { accept?: string };
}): boolean {
  const format = String(req.query.format || "").toLowerCase();
  if (format === "json") return false;
  if (format === "html") return true;
  const accept = String(req.headers.accept || "");
  return accept.includes("text/html");
}
