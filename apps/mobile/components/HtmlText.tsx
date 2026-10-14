import React, { useEffect, useMemo, useState } from 'react';
import { Image, Linking, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { COLORS } from '@/constants/theme';
import { API_URL } from '@/constants/api';

const API_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, '');

export const resolveMediaUrl = (src?: string | null): string | null => {
  if (!src) return null;
  if (/^(https?:\/\/|data:)/i.test(src)) return src;
  if (src.startsWith('#') || /^(javascript|mailto|tel):/i.test(src)) return null;
  return `${API_ORIGIN}${src.startsWith('/') ? '' : '/'}${src}`;
};

type TextNode = { kind: 'text'; text: string };
type ElNode = { kind: 'el'; tag: string; attrs: Record<string, string>; children: HtmlNode[] };
type HtmlNode = TextNode | ElNode;

const VOID_TAGS = new Set(['br', 'hr', 'img']);

const DROP_TAGS = new Set([
  'script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button',
  'select', 'textarea', 'svg', 'math', 'canvas', 'template', 'noscript',
  'link', 'meta', 'base', 'title', 'head',
]);

const BLOCK_TAGS = new Set([
  'p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li',
  'blockquote', 'pre', 'hr', 'img', 'dl', 'dt', 'dd', 'table', 'tr',
  'figure', 'figcaption', 'section', 'article', 'header', 'footer', 'nav',
  'main', 'aside', 'caption',
]);

const HEADING_SIZES: Record<string, number> = { h1: 26, h2: 22, h3: 19, h4: 17, h5: 16, h6: 15 };

const ENTITIES: Record<string, string> = {
  nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  hellip: '\u2026', mdash: '\u2014', ndash: '\u2013',
  lsquo: '\u2018', rsquo: '\u2019', ldquo: '\u201C', rdquo: '\u201D',
  bull: '\u2022', middot: '\u00B7', copy: '\u00A9',
  reg: '\u00AE', trade: '\u2122', deg: '\u00B0', laquo: '\u00AB', raquo: '\u00BB',
};

function decodeEntities(text: string): string {
  return text.replace(/&(#[xX][0-9a-fA-F]+|#[0-9]+|[a-zA-Z][a-zA-Z0-9]*);/g, (full, body: string) => {
    if (body[0] === '#') {
      const isHex = body[1] === 'x' || body[1] === 'X';
      const code = parseInt(isHex ? body.slice(2) : body.slice(1), isHex ? 16 : 10);
      if (Number.isFinite(code) && code >= 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff)) {
        return String.fromCodePoint(code);
      }
      return full;
    }
    return ENTITIES[body.toLowerCase()] ?? full;
  });
}

function parseAttrs(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    attrs[m[1].toLowerCase()] = m[3] ?? m[4] ?? m[5] ?? '';
  }
  return attrs;
}

function parseHtml(html: string): HtmlNode[] {
  const root: ElNode = { kind: 'el', tag: '#root', attrs: {}, children: [] };
  const stack: ElNode[] = [root];
  const skip: string[] = [];
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9:_-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(html))) {
    const between = html.slice(last, m.index);
    last = re.lastIndex;
    const closing = m[1] === '/';
    const tag = m[2].toLowerCase();
    const selfClosing = /\/\s*$/.test(m[3]);

    if (skip.length) {
      if (tag === skip[skip.length - 1]) {
        if (closing) skip.pop();
        else if (!selfClosing) skip.push(tag);
      }
      continue;
    }

    if (!closing && DROP_TAGS.has(tag)) {
      if (!selfClosing && !VOID_TAGS.has(tag)) skip.push(tag);
      continue;
    }

    if (between) {
      stack[stack.length - 1].children.push({ kind: 'text', text: between });
    }

    if (closing) {
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag === tag) {
          stack.length = i;
          break;
        }
      }
      continue;
    }

    const attrs = parseAttrs(m[3]);
    if (VOID_TAGS.has(tag) || selfClosing) {
      stack[stack.length - 1].children.push({ kind: 'el', tag, attrs, children: [] });
      continue;
    }
    const el: ElNode = { kind: 'el', tag, attrs, children: [] };
    stack[stack.length - 1].children.push(el);
    stack.push(el);
  }

  const tail = html.slice(last);
  if (tail && !skip.length) {
    stack[stack.length - 1].children.push({ kind: 'text', text: tail });
  }
  return root.children;
}

function inlineStyleFor(tag: string): TextStyle | null {
  switch (tag) {
    case 'b':
    case 'strong':
      return { fontWeight: '700' };
    case 'i':
    case 'em':
      return { fontStyle: 'italic' };
    case 'u':
    case 'ins':
      return { textDecorationLine: 'underline' };
    case 's':
    case 'del':
    case 'strike':
      return { textDecorationLine: 'line-through' };
    case 'mark':
      return { backgroundColor: '#FEF08A' };
    case 'a':
      return { color: COLORS.oceanBlue, textDecorationLine: 'underline' };
    case 'code':
    case 'kbd':
    case 'samp':
    case 'var':
      return { fontFamily: 'monospace', backgroundColor: COLORS.gray[100] };
    default:
      return null;
  }
}

function renderInline(nodes: HtmlNode[], inherited: TextStyle[], keyPrefix: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  nodes.forEach((node, i) => {
    const key = `${keyPrefix}-${i}`;
    if (node.kind === 'text') {
      const text = decodeEntities(node.text).replace(/\s+/g, ' ');
      if (text) out.push(text);
      return;
    }
    const { tag, attrs, children } = node;
    if (tag === 'br') {
      out.push('\n');
      return;
    }
    if (tag === 'img') {
      return;
    }
    if (tag === 'a') {
      const href = attrs.href || '';
      const kids = renderInline(children, inherited, key);
      if (/^(https?:\/\/|mailto:|tel:)/i.test(href)) {
        out.push(
          <Text key={key} style={styles.link} onPress={() => Linking.openURL(href)}>
            {kids}
          </Text>,
        );
      } else {
        out.push(<Text key={key}>{kids}</Text>);
      }
      return;
    }
    const st = inlineStyleFor(tag);
    if (st) {
      out.push(
        <Text key={key} style={st}>
          {renderInline(children, [...inherited, st], key)}
        </Text>,
      );
    } else {
      out.push(...renderInline(children, inherited, key));
    }
  });
  return out;
}

function HtmlImage({ node }: { node: ElNode }) {
  const src = resolveMediaUrl(node.attrs.src || '');
  const supported = !!src && /^https?:\/\//i.test(src);
  const [ratio, setRatio] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!supported || !src) return undefined;
    let cancelled = false;
    Image.getSize(
      src,
      (w, h) => {
        if (!cancelled && w > 0 && h > 0) setRatio(w / h);
      },
      () => {
        if (!cancelled) setFailed(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [src, supported]);

  if (!supported || failed) {
    if (!node.attrs.alt) return null;
    return <Text style={styles.altText}>{decodeEntities(node.attrs.alt)}</Text>;
  }
  if (!ratio) return null;
  return (
    <Image
      source={{ uri: src as string }}
      style={{ width: '100%', aspectRatio: ratio, marginVertical: 8, borderRadius: 8 }}
      resizeMode="contain"
    />
  );
}

interface BlockCtx {
  style: StyleProp<TextStyle>;
  spacing: number;
  numberOfLines?: number;
}

function renderBlocks(nodes: HtmlNode[], ctx: BlockCtx, keyPrefix = 'b'): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let pending: HtmlNode[] = [];

  const flush = () => {
    if (!pending.length) return;
    const hasContent = pending.some((n) => (n.kind === 'text' ? n.text.trim().length > 0 : n.tag !== 'br'));
    if (hasContent) {
      out.push(
        <Text
          key={`${keyPrefix}-p${out.length}`}
          style={[ctx.style, { marginBottom: ctx.spacing }]}
          numberOfLines={ctx.numberOfLines}
        >
          {renderInline(pending, [], `${keyPrefix}-i${out.length}`)}
        </Text>,
      );
    }
    pending = [];
  };

  nodes.forEach((node) => {
    if (node.kind === 'text') {
      const blank = node.text.replace(/\s+/g, '').length === 0;
      if (blank && !pending.length) return;
      pending.push(node);
      return;
    }

    const tag = node.tag;

    if (tag === 'br') {
      pending.push(node);
      return;
    }

    if (tag === 'hr') {
      flush();
      out.push(<View key={`${keyPrefix}-hr${out.length}`} style={styles.hr} />);
      return;
    }

    if (tag === 'img') {
      flush();
      out.push(<HtmlImage key={`${keyPrefix}-img${out.length}`} node={node} />);
      return;
    }

    if (BLOCK_TAGS.has(tag)) {
      flush();
      out.push(renderBlock(node, ctx, `${keyPrefix}-${out.length}`));
      return;
    }

    pending.push(node);
  });

  flush();
  return out;
}

function renderBlock(node: ElNode, ctx: BlockCtx, key: string): React.ReactNode {
  const { tag, children } = node;

  if (tag === 'ul' || tag === 'ol') {
    const items = children.filter((c): c is ElNode => c.kind === 'el' && c.tag === 'li');
    const rows: ElNode[] = items.length ? items : [{ kind: 'el', tag: 'li', attrs: {}, children }];
    return (
      <View key={key} style={styles.list}>
        {rows.map((li, i) => (
          <View key={`${key}-${i}`} style={styles.listRow}>
            <Text style={[ctx.style, styles.marker]}>
              {tag === 'ol' ? `${i + 1}.` : '\u2022'}
            </Text>
            <View style={styles.listBody}>
              {renderBlocks(li.children, { ...ctx, spacing: 4 }, `${key}-${i}`)}
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (tag === 'li') {
    return (
      <View key={key} style={styles.listRow}>
        <Text style={[ctx.style, styles.marker]}>{'\u2022'}</Text>
        <View style={styles.listBody}>{renderBlocks(children, { ...ctx, spacing: 4 }, key)}</View>
      </View>
    );
  }

  if (tag === 'blockquote') {
    return (
      <View key={key} style={styles.quote}>
        {renderBlocks(children, ctx, key)}
      </View>
    );
  }

  if (tag === 'table') {
    const rows = children.filter((c): c is ElNode => c.kind === 'el' && c.tag === 'tr');
    return (
      <View key={key} style={{ marginBottom: ctx.spacing }}>
        {rows.map((row, ri) => (
          <View key={`${key}-${ri}`} style={styles.tableRow}>
            {row.children
              .filter((c): c is ElNode => c.kind === 'el' && (c.tag === 'td' || c.tag === 'th'))
              .map((cell, ci) => (
                <Text
                  key={`${key}-${ri}-${ci}`}
                  style={[ctx.style, styles.tableCell, cell.tag === 'th' && styles.tableHead]}
                >
                  {renderInline(cell.children, [], `${key}-${ri}-${ci}`)}
                </Text>
              ))}
          </View>
        ))}
      </View>
    );
  }

  const headingSize = HEADING_SIZES[tag];
  if (headingSize) {
    return (
      <Text
        key={key}
        style={[ctx.style, styles.heading, { fontSize: headingSize, marginTop: 8, marginBottom: 4 }]}
        numberOfLines={ctx.numberOfLines}
      >
        {renderInline(children, [], key)}
      </Text>
    );
  }

  if (tag === 'pre') {
    return (
      <Text key={key} style={[ctx.style, styles.pre, { marginBottom: ctx.spacing }]} numberOfLines={ctx.numberOfLines}>
        {renderInline(children, [], key)}
      </Text>
    );
  }

  const hasBlockChild = children.some((c) => c.kind === 'el' && BLOCK_TAGS.has(c.tag));
  if (hasBlockChild) {
    const extra = tag === 'dt' ? styles.definedTerm : null;
    return (
      <View key={key} style={[extra && { marginBottom: ctx.spacing }]}>
        {extra ? <Text style={[ctx.style, extra]}>{renderInline(children, [], key)}</Text> : renderBlocks(children, ctx, key)}
      </View>
    );
  }

  const bold = tag === 'dt' || tag === 'th';
  return (
    <Text
      key={key}
      style={[ctx.style, bold && styles.definedTerm, { marginBottom: ctx.spacing }]}
      numberOfLines={ctx.numberOfLines}
    >
      {renderInline(children, [], key)}
    </Text>
  );
}

export interface HtmlTextProps {
  html?: string | null;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  paragraphSpacing?: number;
  numberOfLines?: number;
}

export default function HtmlText({ html, style, containerStyle, paragraphSpacing = 10, numberOfLines }: HtmlTextProps) {
  const nodes = useMemo(() => parseHtml(html || ''), [html]);

  const blocks = useMemo(() => {
    if (!nodes.length) return [];
    return renderBlocks(nodes, { style, spacing: paragraphSpacing, numberOfLines });
  }, [nodes, style, paragraphSpacing, numberOfLines]);

  if (!blocks.length) return null;

  if (blocks.length === 1) {
    const only = blocks[0];
    if (React.isValidElement<{ style?: StyleProp<TextStyle> }>(only)) {
      const innerStyle = only.props.style;
      if (innerStyle) {
        return React.cloneElement(only, { style: [innerStyle, { marginBottom: 0 }] });
      }
    }
    return only as React.ReactElement;
  }

  return <View style={containerStyle}>{blocks}</View>;
}

const styles = StyleSheet.create({
  heading: { fontWeight: '700' },
  link: { color: COLORS.oceanBlue, textDecorationLine: 'underline' },
  hr: { height: 1, backgroundColor: COLORS.border, marginVertical: 10 },
  list: { marginBottom: 10 },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  marker: { width: 22, fontSize: 14 },
  listBody: { flex: 1 },
  quote: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.oceanBlue,
    paddingLeft: 10,
    marginBottom: 10,
  },
  pre: { fontFamily: 'monospace', backgroundColor: COLORS.gray[100], padding: 8, borderRadius: 6 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tableCell: { flex: 1, padding: 6 },
  tableHead: { fontWeight: '700', backgroundColor: COLORS.gray[100] },
  definedTerm: { fontWeight: '700' },
  altText: { fontSize: 12, color: COLORS.textSecondary, fontStyle: 'italic', marginVertical: 8 },
});
