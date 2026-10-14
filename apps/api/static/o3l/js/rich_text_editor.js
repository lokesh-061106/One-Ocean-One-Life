/**
 * O3L admin rich text editor.
 * Progressive enhancement: every textarea.o3l-richtext-source becomes a
 * WYSIWYG editor whose HTML is synced back into the textarea on submit.
 */
(function () {
  "use strict";

  var ALLOWED = [
    "P", "BR", "HR", "DIV", "SPAN",
    "H1", "H2", "H3", "H4", "H5", "H6",
    "STRONG", "B", "EM", "I", "U", "S", "DEL", "INS", "MARK", "SMALL", "SUB", "SUP",
    "UL", "OL", "LI", "DL", "DT", "DD",
    "BLOCKQUOTE", "PRE", "CODE", "KBD", "SAMP", "VAR",
    "A", "IMG", "FIGURE", "FIGCAPTION",
    "TABLE", "THEAD", "TBODY", "TFOOT", "TR", "TH", "TD", "CAPTION", "COLGROUP", "COL",
    "SECTION", "ARTICLE", "ASIDE", "HEADER", "FOOTER", "NAV", "MAIN"
  ];
  var ALLOWED_SET = {};
  ALLOWED.forEach(function (t) { ALLOWED_SET[t] = true; });
  var VOID_TAGS = { BR: true, HR: true, IMG: true, COL: true };
  var GLOBAL_ATTRS = ["class", "id", "title", "lang", "dir"];
  var TAG_ATTRS = {
    A: ["href", "target", "rel"],
    IMG: ["src", "alt", "width", "height"],
    TD: ["colspan", "rowspan", "align"],
    TH: ["colspan", "rowspan", "align", "scope"],
    COL: ["span"],
    COLGROUP: ["span"],
    OL: ["start", "type"],
    LI: ["value"]
  };

  var SCHEME_RE = /^[a-zA-Z][a-zA-Z0-9+.\-]*:/;
  var SAFE_SCHEMES = ["http://", "https://", "mailto:", "tel:"];

  function safeUrl(value) {
    if (!value) return false;
    var v = String(value).trim();
    if (!v) return false;
    if (SCHEME_RE.test(v)) {
      var lower = v.toLowerCase();
      return SAFE_SCHEMES.some(function (p) { return lower.indexOf(p) === 0; });
    }
    return v.indexOf("//") !== 0;
  }

  function sanitizeElement(root) {
    var nodes = Array.prototype.slice.call(root.querySelectorAll("*"));
    nodes.forEach(function (el) {
      var tag = el.tagName;
      if (!ALLOWED_SET[tag]) {
        if (VOID_TAGS[tag] || !el.parentNode) {
          if (el.parentNode) el.parentNode.removeChild(el);
          return;
        }
        var parent = el.parentNode;
        while (el.firstChild) parent.insertBefore(el.firstChild, el);
        parent.removeChild(el);
        return;
      }
      var allowed = (TAG_ATTRS[tag] || []).concat(GLOBAL_ATTRS);
      Array.prototype.slice.call(el.attributes).forEach(function (attr) {
        var name = attr.name.toLowerCase();
        var keep = allowed.indexOf(name) !== -1 && name.indexOf("on") !== 0 && name !== "style";
        if (keep && (name === "href" || name === "src")) keep = safeUrl(attr.value);
        if (!keep) el.removeAttribute(attr.name);
      });
      if (tag === "A") {
        el.setAttribute("rel", "noopener noreferrer");
      }
      if (tag === "IMG" && !safeUrl(el.getAttribute("src") || "")) {
        if (el.parentNode) el.parentNode.removeChild(el);
      }
    });
  }

  function getCookie(name) {
    var match = document.cookie.match(new RegExp("(^|;\\s*)" + name + "=([^;]*)"));
    return match ? decodeURIComponent(match[2]) : "";
  }

  function uploadImage(file, done) {
    var form = new FormData();
    form.append("file", file);
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/v1/media/upload/");
    xhr.setRequestHeader("X-CSRFToken", getCookie("csrftoken") || "");
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          done(null, JSON.parse(xhr.responseText).url);
        } catch (e) {
          done("unexpected upload response");
        }
      } else if (xhr.status === 400) {
        var msg = "upload rejected";
        try {
          msg = JSON.parse(xhr.responseText).error || msg;
        } catch (e) {}
        done(msg);
      } else if (xhr.status === 401 || xhr.status === 403) {
        done("not authorised - sign in to the admin again");
      } else {
        done("upload failed (" + xhr.status + ")");
      }
    };
    xhr.onerror = function () { done("network error"); };
    xhr.send(form);
  }

  var BUTTONS = [
    { type: "select", options: [["p", "Paragraph"], ["h2", "Heading 2"], ["h3", "Heading 3"], ["h4", "Heading 4"]] },
    { type: "sep" },
    { cmd: "bold", label: "B", title: "Bold", style: "font-weight:700" },
    { cmd: "italic", label: "I", title: "Italic", style: "font-style:italic" },
    { cmd: "underline", label: "U", title: "Underline", style: "text-decoration:underline" },
    { cmd: "strikeThrough", label: "S", title: "Strikethrough", style: "text-decoration:line-through" },
    { type: "sep" },
    { cmd: "insertUnorderedList", label: "\u2022 \u2013", title: "Bullet list" },
    { cmd: "insertOrderedList", label: "1.", title: "Numbered list" },
    { cmd: "outdent", label: "\u00ab", title: "Decrease indent" },
    { cmd: "indent", label: "\u00bb", title: "Increase indent" },
    { type: "sep" },
    { action: "link", label: "Link", title: "Insert link" },
    { action: "unlink", label: "Unlink", title: "Remove link" },
    { cmd: "formatBlock", arg: "blockquote", label: "\u201C", title: "Blockquote" },
    { cmd: "formatBlock", arg: "pre", label: "</>", title: "Code block" },
    { type: "sep" },
    { action: "image", label: "\u25A3", title: "Upload image" },
    { cmd: "removeFormat", label: "Tx", title: "Clear formatting" },
    { type: "sep" },
    { cmd: "undo", label: "\u21B6", title: "Undo" },
    { cmd: "redo", label: "\u21B7", title: "Redo" },
    { type: "sep" },
    { action: "source", label: "</>", title: "Toggle HTML source" }
  ];

  function exec(cmd, arg) {
    document.execCommand(cmd, false, arg === undefined ? null : arg);
  }

  function formatBlock(tag) {
    try {
      exec("formatBlock", "<" + tag + ">");
    } catch (e) {
      exec("formatBlock", tag);
    }
  }

  function currentBlock(surface) {
    var sel = window.getSelection();
    if (!sel || !sel.anchorNode) return "p";
    var node = sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentNode;
    while (node && node !== surface) {
      var name = node.nodeName.toLowerCase();
      if (name === "h1" || name === "h2" || name === "h3" || name === "h4" || name === "h5" || name === "h6") return name;
      if (name === "blockquote" || name === "pre") return name;
      node = node.parentNode;
    }
    return "p";
  }

  function upgrade(textarea) {
    if (!textarea || textarea.dataset.o3lRichtext === "1") return;
    textarea.dataset.o3lRichtext = "1";

    var wrap = document.createElement("div");
    wrap.className = "o3l-richtext";

    var toolbar = document.createElement("div");
    toolbar.className = "o3l-richtext-toolbar";
    toolbar.setAttribute("role", "toolbar");
    toolbar.setAttribute("aria-label", "Rich text editor");

    var surface = document.createElement("div");
    surface.className = "o3l-richtext-surface";
    surface.contentEditable = "true";
    surface.setAttribute("role", "textbox");
    surface.setAttribute("aria-multiline", "true");
    surface.spellcheck = true;
    surface.innerHTML = textarea.value || "";

    var blockSelect = null;
    var sourceBtn = null;

    function sync() {
      textarea.value = surface.innerHTML;
      textarea.dispatchEvent(new Event("change", { bubbles: true }));
    }

    function refreshBlockSelect() {
      if (blockSelect) blockSelect.value = currentBlock(surface);
    }

    var savedRange = null;

    function saveRange() {
      var sel = window.getSelection();
      if (sel && sel.rangeCount && surface.contains(sel.anchorNode)) {
        savedRange = sel.getRangeAt(0);
      }
    }

    function restoreRange() {
      surface.focus();
      if (!savedRange) return;
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedRange);
    }

    function insertImageSrc(src, alt) {
      restoreRange();
      exec("insertImage", src);
      var sel = window.getSelection();
      if (sel && sel.anchorNode) {
        var node = sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentNode;
        if (node && node.nodeName === "IMG") node.setAttribute("alt", alt || "");
      }
      sync();
      refreshBlockSelect();
    }

    var fileInput = document.createElement("input");
    var pendingAlt = "";
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);
    fileInput.addEventListener("change", function () {
      var file = fileInput.files && fileInput.files[0];
      fileInput.value = "";
      if (!file) return;
      pendingAlt = file.name.replace(/\.[^.]+$/, "");
      uploadImage(file, function (err, url) {
        if (err) {
          alert("Image upload failed: " + err);
          return;
        }
        insertImageSrc(url, pendingAlt);
      });
    });

    BUTTONS.forEach(function (def) {
      if (def.type === "sep") {
        var sep = document.createElement("span");
        sep.className = "o3l-richtext-sep";
        toolbar.appendChild(sep);
        return;
      }
      if (def.type === "select") {
        blockSelect = document.createElement("select");
        blockSelect.className = "o3l-richtext-select";
        blockSelect.setAttribute("aria-label", "Text style");
        def.options.forEach(function (opt) {
          var o = document.createElement("option");
          o.value = opt[0];
          o.textContent = opt[1];
          blockSelect.appendChild(o);
        });
        blockSelect.addEventListener("mousedown", function (e) { e.preventDefault(); });
        blockSelect.addEventListener("change", function () {
          surface.focus();
          formatBlock(blockSelect.value);
          sync();
        });
        toolbar.appendChild(blockSelect);
        return;
      }

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "o3l-richtext-btn";
      btn.innerHTML = def.label;
      btn.title = def.title;
      btn.setAttribute("aria-label", def.title);
      if (def.style) btn.setAttribute("style", def.style);
      btn.addEventListener("mousedown", function (e) { e.preventDefault(); });
      btn.addEventListener("click", function () {
        surface.focus();
        if (def.action === "link") {
          var url = window.prompt("Link URL (https://…)", "https://");
          if (url && safeUrl(url)) exec("createLink", url);
        } else if (def.action === "unlink") {
          exec("unlink");
        } else if (def.action === "image") {
          saveRange();
          fileInput.click();
        } else if (def.action === "source") {
          var showingSource = wrap.classList.toggle("o3l-richtext-shows-source");
          textarea.classList.toggle("o3l-richtext-hidden", !showingSource);
          surface.classList.toggle("o3l-richtext-hidden", showingSource);
          if (showingSource) {
            textarea.focus();
          } else {
            surface.innerHTML = textarea.value;
            surface.focus();
          }
          if (sourceBtn) sourceBtn.classList.toggle("o3l-richtext-btn-active", showingSource);
          return;
        } else if (def.cmd === "formatBlock") {
          formatBlock(def.arg);
        } else {
          exec(def.cmd, def.arg);
        }
        sync();
        refreshBlockSelect();
      });
      if (def.action === "source") sourceBtn = btn;
      toolbar.appendChild(btn);
    });

    wrap.appendChild(toolbar);
    wrap.appendChild(surface);

    textarea.parentNode.insertBefore(wrap, textarea);
    textarea.classList.add("o3l-richtext-hidden");

    surface.addEventListener("input", function () {
      sync();
      refreshBlockSelect();
    });
    surface.addEventListener("blur", sync);
    surface.addEventListener("keyup", function () { refreshBlockSelect(); saveRange(); });
    surface.addEventListener("mouseup", function () { refreshBlockSelect(); saveRange(); });
    surface.addEventListener("paste", function (e) {
      var files = e.clipboardData && e.clipboardData.files;
      if (files && files.length) {
        var image = null;
        for (var i = 0; i < files.length; i++) {
          if ((files[i].type || "").indexOf("image/") === 0) { image = files[i]; break; }
        }
        if (image) {
          e.preventDefault();
          saveRange();
          uploadImage(image, function (err, url) {
            if (err) {
              alert("Image paste failed: " + err);
              return;
            }
            insertImageSrc(url, image.name ? image.name.replace(/\.[^.]+$/, "") : "");
          });
          return;
        }
      }
      e.preventDefault();
      var html = e.clipboardData ? e.clipboardData.getData("text/html") : "";
      var text = e.clipboardData ? e.clipboardData.getData("text/plain") : "";
      if (html) {
        var holder = document.createElement("div");
        holder.innerHTML = html;
        sanitizeElement(holder);
        exec("insertHTML", holder.innerHTML);
      } else {
        exec("insertText", text);
      }
      sync();
    });

    var form = textarea.form;
    if (form && !form.dataset.o3lRichtextBound) {
      form.dataset.o3lRichtextBound = "1";
      form.addEventListener("submit", function () {
        Array.prototype.forEach.call(form.querySelectorAll("textarea.o3l-richtext-source"), function (ta) {
          var holder = ta.previousElementSibling;
          if (holder && holder.classList.contains("o3l-richtext")) {
            var editable = holder.querySelector(".o3l-richtext-surface");
            if (editable && !holder.classList.contains("o3l-richtext-shows-source")) {
              sanitizeElement(editable);
              ta.value = editable.innerHTML;
            }
          }
        });
      });
    }
  }

  function initAll() {
    Array.prototype.forEach.call(document.querySelectorAll("textarea.o3l-richtext-source"), upgrade);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }

  if (window.MutationObserver) {
    var observer = new MutationObserver(function () { initAll(); });
    document.addEventListener("DOMContentLoaded", function () {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }
})();
