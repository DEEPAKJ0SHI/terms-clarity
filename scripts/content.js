/**
 * TermsClarity - Content Script
 * Extracts visible Terms & Conditions and Privacy Policy text from the active webpage,
 * and handles in-page evidence highlighting when the user inspects key findings.
 */

(function () {
  // Prevent duplicate execution if injected multiple times
  if (window.__termsClarityLoaded) {
    return;
  }
  window.__termsClarityLoaded = true;

  /**
   * Cleans and extracts the visible text from a DOM element.
   */
  function extractCleanText(rootNode) {
    // Clone node so we don't mutate the active page
    const clone = rootNode.cloneNode(true);

    // List of selectors for non-content / boilerplate elements to discard
    const unwantedSelectors = [
      'script',
      'style',
      'noscript',
      'svg',
      'canvas',
      'nav',
      'header',
      'footer',
      'aside',
      'form',
      'button',
      'input',
      'select',
      'textarea',
      '[role="navigation"]',
      '[role="banner"]',
      '[role="contentinfo"]',
      '[role="complementary"]',
      '#cookie-banner',
      '.cookie-banner',
      '[id*="cookie" i]',
      '[class*="cookie" i]',
      '[id*="consent" i]',
      '[class*="consent" i]',
      '[id*="modal" i]:not([id*="terms" i]):not([id*="privacy" i])',
      '[class*="modal" i]:not([class*="terms" i]):not([class*="privacy" i])',
      '.advertisement',
      '.ads',
      '.social-share',
      '.comments'
    ];

    unwantedSelectors.forEach((selector) => {
      try {
        const elements = clone.querySelectorAll(selector);
        elements.forEach((el) => el.remove());
      } catch (e) {
        // Ignore invalid selector in older engines
      }
    });

    // Replace headings and block elements with newline markers for cleaner parsing
    const blockTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'blockquote', 'tr', 'section'];
    blockTags.forEach((tag) => {
      const items = clone.querySelectorAll(tag);
      items.forEach((item) => {
        item.prepend(document.createTextNode('\n'));
        item.append(document.createTextNode('\n'));
      });
    });

    // Extract text
    let rawText = clone.innerText || clone.textContent || '';

    // Normalize whitespace while preserving linebreaks
    rawText = rawText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join('\n');

    return rawText;
  }

  /**
   * Finds the best content container on the page.
   */
  function findBestContentContainer() {
    const candidateSelectors = [
      'main',
      'article',
      '[role="main"]',
      '#terms-and-conditions',
      '#terms-of-service',
      '#privacy-policy',
      '#terms',
      '#privacy',
      '#legal-content',
      '#content',
      '#main-content',
      '.terms-and-conditions',
      '.terms-of-service',
      '.privacy-policy',
      '.legal-page',
      '.legal-content',
      '.policy-content',
      '.document-body',
      '.entry-content',
      '.article-body',
      '.post-content'
    ];

    for (const sel of candidateSelectors) {
      try {
        const el = document.querySelector(sel);
        if (el) {
          const txt = el.innerText || el.textContent || '';
          // Ensure it actually has enough text to be the real document (e.g. > 500 characters)
          if (txt.trim().length > 500) {
            return el;
          }
        }
      } catch (e) {
        // ignore
      }
    }

    return document.body;
  }

  /**
   * Main extraction entry point.
   */
  function extractPolicy() {
    const container = findBestContentContainer();
    const extractedText = extractCleanText(container);

    const title = document.title || 'Legal Document';
    const url = window.location.href;
    const domain = window.location.hostname;
    const charCount = extractedText.length;
    const wordCount = extractedText.split(/\s+/).filter(Boolean).length;

    // Smart truncation if text exceeds generous limit (~35,000 chars)
    let processedText = extractedText;
    const MAX_CHARS = 35000;
    if (processedText.length > MAX_CHARS) {
      // Keep first 25k chars and last 10k chars (covers intro, data, cancellation + liability at end)
      const head = processedText.slice(0, 25000);
      const tail = processedText.slice(-10000);
      processedText = `${head}\n\n[... Policy text truncated for AI analysis ...]\n\n${tail}`;
    }

    return {
      success: true,
      data: {
        text: processedText,
        fullTextLength: charCount,
        wordCount: wordCount,
        title: title,
        url: url,
        domain: domain,
        isTruncated: charCount > MAX_CHARS
      }
    };
  }

  /**
   * Evidence Highlighter: Finds text on page, highlights it, and scrolls to it.
   */
  function highlightQuote(quoteText) {
    clearHighlight();

    if (!quoteText || typeof quoteText !== 'string' || quoteText.trim().length < 5) {
      return { success: false, reason: 'Invalid or empty quote' };
    }

    const cleanQuote = quoteText.replace(/^["'“”‘’]|["'“”‘’]$/g, '').trim();

    // Strategy 1: Find elements containing a significant substring (first 10-15 words)
    const words = cleanQuote.split(/\s+/).slice(0, 12).join(' ');
    const searchTarget = words.length > 15 ? words : cleanQuote;

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function (node) {
          if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tag = parent.tagName.toLowerCase();
          if (['script', 'style', 'noscript', 'nav', 'header'].includes(tag)) {
            return NodeFilter.FILTER_REJECT;
          }
          return node.nodeValue.toLowerCase().includes(searchTarget.toLowerCase())
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_SKIP;
        }
      }
    );

    const matchedNode = walker.nextNode();

    if (matchedNode && matchedNode.parentElement) {
      const parent = matchedNode.parentElement;
      const textContent = matchedNode.nodeValue;
      const idx = textContent.toLowerCase().indexOf(searchTarget.toLowerCase());

      if (idx !== -1) {
        const span = document.createElement('mark');
        span.className = 'terms-clarity-highlight';
        span.setAttribute('id', 'terms-clarity-active-highlight');

        const badge = document.createElement('span');
        badge.className = 'terms-clarity-badge';
        badge.innerText = '🚩 TermsClarity Evidence';

        const matchedText = textContent.substr(idx, searchTarget.length);
        const afterText = textContent.substr(idx + searchTarget.length);
        const beforeText = textContent.substr(0, idx);

        matchedNode.nodeValue = beforeText;
        span.appendChild(badge);
        span.appendChild(document.createTextNode(matchedText));

        parent.insertBefore(span, matchedNode.nextSibling);
        if (afterText.length > 0) {
          parent.insertBefore(document.createTextNode(afterText), span.nextSibling);
        }

        span.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return { success: true, method: 'dom_walker' };
      }
    }

    // Strategy 2: Fallback to native window.find if available
    try {
      if (window.find && window.find(searchTarget, false, false, true, false, true, false)) {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const span = document.createElement('mark');
          span.className = 'terms-clarity-highlight';
          span.setAttribute('id', 'terms-clarity-active-highlight');
          try {
            range.surroundContents(span);
            span.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return { success: true, method: 'window_find' };
          } catch (e) {
            // Range overlaps multiple nodes, selection still works
            sel.anchorNode.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return { success: true, method: 'window_find_selected' };
          }
        }
      }
    } catch (e) {
      // window.find might fail in some contexts
    }

    return { success: false, reason: 'Quote not found in visible text' };
  }

  function clearHighlight() {
    const existing = document.querySelectorAll('.terms-clarity-highlight');
    existing.forEach((el) => {
      const parent = el.parentNode;
      if (parent) {
        // remove badge first
        const badge = el.querySelector('.terms-clarity-badge');
        if (badge) badge.remove();
        while (el.firstChild) {
          parent.insertBefore(el.firstChild, el);
        }
        parent.removeChild(el);
        parent.normalize();
      }
    });
  }

  // Listen for messages from popup or background scripts
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'EXTRACT_TEXT') {
      try {
        const result = extractPolicy();
        sendResponse(result);
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
      return true;
    } else if (request.action === 'HIGHLIGHT_QUOTE') {
      const res = highlightQuote(request.quote);
      sendResponse(res);
      return true;
    } else if (request.action === 'CLEAR_HIGHLIGHT') {
      clearHighlight();
      sendResponse({ success: true });
      return true;
    } else if (request.action === 'PING') {
      sendResponse({ status: 'ready', url: window.location.href });
      return true;
    }
  });
})();
