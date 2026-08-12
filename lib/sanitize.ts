import "server-only";

import sanitizeHtml from "sanitize-html";

export function sanitizePostHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "strong", "em", "s", "h1", "h2", "h3", "blockquote", "ul", "ol", "li", "pre", "code", "hr"],
    allowedAttributes: {},
    disallowedTagsMode: "discard",
    enforceHtmlBoundary: true,
  });
}
