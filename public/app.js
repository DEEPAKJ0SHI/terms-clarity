document.addEventListener('DOMContentLoaded', () => {
  const policyInput = document.getElementById('policy-input');
  const charCount = document.getElementById('char-count');
  const btnAnalyze = document.getElementById('btn-analyze');
  const btnAnalyzeText = document.getElementById('btn-analyze-text');
  const spinner = document.getElementById('spinner');
  const resultsContainer = document.getElementById('results-container');

  const btnSampleSub = document.getElementById('btn-sample-subscription');
  const btnSamplePriv = document.getElementById('btn-sample-privacy');
  const btnClear = document.getElementById('btn-clear');

  // Results elements
  const resPolicyType = document.getElementById('res-policy-type');
  const resRiskPill = document.getElementById('res-risk-pill');
  const resRedFlags = document.getElementById('res-red-flags-count');
  const resOverallSummary = document.getElementById('res-overall-summary');
  const resBottomLine = document.getElementById('res-bottom-line');
  const findingsGrid = document.getElementById('findings-grid');

  const catPrivacyHead = document.getElementById('cat-privacy-head');
  const catPrivacyList = document.getElementById('cat-privacy-list');
  const catPaymentsHead = document.getElementById('cat-payments-head');
  const catPaymentsList = document.getElementById('cat-payments-list');
  const catCancellationHead = document.getElementById('cat-cancellation-head');
  const catCancellationList = document.getElementById('cat-cancellation-list');
  const catLiabilityHead = document.getElementById('cat-liability-head');
  const catLiabilityList = document.getElementById('cat-liability-list');

  policyInput.addEventListener('input', () => {
    charCount.textContent = `${policyInput.value.length.toLocaleString()} characters`;
  });

  btnClear.addEventListener('click', () => {
    policyInput.value = '';
    charCount.textContent = '0 characters';
    resultsContainer.classList.add('hidden');
  });

  btnSampleSub.addEventListener('click', () => {
    policyInput.value = `STREAMIFY PREMIUM TERMS OF SERVICE
1. SUBSCRIPTION AND AUTOMATIC RENEWAL
Your subscription to Streamify Premium will automatically renew at the end of each monthly or annual billing cycle, and your designated credit card will be charged automatically without prior email or written notice to you. Subscriptions must be canceled at least 48 hours prior to the renewal date. All payments are strictly non-refundable and no prorated credits will be provided for partial periods. We reserve the right to increase our subscription prices at any time upon renewal.

2. CANCELLATION AND ACCOUNT TERMINATION
You may cancel your subscription exclusively through the deep settings menu inside your account settings. Streamify reserves the right, at its sole discretion, to suspend or terminate your account and erase all stored playlists, offline downloads, and profile data at any time, for any reason or no reason, without notice or liability to you.

3. DATA COLLECTION AND THIRD-PARTY ADVERTISING SHARING
When you use Streamify, we collect your precise GPS location, hardware device identifiers, browsing behavior, listening duration, and IP address. We may disclose and sell this personal information, along with demographic telemetry, to third-party advertising partners, commercial affiliates, and data analytics brokers for targeted ad campaigns across the web.

4. BINDING ARBITRATION AND CLASS ACTION WAIVER
PLEASE READ THIS CAREFULLY. IT AFFECTS YOUR LEGAL RIGHTS. Any dispute, claim, or controversy arising out of or relating to these Terms shall be determined exclusively by final and binding individual arbitration rather than in courts of general jurisdiction. YOU AND STREAMIFY AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING.

5. LIMITATION OF LIABILITY
TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL STREAMIFY'S TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THESE TERMS EXCEED FIFTY DOLLARS ($50.00) OR THE AMOUNT PAID BY YOU IN THE PAST THIRTY (30) DAYS.`;
    charCount.textContent = `${policyInput.value.length.toLocaleString()} characters`;
  });

  btnSamplePriv.addEventListener('click', () => {
    policyInput.value = `OMNIDATA AI - GLOBAL PRIVACY & DATA GOVERNANCE POLICY
1. Information We Harvest Automatically
Whenever you navigate our services, we deploy persistent tracking cookies, canvas fingerprinting scripts, and web beacons to harvest telemetry concerning your device configuration, operating system, biometric interaction velocity, battery level, clipboard snippets, and approximate geo-coordinates derived from nearby Wi-Fi beacons.

2. Third-Party Commercial Data Broker Sharing
We routinely monetize, syndicate, and disclose accumulated consumer profile profiles to commercial data brokers, credit assessment entities, and programmatic real-time bidding networks. We may combine the profile data we harvest with third-party offline databases to predict your shopping inclinations and consumer creditworthiness.

3. Mandatory AI Model Training and Content Scraping
By submitting any user text, voice recordings, documents, or prompts through our interfaces, you grant OmniData a perpetual, irrevocable, worldwide, royalty-free license to digest and use all such confidential content to train, refine, and commercially deploy proprietary generative neural network models without attribution or payment to you.

4. Data Retention and Deletion Limitations
We preserve your harvested personal identifiers in encrypted backups indefinitely for regulatory and analytical utility. Residual derived analytical weights and behavioral embeddings cannot be isolated or deleted from trained machine learning weights.`;
    charCount.textContent = `${policyInput.value.length.toLocaleString()} characters`;
  });

  btnAnalyze.addEventListener('click', async () => {
    const text = policyInput.value.trim();
    if (!text || text.length < 50) {
      alert('Please enter or paste at least 50 characters of policy text.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          title: 'Web Document',
          domain: 'Cloud Run Web'
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      renderResults(data);
    } catch (err) {
      console.error(err);
      alert('Analysis error: ' + err.message);
    } finally {
      setLoading(false);
    }
  });

  function setLoading(isLoading) {
    if (isLoading) {
      btnAnalyze.disabled = true;
      btnAnalyzeText.textContent = 'Analyzing Policy...';
      spinner.classList.remove('hidden');
    } else {
      btnAnalyze.disabled = false;
      btnAnalyzeText.textContent = '⚡ Analyze Policy';
      spinner.classList.add('hidden');
    }
  }

  function renderResults(data) {
    resultsContainer.classList.remove('hidden');

    resPolicyType.textContent = data.policy_type || 'Policy Document';

    const risk = (data.risk_rating || 'Caution').toLowerCase();
    resRiskPill.className = 'risk-pill';
    if (risk.includes('high') || risk.includes('unfavorable')) {
      resRiskPill.classList.add('high-risk');
      resRiskPill.textContent = '🔴 High Risk';
    } else if (risk.includes('fair') || risk.includes('safe') || risk.includes('low')) {
      resRiskPill.classList.add('fair');
      resRiskPill.textContent = '🟢 Fair / Low Risk';
    } else {
      resRiskPill.classList.add('caution');
      resRiskPill.textContent = '🟡 Moderate Caution';
    }

    const flagsCount = data.red_flags_count || (data.key_findings || []).filter((f) => f.risk_level === 'red_flag').length || 0;
    resRedFlags.textContent = `${flagsCount} Red Flag${flagsCount === 1 ? '' : 's'} Detected`;

    resOverallSummary.textContent = data.overall_summary || '';
    resBottomLine.textContent = data.bottom_line ? `👉 Bottom Line: ${data.bottom_line}` : '';

    // Render 3 to 5 Key Findings
    findingsGrid.innerHTML = '';
    (data.key_findings || []).forEach((f, idx) => {
      const item = document.createElement('div');
      item.className = 'finding-item';
      item.innerHTML = `
        <div class="finding-head">
          <h4>${idx + 1}. ${escapeHtml(f.title || 'Important Clause')}</h4>
          <span class="badge ${f.risk_level || 'info'}">${f.risk_level === 'red_flag' ? 'Red Flag 🚩' : 'Caution ⚠️'}</span>
        </div>
        <div class="finding-body">${escapeHtml(f.plain_english || '')}</div>
        ${f.consequence ? `<div class="finding-impact"><strong>Real-World Impact:</strong> ${escapeHtml(f.consequence)}</div>` : ''}
        ${f.quote ? `<div class="finding-quote">"${escapeHtml(f.quote)}"</div>` : ''}
      `;
      findingsGrid.appendChild(item);
    });

    // Render Categories
    const priv = data.categories?.privacy || {};
    catPrivacyHead.textContent = priv.headline || '';
    populateList(catPrivacyList, priv.what_happens_to_my_data || priv.details || []);

    const pay = data.categories?.payments || {};
    catPaymentsHead.textContent = pay.headline || '';
    populateList(catPaymentsList, pay.details || []);

    const canc = data.categories?.cancellation || {};
    catCancellationHead.textContent = canc.headline || '';
    populateList(catCancellationList, canc.details || []);

    const liab = data.categories?.liability || {};
    catLiabilityHead.textContent = liab.headline || '';
    populateList(catLiabilityList, liab.details || []);

    resultsContainer.scrollIntoView({ behavior: 'smooth' });
  }

  function populateList(ulEl, items) {
    ulEl.innerHTML = '';
    (items || []).forEach((t) => {
      const li = document.createElement('li');
      li.textContent = t;
      ulEl.appendChild(li);
    });
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
});
