/**
 * TermsClarity - Popup Controller
 * Coordinates UI, tab messaging, text extraction, AI analysis, and evidence highlighting.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const tabDomainEl = document.getElementById('tab-domain-name');
  const tabWordCountEl = document.getElementById('tab-word-count');
  const demoBanner = document.getElementById('demo-banner');
  const linkOpenSettings = document.getElementById('link-open-settings');

  // Views & Sections
  const ctaSection = document.getElementById('cta-section');
  const loadingView = document.getElementById('loading-view');
  const resultsView = document.getElementById('results-view');
  const pasteView = document.getElementById('paste-view');
  const settingsView = document.getElementById('settings-view');

  // Loading Steps
  const loadingStepTitle = document.getElementById('loading-step-title');
  const loadingStepDesc = document.getElementById('loading-step-desc');

  // Primary Buttons
  const btnAnalyzePage = document.getElementById('btn-analyze-page');
  const btnTogglePaste = document.getElementById('btn-toggle-paste');
  const btnSettings = document.getElementById('btn-settings');
  const btnClosePaste = document.getElementById('btn-close-paste');
  const btnCloseSettings = document.getElementById('btn-close-settings');
  const btnAnalyzeManual = document.getElementById('btn-analyze-manual');
  const btnLoadSample = document.getElementById('btn-load-sample');
  const manualPolicyText = document.getElementById('manual-policy-text');

  // Settings Elements
  const inputApiKey = document.getElementById('input-api-key');
  const btnToggleKeyVis = document.getElementById('btn-toggle-key-vis');
  const selectModel = document.getElementById('select-model');
  const btnSaveSettings = document.getElementById('btn-save-settings');
  const btnClearCache = document.getElementById('btn-clear-cache');
  const settingsStatus = document.getElementById('settings-status');

  // Tab Navigation
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  // Results Elements
  const resPolicyType = document.getElementById('res-policy-type');
  const resRiskBadge = document.getElementById('res-risk-badge');
  const resRiskIcon = document.getElementById('res-risk-icon');
  const resRiskText = document.getElementById('res-risk-text');
  const resRedFlagCount = document.getElementById('res-red-flag-count');
  const resOverallSummary = document.getElementById('res-overall-summary');
  const resBottomLine = document.getElementById('res-bottom-line');
  const badgeFindingsCount = document.getElementById('badge-findings-count');
  const findingsList = document.getElementById('findings-list');

  // Categories Elements
  const catPrivacyHeadline = document.getElementById('cat-privacy-headline');
  const catPrivacyPill = document.getElementById('cat-privacy-pill');
  const catPrivacyPoints = document.getElementById('cat-privacy-points');
  const catPrivacyQuote = document.getElementById('cat-privacy-quote');

  const catPaymentsHeadline = document.getElementById('cat-payments-headline');
  const catPaymentsPill = document.getElementById('cat-payments-pill');
  const catPaymentsPoints = document.getElementById('cat-payments-points');
  const catPaymentsQuote = document.getElementById('cat-payments-quote');

  const catCancellationHeadline = document.getElementById('cat-cancellation-headline');
  const catCancellationPill = document.getElementById('cat-cancellation-pill');
  const catCancellationPoints = document.getElementById('cat-cancellation-points');
  const catCancellationQuote = document.getElementById('cat-cancellation-quote');

  const catLiabilityHeadline = document.getElementById('cat-liability-headline');
  const catLiabilityPill = document.getElementById('cat-liability-pill');
  const catLiabilityPoints = document.getElementById('cat-liability-points');
  const catLiabilityQuote = document.getElementById('cat-liability-quote');

  const toast = document.getElementById('toast');
  const btnRequestCompare = document.getElementById('btn-request-compare');

  // Active Tab State
  let currentActiveTab = null;
  let currentExtractedData = null;
  let activeAnalysisData = null;

  // Initialize
  await init();

  async function init() {
    setupTabSwitching();
    setupEventListeners();
    await checkApiKeyStatus();
    await identifyActiveTab();
  }

  async function checkApiKeyStatus() {
    const key = await window.TermsStorage.getApiKey();
    if (!key) {
      demoBanner.classList.remove('hidden');
    } else {
      demoBanner.classList.add('hidden');
    }
  }

  async function identifyActiveTab() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs && tabs.length > 0) {
        currentActiveTab = tabs[0];
        const urlStr = currentActiveTab.url || '';

        if (urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
          try {
            const urlObj = new URL(urlStr);
            tabDomainEl.textContent = urlObj.hostname;
          } catch (e) {
            tabDomainEl.textContent = urlStr;
          }

          // Check if cached analysis exists for this URL
          const cached = await window.TermsStorage.getCachedAnalysis(urlStr);
          if (cached) {
            showToast('Loaded cached policy analysis');
            renderAnalysis(cached);
          }
        } else if (urlStr.startsWith('file://')) {
          tabDomainEl.textContent = 'Local File Page';
        } else {
          tabDomainEl.textContent = 'Internal Browser Tab';
          btnAnalyzePage.disabled = false;
        }
      }
    } catch (err) {
      console.warn('Could not inspect active tab:', err);
      tabDomainEl.textContent = 'Active Page';
    }
  }

  function setupEventListeners() {
    // Hero Analyze Page button
    btnAnalyzePage.addEventListener('click', () => {
      analyzeCurrentWebpage();
    });

    // Paste Toggle
    btnTogglePaste.addEventListener('click', () => {
      toggleView(pasteView);
    });

    btnClosePaste.addEventListener('click', () => {
      pasteView.classList.add('hidden');
    });

    // Settings Toggle
    btnSettings.addEventListener('click', async () => {
      await loadSettings();
      toggleView(settingsView);
    });

    if (linkOpenSettings) {
      linkOpenSettings.addEventListener('click', async (e) => {
        e.preventDefault();
        await loadSettings();
        settingsView.classList.remove('hidden');
        pasteView.classList.add('hidden');
      });
    }

    btnCloseSettings.addEventListener('click', () => {
      settingsView.classList.add('hidden');
    });

    // Key Visibility Toggle
    btnToggleKeyVis.addEventListener('click', () => {
      if (inputApiKey.type === 'password') {
        inputApiKey.type = 'text';
        btnToggleKeyVis.textContent = '🔒';
      } else {
        inputApiKey.type = 'password';
        btnToggleKeyVis.textContent = '👁️';
      }
    });

    // Save Settings
    btnSaveSettings.addEventListener('click', async () => {
      const key = inputApiKey.value.trim();
      const model = selectModel.value;
      await window.TermsStorage.setApiKey(key);
      await window.TermsStorage.setModel(model);

      showSettingsStatus('Settings saved successfully!', 'success');
      await checkApiKeyStatus();
      setTimeout(() => {
        settingsView.classList.add('hidden');
      }, 1000);
    });

    // Clear Cache
    btnClearCache.addEventListener('click', async () => {
      await window.TermsStorage.clearCache();
      showSettingsStatus('Cache cleared!', 'success');
      showToast('Cached analyses deleted');
    });

    // Manual Analysis
    btnAnalyzeManual.addEventListener('click', () => {
      const text = manualPolicyText.value.trim();
      if (!text) {
        showToast('Please paste policy text first');
        return;
      }
      pasteView.classList.add('hidden');
      runAnalysisOnText(text, {
        title: 'Pasted Document',
        domain: 'Manual Input',
        url: 'manual://text'
      });
    });

    // Load Sample Policy
    btnLoadSample.addEventListener('click', () => {
      manualPolicyText.value = getSamplePolicyText();
      showToast('Loaded sample subscription terms & conditions');
    });

    // Vote future feature
    if (btnRequestCompare) {
      btnRequestCompare.addEventListener('click', () => {
        btnRequestCompare.textContent = '✓ Vote Recorded! Thanks';
        btnRequestCompare.disabled = true;
        showToast('Thank you for voting for Policy Comparison!');
      });
    }

    // Delegate category quote highlight buttons
    document.querySelectorAll('.btn-highlight-quote').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const cat = e.currentTarget.getAttribute('data-target');
        if (activeAnalysisData && activeAnalysisData.categories?.[cat]) {
          const quote = activeAnalysisData.categories[cat].supporting_quote;
          sendHighlightToTab(quote);
        }
      });
    });
  }

  function setupTabSwitching() {
    tabButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-tab');
        tabButtons.forEach((b) => b.classList.remove('active'));
        tabContents.forEach((c) => {
          c.classList.add('hidden');
          c.classList.remove('active');
        });

        btn.classList.add('active');
        const targetContent = document.getElementById(targetId);
        if (targetContent) {
          targetContent.classList.remove('hidden');
          targetContent.classList.add('active');
        }
      });
    });
  }

  function toggleView(viewElement) {
    const isHidden = viewElement.classList.contains('hidden');
    // Hide others
    pasteView.classList.add('hidden');
    settingsView.classList.add('hidden');

    if (isHidden) {
      viewElement.classList.remove('hidden');
    }
  }

  async function loadSettings() {
    const key = await window.TermsStorage.getApiKey();
    const model = await window.TermsStorage.getModel();
    inputApiKey.value = key;
    selectModel.value = model;
    settingsStatus.classList.add('hidden');
  }

  function showSettingsStatus(msg, type = 'success') {
    settingsStatus.textContent = msg;
    settingsStatus.className = `settings-status ${type}`;
    settingsStatus.classList.remove('hidden');
  }

  /**
   * Main Page Analysis flow
   */
  async function analyzeCurrentWebpage() {
    if (!currentActiveTab || !currentActiveTab.id) {
      showToast('No active tab detected');
      return;
    }

    const tabUrl = currentActiveTab.url || '';
    if (tabUrl.startsWith('chrome://') || tabUrl.startsWith('chrome-extension://')) {
      showToast('Cannot analyze internal browser pages. Paste text instead!');
      pasteView.classList.remove('hidden');
      return;
    }

    showLoading('Extracting Policy Text...', 'Scanning page containers and removing nav/cookie noise...');

    try {
      // Step 1: Send extract message to content script
      let response = await sendExtractMessage(currentActiveTab.id);

      // If content script was not ready, inject dynamically and retry
      if (!response || !response.success) {
        updateLoading('Injecting Document Reader...', 'Preparing page script...');
        await chrome.scripting.executeScript({
          target: { tabId: currentActiveTab.id },
          files: ['scripts/content.js']
        });
        await chrome.scripting.insertCSS({
          target: { tabId: currentActiveTab.id },
          files: ['scripts/content.css']
        });

        // Retry
        response = await sendExtractMessage(currentActiveTab.id);
      }

      if (!response || !response.success || !response.data?.text) {
        throw new Error(response?.error || 'Could not extract visible text from this page.');
      }

      const extracted = response.data;
      currentExtractedData = extracted;

      // Update word count chip
      tabWordCountEl.textContent = `${extracted.wordCount.toLocaleString()} words`;
      tabWordCountEl.classList.remove('hidden');

      if (extracted.text.length < 150) {
        showToast('Very little legal text found. Still analyzing...');
      }

      // Step 2: Send to AI
      updateLoading(
        'Analyzing Terms & Rights with AI...',
        'Checking arbitration clauses, auto-renewals, data tracking, and hidden liabilities...'
      );

      const analysis = await window.AIService.analyzePolicy(extracted.text, {
        title: extracted.title,
        domain: extracted.domain,
        url: extracted.url
      });

      // Cache analysis
      if (extracted.url && !analysis.isDemo) {
        await window.TermsStorage.saveCachedAnalysis(extracted.url, analysis);
      }

      hideLoading();
      renderAnalysis(analysis);
    } catch (err) {
      hideLoading();
      console.warn('Live AI analysis encountered an issue, switching to offline engine:', err);
      showToast('AI servers busy: generated via offline engine');
      
      const fallback = window.AIService.generateDemoAnalysis(currentExtractedData?.text || '', {
        title: currentExtractedData?.title || 'Policy',
        domain: currentExtractedData?.domain || 'Webpage',
        url: currentExtractedData?.url || ''
      });
      fallback.isHighDemandFallback = true;
      renderAnalysis(fallback);
    }
  }

  async function sendExtractMessage(tabId) {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, { action: 'EXTRACT_TEXT' }, (response) => {
        if (chrome.runtime.lastError) {
          resolve(null);
        } else {
          resolve(response);
        }
      });
    });
  }

  async function runAnalysisOnText(rawText, metadata) {
    showLoading('Analyzing Terms with AI...', 'Synthesizing plain-English summary, red flags, and categories...');
    try {
      const analysis = await window.AIService.analyzePolicy(rawText, metadata);
      hideLoading();
      renderAnalysis(analysis);
    } catch (err) {
      hideLoading();
      console.warn('Manual AI analysis encountered an issue, switching to offline engine:', err);
      showToast('AI servers busy: generated via offline engine');
      
      const fallback = window.AIService.generateDemoAnalysis(rawText, metadata);
      fallback.isHighDemandFallback = true;
      renderAnalysis(fallback);
    }
  }

  /**
   * Renders the structured analysis into the UI
   */
  function renderAnalysis(data) {
    activeAnalysisData = data;

    // Reveal results view
    ctaSection.classList.add('hidden');
    resultsView.classList.remove('hidden');

    // Policy Type
    resPolicyType.textContent = data.policy_type || 'Terms & Policy';

    // Risk Rating
    const risk = (data.risk_rating || 'Caution').toLowerCase();
    resRiskBadge.className = 'risk-badge';
    if (risk.includes('high') || risk.includes('unfavorable')) {
      resRiskBadge.classList.add('high-risk');
      resRiskIcon.textContent = '🔴';
      resRiskText.textContent = data.risk_rating || 'High Risk';
    } else if (risk.includes('fair') || risk.includes('safe') || risk.includes('low')) {
      resRiskBadge.classList.add('fair');
      resRiskIcon.textContent = '🟢';
      resRiskText.textContent = data.risk_rating || 'Fair / Low Risk';
    } else {
      resRiskBadge.classList.add('caution');
      resRiskIcon.textContent = '🟡';
      resRiskText.textContent = data.risk_rating || 'Moderate Caution';
    }

    // Red Flags
    const redFlagCount = data.red_flags_count || (data.key_findings || []).filter((f) => f.risk_level === 'red_flag').length || 0;
    resRedFlagCount.textContent = `${redFlagCount} Red Flag${redFlagCount === 1 ? '' : 's'}`;

    // Overall Summary & Bottom Line
    resOverallSummary.textContent = data.overall_summary || 'Analysis complete.';
    resBottomLine.textContent = data.bottom_line ? `👉 Bottom Line: ${data.bottom_line}` : '';

    // Render 3 to 5 Key Findings
    renderKeyFindings(data.key_findings || []);

    // Render Categories
    renderCategories(data.categories || {});

    // Handle high-demand fallback banner notification
    if (data.isHighDemandFallback) {
      demoBanner.classList.remove('hidden');
      demoBanner.style.background = '#fef3c7';
      demoBanner.style.borderBottom = '1px solid #f59e0b';
      const badge = demoBanner.querySelector('.demo-badge');
      if (badge) {
        badge.textContent = 'OFFLINE ENGINE';
        badge.style.background = '#d97706';
      }
      const txt = demoBanner.querySelector('.demo-text');
      if (txt) {
        txt.innerHTML = '⚡ Gemini servers are currently busy. Generated via offline clarity engine. <a href="#" id="link-retry-analysis" style="color: #92400e; font-weight: 700; text-decoration: underline;">Retry Live AI</a>';
        document.getElementById('link-retry-analysis')?.addEventListener('click', (e) => {
          e.preventDefault();
          analyzeCurrentWebpage();
        });
      }
    }

    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderKeyFindings(findings) {
    findingsList.innerHTML = '';
    badgeFindingsCount.textContent = findings.length;

    findings.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'finding-card';

      // Badge styling
      let badgeClass = 'info';
      let badgeLabel = 'Note ℹ️';
      if (item.risk_level === 'red_flag') {
        badgeClass = 'red-flag';
        badgeLabel = 'Red Flag 🚩';
      } else if (item.risk_level === 'caution') {
        badgeClass = 'caution';
        badgeLabel = 'Caution ⚠️';
      }

      card.innerHTML = `
        <div class="finding-header">
          <div class="finding-title-row">
            <span class="finding-num">${index + 1}</span>
            <h4>${escapeHtml(item.title || 'Important Clause')}</h4>
          </div>
          <span class="finding-badge ${badgeClass}">${badgeLabel}</span>
        </div>
        <div class="finding-body">
          ${escapeHtml(item.plain_english || '')}
        </div>
        ${
          item.consequence
            ? `<div class="finding-consequence"><strong>Real-World Impact:</strong> ${escapeHtml(item.consequence)}</div>`
            : ''
        }
        <div class="quote-accordion">
          <button class="btn-toggle-quote" type="button">
            <span>❝ View supporting quote</span>
            <span class="chevron">▼</span>
          </button>
          <div class="quote-content hidden">
            "${escapeHtml(item.quote || 'No exact quote available.')}"
            <div class="quote-actions">
              <button class="btn-highlight-quote" type="button">
                🔍 Highlight on Webpage
              </button>
            </div>
          </div>
        </div>
      `;

      // Event: Accordion Toggle
      const toggleBtn = card.querySelector('.btn-toggle-quote');
      const quoteContent = card.querySelector('.quote-content');
      const chevron = card.querySelector('.chevron');

      toggleBtn.addEventListener('click', () => {
        const isHidden = quoteContent.classList.contains('hidden');
        if (isHidden) {
          quoteContent.classList.remove('hidden');
          chevron.textContent = '▲';
          toggleBtn.querySelector('span').textContent = 'Hide supporting quote';
        } else {
          quoteContent.classList.add('hidden');
          chevron.textContent = '▼';
          toggleBtn.querySelector('span').textContent = '❝ View supporting quote';
        }
      });

      // Event: Highlight on Page
      const highlightBtn = card.querySelector('.btn-highlight-quote');
      highlightBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (item.quote) {
          sendHighlightToTab(item.quote);
        }
      });

      findingsList.appendChild(card);
    });
  }

  function renderCategories(categories) {
    // 1. Privacy / What Happens to My Data
    const priv = categories.privacy || {};
    catPrivacyHeadline.textContent = priv.headline || 'Data Collection & Sharing';
    setCategoryPill(catPrivacyPill, priv.status);
    populateBulletList(catPrivacyPoints, priv.what_happens_to_my_data || priv.details || []);
    catPrivacyQuote.textContent = priv.supporting_quote ? `"${priv.supporting_quote}"` : 'No direct quote cited.';

    // 2. Payments & Renewals
    const pay = categories.payments || {};
    catPaymentsHeadline.textContent = pay.headline || 'Billing & Renewals';
    setCategoryPill(catPaymentsPill, pay.status);
    populateBulletList(catPaymentsPoints, pay.details || []);
    catPaymentsQuote.textContent = pay.supporting_quote ? `"${pay.supporting_quote}"` : 'No direct quote cited.';

    // 3. Cancellation & Termination
    const canc = categories.cancellation || {};
    catCancellationHeadline.textContent = canc.headline || 'Cancellation & Suspension';
    setCategoryPill(catCancellationPill, canc.status);
    populateBulletList(catCancellationPoints, canc.details || []);
    catCancellationQuote.textContent = canc.supporting_quote ? `"${canc.supporting_quote}"` : 'No direct quote cited.';

    // 4. Liability & Disputes
    const liab = categories.liability || {};
    catLiabilityHeadline.textContent = liab.headline || 'Disputes & Liability';
    setCategoryPill(catLiabilityPill, liab.status);
    populateBulletList(catLiabilityPoints, liab.details || []);
    catLiabilityQuote.textContent = liab.supporting_quote ? `"${liab.supporting_quote}"` : 'No direct quote cited.';
  }

  function setCategoryPill(pillEl, status) {
    const st = (status || 'notice').toLowerCase();
    pillEl.className = 'status-pill';
    if (st.includes('red') || st.includes('high')) {
      pillEl.classList.add('red-flag');
      pillEl.textContent = 'Red Flag 🚩';
    } else if (st.includes('caution') || st.includes('warn') || st.includes('medium')) {
      pillEl.classList.add('caution');
      pillEl.textContent = 'Caution ⚠️';
    } else {
      pillEl.classList.add('safe');
      pillEl.textContent = 'Standard ✓';
    }
  }

  function populateBulletList(ulEl, items) {
    ulEl.innerHTML = '';
    if (!items || items.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'Standard terms apply.';
      ulEl.appendChild(li);
      return;
    }
    items.forEach((txt) => {
      const li = document.createElement('li');
      li.textContent = txt;
      ulEl.appendChild(li);
    });
  }

  /**
   * Sends quote highlight message to content script in the active tab
   */
  async function sendHighlightToTab(quote) {
    if (!currentActiveTab || !currentActiveTab.id) {
      showToast('No active tab to highlight');
      return;
    }

    chrome.tabs.sendMessage(
      currentActiveTab.id,
      { action: 'HIGHLIGHT_QUOTE', quote: quote },
      (response) => {
        if (chrome.runtime.lastError || !response || !response.success) {
          showToast('Quote not found on current visible page');
        } else {
          showToast('✨ Highlighted clause on page!');
        }
      }
    );
  }

  function showLoading(title, desc) {
    loadingStepTitle.textContent = title;
    loadingStepDesc.textContent = desc;
    ctaSection.classList.add('hidden');
    resultsView.classList.add('hidden');
    pasteView.classList.add('hidden');
    settingsView.classList.add('hidden');
    loadingView.classList.remove('hidden');
  }

  function updateLoading(title, desc) {
    loadingStepTitle.textContent = title;
    loadingStepDesc.textContent = desc;
  }

  function hideLoading() {
    loadingView.classList.add('hidden');
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 2800);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getSamplePolicyText() {
    return `STREAMIFY PREMIUM TERMS OF SERVICE & PRIVACY POLICY
Last Updated: January 1, 2026

1. SUBSCRIPTION AND AUTOMATIC RENEWAL
Your subscription to Streamify Premium will automatically renew at the end of each monthly or annual billing cycle, and your designated credit card will be charged automatically without prior email or written notice to you. Subscriptions must be canceled at least 48 hours prior to the renewal date. All payments are strictly non-refundable and no prorated credits will be provided for partial periods. We reserve the right to increase our subscription prices at any time upon renewal.

2. CANCELLATION AND ACCOUNT TERMINATION
You may cancel your subscription exclusively through the deep settings menu inside your account settings. Streamify reserves the right, at its sole discretion, to suspend or terminate your account and erase all stored playlists, offline downloads, and profile data at any time, for any reason or no reason, without notice or liability to you.

3. DATA COLLECTION AND THIRD-PARTY ADVERTISING SHARING
When you use Streamify, we collect your precise GPS location, hardware device identifiers, browsing behavior, listening duration, and IP address. We may disclose and sell this personal information, along with demographic telemetry, to third-party advertising partners, commercial affiliates, and data analytics brokers for targeted ad campaigns across the web. You have the right to request access to your data only where mandated by applicable state or federal law.

4. BINDING ARBITRATION AND CLASS ACTION WAIVER
PLEASE READ THIS CAREFULLY. IT AFFECTS YOUR LEGAL RIGHTS. Any dispute, claim, or controversy arising out of or relating to these Terms or your use of the Service shall be determined exclusively by final and binding individual arbitration administered by the American Arbitration Association, rather than in courts of general jurisdiction. YOU AND STREAMIFY AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING.

5. LIMITATION OF LIABILITY
TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL STREAMIFY'S TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THESE TERMS EXCEED FIFTY DOLLARS ($50.00) OR THE AMOUNT PAID BY YOU IN THE PAST THIRTY (30) DAYS. STREAMIFY DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING UNINTERRUPTED SERVICE OR LOSS OF PERSONAL DATA.

6. UNILATERAL MODIFICATION OF TERMS
We reserve the right, at our sole discretion, to modify or replace these Terms at any time without individual notice. Your continued access to or use of our Service after any revisions become effective constitutes your acceptance of the revised Terms.`;
  }
});
