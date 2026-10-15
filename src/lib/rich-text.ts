import * as cheerio from "cheerio";
import { isTag } from "domhandler";

const ALLOWED_TAGS = new Set([
  "p", "div", "br", "strong", "b", "em", "i", "u", "h2", "h3",
  "ul", "ol", "li", "blockquote", "a",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td",
]);

export function sanitizeRichText(input: string): string {
  const $ = cheerio.load(input, null, false);
  $("script, style, iframe, object, embed, form, input, button").remove();

  $("*").each((_, element) => {
    if (!isTag(element)) return;
    const tag = element.tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) {
      $(element).replaceWith($(element).contents());
      return;
    }

    const href = tag === "a" ? element.attribs.href : undefined;
    const tableWrapper = tag === "div" && element.attribs.class?.split(/\s+/).includes("tableWrapper");
    const colspan = element.attribs.colspan;
    const rowspan = element.attribs.rowspan;
    for (const attribute of Object.keys(element.attribs)) $(element).removeAttr(attribute);
    if (tableWrapper) $(element).attr({ class: "tableWrapper", role: "region", "aria-label": "Tabula", tabindex: "0" });
    if (tag === "td" || tag === "th") {
      for (const [name, value] of [["colspan", colspan], ["rowspan", rowspan]] as const) {
        if (value && /^\d{1,2}$/.test(value) && Number(value) >= 1 && Number(value) <= 50) $(element).attr(name, value);
      }
      if (tag === "th") $(element).attr("scope", "col");
    }
    if (tag !== "a") return;
    // Preserve local links without allowing protocol-relative or script URLs.
    const localLink = href && /^(\/(?!\/)|#)/.test(href) && !/[\\\s\u0000-\u001f]/.test(href);
    if (!href || (!localLink && !/^(https?:\/\/|mailto:|tel:)/i.test(href))) {
      $(element).replaceWith($(element).contents());
      return;
    }
    $(element).attr("href", href);
    if (!localLink) $(element).attr({ rel: "noopener noreferrer", target: "_blank" });
  });

  // Also contain pasted tables that did not come from the editor's wrapper.
  $("table").each((_, table) => {
    if (!$(table).parent().hasClass("tableWrapper")) $(table).wrap('<div class="tableWrapper" role="region" aria-label="Tabula" tabindex="0"></div>');
  });
  return $.html().trim();
}

export function richTextHasContent(html: string): boolean {
  return cheerio.load(html, null, false).text().replace(/\u00a0/g, " ").trim().length > 0;
}
