# TermsClarity: AI Terms & Privacy Explainer (Chrome Extension)

A Chrome extension that analyzes complicated Terms & Conditions and Privacy Policies, translates them into plain English, detects red flags, explains what happens to your data, and provides evidence-backed explanations with live in-page highlighting.

---

## 🎯 The Core Insight
People routinely accept terms without reading them because legal language is dense, policies are dozens of pages long, and crucial gotchas (tracking, auto-renewals, arbitration) are buried.

**Users don't need another generic summary. They need to know what they're agreeing to, what the real-world consequences are, and which details deserve a closer look.**

---

## 🚀 The 5 MVP Features

1. **One-Click Page Analysis Button**:
   - A prominent `[ ⚡ Analyze Current Page ]` button in the extension popup that automatically targets the active tab.
   - Live scanning and analysis status updates.
   - Secondary manual paste fallback with a one-click sample loader for testing custom text or offline documents.

2. **Extraction of Visible Terms & Privacy Text**:
   - Smart DOM traversal that targets main legal containers (`main`, `article`, `[role="main"]`, `#terms`, `#privacy`, `.legal-content`).
   - Filters out navigational headers, footers, sidebars, cookie consent banners, and script boilerplate.
   - Normalizes text and tracks exact word count and domain context.

3. **AI-Generated Plain-English Summary & Red-Flag Detection**:
   - **The Bottom Line**: A 2-3 sentence, zero-jargon breakdown of the agreement.
   - **Risk Gauge**: Visual rating (`🟢 Fair / Low Risk`, `🟡 Moderate Caution`, `🔴 High Risk / Unfavorable`).
   - **Red-Flag Counter**: Highlights severe consumer-unfriendly clauses (`🚩 3 Red Flags detected`).

4. **3 to 5 Key Findings Backed by Supporting Evidence**:
   - Exactly 3 to 5 crucial trade-offs explaining the real-world consequences (e.g., binding arbitration, automatic renewal without warning, data sharing with advertisers).
   - Each finding is linked to a **verbatim supporting quote** from the policy text.
   - **🔍 In-Page Evidence Highlighter**: Clicking *"Highlight on Webpage"* automatically scrolls the active tab directly to the cited clause and highlights it with a golden glow and badge.

5. **Clean Interface with 4 Essential Categories**:
   - 🛡️ **What Happens to My Data? (Privacy)**: Data collection, device fingerprinting, advertising brokers, retention, and deletion limits.
   - 💳 **Payments & Renewals**: Billing cycles, stealth auto-renewals, price hike clauses, and refund eligibility.
   - ❌ **Cancellation & Termination**: Cancellation hoops, 30-day notice requirements, and unilateral account ban clauses.
   - ⚖️ **Liability & Legal Rights**: Binding arbitration, class action waivers, limitation of liability caps, and unilateral modification without notice.
   - 🔄 **Policy Comparison (Future Upgrade Preview)**: Interactive teaser showcasing upcoming diff comparison against older policy versions.

---

## 📂 Project Structure

```
terms-clarity-extension/
├── manifest.json              # Manifest V3 configuration with activeTab & storage
├── popup/
│   ├── popup.html             # Clean modern UI (Cards, tabs, accordion, evidence badges)
│   ├── popup.css              # Custom styling, semantic color tokens, and animations
│   └── popup.js               # Tab messaging, text extraction trigger, AI integration
├── scripts/
│   ├── content.js             # In-page text extractor & evidence quote highlighter
│   ├── content.css            # Highlight styles and floating evidence badge
│   ├── ai-service.js          # Google Gemini API client & offline demo engine
│   └── storage.js             # Local cache and API key management
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── test-pages/
    ├── sample-subscription-terms.html   # Realistic SaaS streaming terms (arbitration, renewals)
    └── sample-privacy-policy.html      # Realistic privacy policy (AI scraping, data brokers)
```

---

## 🛠️ Installation Guide (Takes 30 seconds)

1. Open Google Chrome.
2. In the address bar, navigate to:
   ```
   chrome://extensions/
   ```
3. In the top-right corner, toggle on **"Developer mode"**.
4. Click the **"Load unpacked"** button in the top-left.
5. Select the extension directory:
   ```
   C:\Users\miste\.gemini\antigravity\scratch\terms-clarity-extension
   ```
6. The **TermsClarity** icon will appear in your Chrome toolbar. Pin it for quick access!

---

## 🧪 How to Test It Immediately

### Method 1: Using the Included Test Pages
1. In Chrome, open one of the included sample pages:
   - Double-click or open `terms-clarity-extension/test-pages/sample-subscription-terms.html` in Chrome.
   - Or open `sample-privacy-policy.html`.
2. Click the **TermsClarity** icon in the toolbar.
3. Click **"Analyze Current Page"**.
4. Watch the plain-English summary, red flags, and 3-5 key findings appear!
5. Expand any finding, click **"Highlight on Webpage"**, and watch the active webpage scroll right to that exact clause!

### Method 2: On Any Live Webpage
1. Visit any Terms of Service or Privacy Policy page (e.g., Netflix, Spotify, Discord, Reddit, or OpenAI).
2. Click the **TermsClarity** extension popup.
3. Click **"Analyze Current Page"**.

### Method 3: Manual Text Input
1. Open the extension popup.
2. Click the clipboard icon (📋) in the header.
3. Paste any text or click **"Load Sample Policy"**, then click **"Analyze Pasted Text"**.

---

## 🔑 AI Configuration (Optional Gemini API Key)

The extension comes with an **Intelligent Offline Demo Engine** enabled out-of-the-box, meaning you can test it immediately without needing an API key.

To activate live, real-time AI analysis with Google Gemini on any website:
1. Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Click the gear icon (**⚙️**) in the TermsClarity popup.
3. Paste your Gemini API key and click **"Save Key"**.
4. Select your preferred model (`Gemini 3.8 Flash` recommended for speed & structured reasoning).
