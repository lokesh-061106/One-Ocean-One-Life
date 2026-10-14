"""Allow-list HTML sanitiser used by the CMS / guides rich text editors."""

import re
from html import escape
from html.parser import HTMLParser

ALLOWED_TAGS = {
    "p", "br", "hr", "div", "span",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "strong", "b", "em", "i", "u", "s", "del", "ins", "mark", "small", "sub", "sup",
    "ul", "ol", "li", "dl", "dt", "dd",
    "blockquote", "pre", "code", "kbd", "samp", "var",
    "a", "img", "figure", "figcaption",
    "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption", "colgroup", "col",
    "section", "article", "aside", "header", "footer", "nav", "main",
}

ALLOWED_ATTRS = {
    "*": {"class", "id", "title", "lang", "dir"},
    "a": {"href", "target", "rel"},
    "img": {"src", "alt", "width", "height"},
    "td": {"colspan", "rowspan", "align"},
    "th": {"colspan", "rowspan", "align", "scope"},
    "col": {"span"},
    "colgroup": {"span"},
    "ol": {"start", "type"},
    "li": {"value"},
}

DROP_CONTENT_TAGS = {
    "script", "style", "iframe", "object", "embed", "form", "input", "button",
    "select", "option", "textarea", "svg", "math", "canvas", "template", "noscript",
    "link", "meta", "base", "title", "head",
}

SAFE_SCHEMES = ("http://", "https://", "mailto:", "tel:")
_URL_SCHEME_RE = re.compile(r"^[a-zA-Z][a-zA-Z0-9+.\-]*:")


def is_safe_url(url):
    """Allow http(s)/mailto/tel plus relative, anchor and query URLs."""
    if not url:
        return False
    value = url.strip()
    if not value:
        return False
    if _URL_SCHEME_RE.match(value):
        return value.lower().startswith(SAFE_SCHEMES)
    return not value.startswith("//")


class _HTMLSanitizer(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.output = []
        self.open_tags = []
        self.skip_depth = 0

    def handle_starttag(self, tag, attrs):
        if self.skip_depth:
            if tag in DROP_CONTENT_TAGS:
                self.skip_depth += 1
            return
        if tag in DROP_CONTENT_TAGS:
            self.skip_depth = 1
            return
        if tag not in ALLOWED_TAGS:
            return
        cleaned = []
        allowed = ALLOWED_ATTRS.get(tag, set()) | ALLOWED_ATTRS["*"]
        for name, value in attrs:
            name = (name or "").lower()
            if name.startswith("on") or name in {"style", "srcset", "formaction", "action"}:
                continue
            if name not in allowed:
                continue
            if name in {"href", "src"} and not is_safe_url(value or ""):
                continue
            cleaned.append((name, value or ""))
        if tag in {"br", "hr", "img"}:
            self.output.append("<%s%s>" % (tag, self._attrs(cleaned)))
            return
        self.output.append("<%s%s>" % (tag, self._attrs(cleaned)))
        self.open_tags.append(tag)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag in ALLOWED_TAGS and tag not in {"br", "hr", "img"} and self.open_tags:
            if self.open_tags[-1] == tag:
                self.output.append("</%s>" % self.open_tags.pop())

    def handle_endtag(self, tag):
        if self.skip_depth:
            if tag in DROP_CONTENT_TAGS:
                self.skip_depth -= 1
            return
        if tag not in ALLOWED_TAGS or tag not in self.open_tags:
            return
        while self.open_tags:
            current = self.open_tags.pop()
            self.output.append("</%s>" % current)
            if current == tag:
                break

    def handle_data(self, data):
        if self.skip_depth or not data:
            return
        self.output.append(escape(data, quote=False))

    def close(self):
        super().close()
        while self.open_tags:
            self.output.append("</%s>" % self.open_tags.pop())

    @staticmethod
    def _attrs(attrs):
        if not attrs:
            return ""
        parts = ['%s="%s"' % (name, escape(value, quote=True)) for name, value in attrs]
        return " " + " ".join(parts)


def sanitize_html(value):
    """Return markup limited to a safe, presentation-only tag set."""
    if not value or not isinstance(value, str):
        return value or ""
    if "<" not in value:
        return value.strip()
    parser = _HTMLSanitizer()
    parser.feed(value)
    parser.close()
    return "".join(parser.output).strip()

