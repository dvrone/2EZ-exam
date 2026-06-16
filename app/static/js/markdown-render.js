/**
 * markdown-render.js
 * Python markdown server tomonda HTML ga aylantiradi.
 * Bu fayl faqat highlight.js va KaTeX ni ishga tushiradi.
 */

function applyRendering(container) {
  try {
    if (window.hljs) {
      // Faqat pre ichidagi code highlight bo'lsin
      container.querySelectorAll("pre code").forEach((block) => {
        hljs.highlightElement(block);
      });
    }
  } catch (e) {}

  try {
    if (window.renderMathInElement) {
      renderMathInElement(container, {
        delimiters: [
          { left: "\\[", right: "\\]", display: true },
          { left: "\\(", right: "\\)", display: false },
        ],
        ignoredTags: ["script", "noscript", "style", "textarea", "pre"],
        throwOnError: false,
      });
    }
  } catch (e) {}
}

function renderInto(element, html) {
  element.innerHTML = html;
  applyRendering(element);
}