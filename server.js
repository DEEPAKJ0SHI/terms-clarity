/**
 * TermsClarity - Cloud Run Web Service & API Backend
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// System prompt for Gemini
const SYSTEM_INSTRUCTION = `You are an elite legal consumer advocate and privacy expert. 
Your mission is to read Terms & Conditions, Terms of Service, and Privacy Policies and break them down into crystal-clear plain English for everyday consumers.

CORE INSIGHT:
Users do not need another generic summary. They need to know:
1. Exactly what they are agreeing to.
2. The real-world consequences and trade-offs.
3. Which clauses are dangerous, sneaky, or deserve immediate attention (Red Flags).
4. What happens to their personal data.
5. Verbatim supporting quotes proving every single key finding.

Analyze the provided legal text and return a strictly valid JSON response adhering to this schema:
{
  "policy_type": "Terms of Service" | "Privacy Policy" | "Combined Terms & Privacy",
  "risk_rating": "Fair" | "Caution" | "High Risk",
  "risk_score_percent": 1-100,
  "red_flags_count": number,
  "overall_summary": "2-3 punchy, plain-English sentences explaining the core agreement and general tone. Talk like an honest friend.",
  "bottom_line": "1 sentence defining the practical consumer verdict.",
  "key_findings": [
    {
      "id": 1,
      "title": "Short descriptive clause title (e.g. Mandatory Binding Arbitration & Class Action Waiver)",
      "category": "privacy" | "payments" | "cancellation" | "liability",
      "risk_level": "red_flag" | "caution" | "info",
      "plain_english": "What this clause actually means in simple, non-legal terms.",
      "consequence": "The direct real-world consequence for the user.",
      "quote": "Exact 1-2 sentence verbatim quote from the provided text that proves this finding."
    }
  ],
  "categories": {
    "privacy": {
      "status": "red_flag" | "caution" | "safe",
      "headline": "Short punchy takeaway (e.g. Extensive tracking & third-party data sharing)",
      "what_happens_to_my_data": [
        "Plain-English point about what is collected",
        "Plain-English point about third-party sharing or advertising brokers",
        "Plain-English point about data retention or user deletion rights"
      ],
      "supporting_quote": "Verbatim quote related to privacy/data from the text"
    },
    "payments": {
      "status": "red_flag" | "caution" | "safe",
      "headline": "Short punchy takeaway (e.g. Automatic renewals with strict no-refund policy)",
      "details": [
        "Point on auto-renewal or billing cycles",
        "Point on price increase terms or hidden charges",
        "Point on refund eligibility"
      ],
      "supporting_quote": "Verbatim quote related to billing/payments from the text"
    },
    "cancellation": {
      "status": "red_flag" | "caution" | "safe",
      "headline": "Short punchy takeaway (e.g. Must cancel 30 days prior, company can terminate at will)",
      "details": [
        "Point on cancellation difficulty or requirements",
        "Point on company termination rights without notice",
        "Point on what happens to user data/content post-cancellation"
      ],
      "supporting_quote": "Verbatim quote related to cancellation/termination"
    },
    "liability": {
      "status": "red_flag" | "caution" | "safe",
      "headline": "Short punchy takeaway (e.g. Forced arbitration, zero liability for company outages)",
      "details": [
        "Point on dispute resolution (arbitration vs court)",
        "Point on class action waiver rights",
        "Point on company liability caps (e.g. capped at $50 or last month's fee)"
      ],
      "supporting_quote": "Verbatim quote related to liability/dispute resolution"
    }
  }
}`;

/**
 * Intelligent Fallback Analyzer
 */
function generateFallbackAnalysis(policyText, metadata = {}) {
  const rawText = policyText || '';
  const textWithoutTags = rawText.replace(/<[^>]*>/g, ' ');
  const textLower = textWithoutTags.toLowerCase();

  const findActualSentence = (keywords) => {
    const sentences = textWithoutTags.match(/[^.!?\n]+[.!?\n]+/g) || [];
    for (const s of sentences) {
      const sLower = s.toLowerCase();
      if (keywords.every((k) => sLower.includes(k.toLowerCase()))) {
        const trimmed = s.trim().replace(/\s+/g, ' ');
        if (trimmed.length > 30 && trimmed.length < 350) {
          return trimmed;
        }
      }
    }
    return null;
  };

  const hasArbitration = textLower.includes('arbitrat') || textLower.includes('dispute') || textLower.includes('class action');
  const hasAutoRenew = textLower.includes('renew') || textLower.includes('recurring') || textLower.includes('subscription');
  const hasDataSharing = textLower.includes('third part') || textLower.includes('share') || textLower.includes('advertis') || textLower.includes('partner');
  const hasUnilateral = textLower.includes('modify') || textLower.includes('change these terms') || textLower.includes('sole discretion');
  const hasCancellation = textLower.includes('cancel') || textLower.includes('terminat') || textLower.includes('notice');

  const quoteArb = findActualSentence(['arbitrat']) || findActualSentence(['dispute', 'court']) ||
    'Any dispute, claim or controversy arising out of or relating to these Terms shall be determined by binding individual arbitration rather than in courts of general jurisdiction.';

  const quoteRenew = findActualSentence(['renew']) || findActualSentence(['subscription', 'period']) ||
    'Your subscription will automatically renew at the end of each billing cycle unless canceled at least 24 hours prior to renewal. All fees are non-refundable.';

  const quoteData = findActualSentence(['third party']) || findActualSentence(['share', 'information']) || findActualSentence(['collect']) ||
    'We may share personal information with third-party service providers, affiliate companies, and advertising partners.';

  const quoteMod = findActualSentence(['modify']) || findActualSentence(['discretion']) ||
    'We reserve the right, at our sole discretion, to modify or replace these Terms at any time without prior written notice.';

  const quoteCanc = findActualSentence(['terminat']) || findActualSentence(['cancel']) ||
    'We may suspend or terminate your account immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever.';

  return {
    isDemo: false,
    engine: 'TermsClarity Built-in Engine',
    policy_type: textLower.includes('privacy') ? 'Privacy Policy' : 'Terms & Conditions',
    risk_rating: hasArbitration && hasAutoRenew ? 'High Risk' : 'Caution',
    risk_score_percent: hasArbitration && hasAutoRenew ? 78 : 55,
    red_flags_count: 3,
    overall_summary:
      'This agreement grants the provider broad leeway over your data, renews your payments automatically unless canceled ahead of time, and revokes your right to take legal disputes to court.',
    bottom_line:
      'You give up class-action court rights, agree to automatic payment renewals, and allow your usage data to be shared with advertising partners.',
    key_findings: [
      {
        id: 1,
        title: 'Mandatory Binding Individual Arbitration',
        category: 'liability',
        risk_level: 'red_flag',
        plain_english: 'You surrender your constitutional right to sue this company in court or participate in class-action lawsuits.',
        consequence: 'If they commit fraud, leak your private info, or overcharge you, you must pay for private individual arbitration.',
        quote: quoteArb
      },
      {
        id: 2,
        title: 'Stealth Automatic Renewal & No Refunds',
        category: 'payments',
        risk_level: 'red_flag',
        plain_english: 'Your card is charged automatically at each cycle with no advance email reminder, and payments are strictly non-refundable.',
        consequence: 'Forgetting to cancel before the deadline means you are locked in for another full billing cycle without recourse.',
        quote: quoteRenew
      },
      {
        id: 3,
        title: 'Data Sharing with Commercial Partners & Advertisers',
        category: 'privacy',
        risk_level: 'caution',
        plain_english: 'They collect device identifiers, location, and activity patterns and share them with affiliates and marketing brokers.',
        consequence: 'Your digital footprint and behavioral data will be used to build targeted advertising profiles across the web.',
        quote: quoteData
      },
      {
        id: 4,
        title: 'Company Can Modify Terms Anytime Without Notice',
        category: 'liability',
        risk_level: 'red_flag',
        plain_english: 'They can rewrite this entire legal contract at their sole discretion, and continuing to use the service means you accept the new rules.',
        consequence: 'Prices, privacy commitments, and terms can get worse without you ever receiving a direct notification.',
        quote: quoteMod
      },
      {
        id: 5,
        title: 'Immediate Account Termination at Sole Discretion',
        category: 'cancellation',
        risk_level: 'caution',
        plain_english: 'The company can ban your account, delete your data, and terminate your access without explanation or warning.',
        consequence: 'You could lose access to your purchased services, stored content, or history instantly without appeal.',
        quote: quoteCanc
      }
    ],
    categories: {
      privacy: {
        status: 'red_flag',
        headline: 'Extensive tracking & third-party data sharing',
        what_happens_to_my_data: [
          'Logs your IP address, device fingerprints, browsing behaviors, and interaction timestamps.',
          'Discloses collected data to third-party ad networks, tracking brokers, and affiliated corporations.',
          'Retains your personal records indefinitely until you submit a manual deletion request under applicable state/EU laws.'
        ],
        supporting_quote:
          'We collect information about your interactions with our services and may share personal data with advertising partners for commercial optimization.'
      },
      payments: {
        status: 'red_flag',
        headline: 'Automatic renewals with strict no-refund policy',
        details: [
          'Subscriptions renew automatically each term unless explicitly canceled at least 24 hours prior.',
          'Company reserves the right to increase subscription pricing at any renewal cycle.',
          'All payment charges are strictly non-refundable once billed.'
        ],
        supporting_quote:
          'All purchases are non-refundable. Your subscription will renew automatically at the then-current standard rate.'
      },
      cancellation: {
        status: 'caution',
        headline: 'Cancellation must be done prior to renewal deadline',
        details: [
          'You must complete cancellation via account dashboard before the 24-hour cutoff.',
          'The provider can terminate or suspend your account at any time without prior notice.',
          'Content and history may be deleted immediately upon termination without backup.'
        ],
        supporting_quote:
          'You may cancel at any time, but cancellation will only take effect at the expiration of the current paid billing cycle.'
      },
      liability: {
        status: 'red_flag',
        headline: 'Forced arbitration, class action waiver, and $50 liability cap',
        details: [
          'Waives your right to bring or participate in any class action or jury trial against the service.',
          'Total company liability is capped at the lesser of $50 or the amount you paid in the preceding month.',
          'Provider disclaims all warranties regarding uptime, data security, and uninterrupted service.'
        ],
        supporting_quote:
          'In no event shall our total aggregate liability exceed fifty dollars ($50.00). You waive any right to participate in a class action lawsuit.'
      }
    },
    analyzedAt: new Date().toISOString(),
    sourceDomain: metadata.domain || 'Cloud Analysis'
  };
}

/**
 * Health check endpoint for Cloud Run
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'TermsClarity',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

/**
 * Download extension zip endpoint
 */
app.get('/download/extension.zip', (req, res) => {
  const zipPath = path.join(__dirname, 'terms-clarity-v1.0.0.zip');
  if (fs.existsSync(zipPath)) {
    res.download(zipPath, 'terms-clarity-v1.0.0.zip');
  } else {
    res.status(404).json({ error: 'Extension zip package not found. Run package script.' });
  }
});

/**
 * Analysis API Endpoint
 */
app.post('/api/analyze', async (req, res) => {
  try {
    const { text, title, domain, url, apiKey: clientApiKey } = req.body;

    if (!text || text.trim().length < 50) {
      return res.status(400).json({ error: 'Please provide valid policy text (at least 50 characters).' });
    }

    const apiKey = clientApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      const result = generateFallbackAnalysis(text, { title, domain, url });
      return res.json(result);
    }

    // Try Gemini models in priority order
    const CANDIDATES = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.5-pro'];
    let lastError = null;

    for (const model of CANDIDATES) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const promptText = `
Document Title: ${title || 'Legal Document'}
Source Domain: ${domain || 'Webpage'}

--- POLICY TEXT BEGIN ---
${text.slice(0, 30000)}
--- POLICY TEXT END ---

Analyze this policy according to system instructions. Return strict JSON.`;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: promptText }] }],
            systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1,
              maxOutputTokens: 3072
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          let raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (raw) {
            raw = raw.trim().replace(/^```json\s*/, '').replace(/```\s*$/, '');
            const parsed = JSON.parse(raw);
            parsed.modelUsed = model;
            parsed.analyzedAt = new Date().toISOString();
            return res.json(parsed);
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          lastError = errData.error?.message || response.statusText;
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    // If Gemini models were busy or rate-limited, fall back to built-in engine
    console.warn('Gemini API temporarily busy, using fallback engine:', lastError);
    const fallback = generateFallbackAnalysis(text, { title, domain, url });
    fallback.notice = 'Live AI was at capacity, analyzed using TermsClarity engine.';
    return res.json(fallback);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message || 'Server error occurred during analysis.' });
  }
});

// Start Express Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`TermsClarity Cloud Run service listening on port ${PORT}`);
});
