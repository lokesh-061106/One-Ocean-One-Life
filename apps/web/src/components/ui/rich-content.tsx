const TAG_RE = /<\/?[a-z][^>]*>/i;
const ENTITY_RE = /&(#[xX]?[0-9a-fA-F]+|[a-zA-Z]+);/g;

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

export function decodeEntities(value: string): string {
  return value.replace(ENTITY_RE, (match, body: string) => {
    if (body[0] === "#") {
      const isHex = body[1] === "x" || body[1] === "X";
      const code = Number.parseInt(isHex ? body.slice(2) : body.slice(1), isHex ? 16 : 10);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    return NAMED_ENTITIES[body] ?? match;
  });
}

export function hasRichHtml(value: string): boolean {
  return TAG_RE.test(value);
}

export function stripHtml(value: string | null | undefined): string {
  if (!value) return "";
  return decodeEntities(value.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

interface RichContentProps {
  content?: string | null;
  className?: string;
}

/**
 * Rewrite media/static URLs in rich HTML to site-relative paths so they load
 * through the Next.js proxy on this origin (see next.config.ts rewrites).
 * Handles both absolute API URLs (http://localhost:8000/media/...) and
 * already-relative ones (/media/...). External URLs are left untouched.
 */
export function normalizeMediaUrls(html: string): string {
  if (!html) return html;
  const absoluteMedia = /\b(src|href)=(["'])https?:\/\/[^"']+\/(media|static)\//i;
  const absoluteMediaCss = /url\((["']?)https?:\/\/[^)"']+\/(media|static)\//i;
  if (!absoluteMedia.test(html) && !absoluteMediaCss.test(html)) return html;
  return html
    .replace(/\b(src|href)=(["'])https?:\/\/[^"']+\/(media|static)\//gi, (_m, attr, quote, dir) => `${attr}=${quote}/${dir}/`)
    .replace(/url\((["']?)https?:\/\/[^)"']+\/(media|static)\//gi, (_m, quote, dir) => `url(${quote}/${dir}/`);
}

export function RichContent({ content, className = "" }: RichContentProps) {
  if (!content) return null;

  if (TAG_RE.test(content)) {
    return (
      <div
        className={`rich-content ${className}`.trim()}
        dangerouslySetInnerHTML={{ __html: normalizeMediaUrls(content) }}
      />
    );
  }

  return <p className={`whitespace-pre-line ${className}`.trim()}>{decodeEntities(content)}</p>;
}
