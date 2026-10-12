# SSC GD Constable Result Checker Widget (2026)

A lightweight, high-performance, and responsive **Result Checker Widget** for the SSC GD Constable Examination. Designed specifically for **seamless embedding into any website via `<iframe>`** or direct hosting via **GitHub Pages**.

---

## 🚀 Key Features

- **⚡ Instant Merit Checking**: All **1,97,348 qualified candidates** from both **LIST-1 (Female)** and **LIST-2 (Male)** are pre-indexed into high-speed shards (`data/*.json`). Verification happens in under **50 milliseconds** without downloading heavy PDFs.
- **🎨 Light & Compact Widget Design**: Crafted with a modern, clean light UI (`#f8fafc` / clean white cards), subtle elevation, and responsive dimensions (~440px max width) that fit cleanly into sidebars, popups, or dedicated iframe containers.
- **📊 Automatic Google Sheets Sync**: Every entry (Candidate Name, Mobile Number, Roll Number, and Result Status) is automatically appended into your connected Google Sheet in real-time.
- **🛡️ Smart Client-Side Validation**: Ensures valid Indian 10-digit mobile numbers and official 10–12 digit SSC roll numbers.
- **🏷️ Official Candidate Details**: When qualified, displays the candidate's official registered name from the merit list, category (UR, OBC, SC, ST, EWS), and qualifying list.

---

## 📁 Project Structure

```
SSC-gD-Result/
├── index.html              # Main lightweight widget UI
├── style.css               # Clean light theme styling
├── widget.js               # Fast lookup logic and Google Sheets syncing
├── config.js               # Configuration file for your Google Apps Script ID
├── google_apps_script.js   # Ready-to-paste Google Apps Script backend
├── extract_all.js          # Node.js PDF extraction & sharding script
├── data/                   # Sharded roll number datasets (30 shards + prefixes)
│   ├── prefixes.json
│   ├── 1262.json
│   ├── 2262.json
│   └── ...
├── LIST1_12102026.pdf      # Official Female qualified merit list (318 pages)
├── LIST2_12102026.pdf      # Official Male qualified merit list (3,634 pages)
└── README.md               # Setup and deployment documentation
```

---

## 🛠️ Step 1: Set Up Google Sheets & Apps Script

To capture user submissions in your Google Sheet:

1. Go to [Google Sheets](https://sheets.new) and create a new blank spreadsheet.
2. In the top menu, click **Extensions** > **Apps Script**.
3. In the script editor, delete any existing code in `Code.gs` and paste the contents of [`google_apps_script.js`](./google_apps_script.js).
4. Click the **Save** icon (💾).
5. In the top-right corner, click **Deploy** > **New deployment**.
6. Click the gear icon (⚙️) next to "Select type" and choose **Web app**.
7. Set the deployment configuration:
   - **Description**: `SSC GD Result Logger`
   - **Execute as**: `Me (your email)`
   - **Who has access**: `Anyone` *(⚠️ CRITICAL: Must be "Anyone" so visitors can submit data without logging in)*
8. Click **Deploy**. If prompted, click **Authorize Access**, choose your Google account, click **Advanced**, and proceed to allow permissions.
9. Copy the generated **Deployment ID** (or the complete **Web app URL**).

---

## ⚙️ Step 2: Connect Deployment ID to the Widget

Open [`config.js`](./config.js) and paste your Deployment ID:

```javascript
const CONFIG = {
    // Paste your Google Apps Script Deployment ID here:
    DEPLOYMENT_ID: "YOUR_DEPLOYMENT_ID_HERE",

    // Or paste the complete Web App URL:
    WEB_APP_URL: "",

    // Path to the sharded data directory
    DATA_PATH: "./data/"
};
```

*(Tip: You can also pass the Deployment ID dynamically via iframe query parameter without editing `config.js`! See Step 4).*

---

## 🌐 Step 3: Push to GitHub & Enable GitHub Pages

Run the following commands in your terminal:

```bash
# 1. Stage all files
git add .

# 2. Commit files
git commit -m "Add SSC GD Result Checker widget with pre-indexed data"

# 3. Create your repository on GitHub (e.g. username/ssc-gd-result), then:
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
git branch -M main
git push -u origin main
```

### Enable GitHub Pages:
1. In your GitHub repository [testbook-website/ssc-gd-result-checker](https://github.com/testbook-website/ssc-gd-result-checker), go to **Settings** > **Pages**.
2. Under **Build and deployment** > **Branch**, select `main` and folder `/ (root)`.
3. Click **Save**.
4. Your widget will be live at: `https://testbook-website.github.io/ssc-gd-result-checker/`

---

## 🖥️ Step 4: Embed Widget Using iframe

Add this HTML snippet to any webpage or WordPress/Blogger site:

```html
<!-- Responsive SSC GD Result Checker Widget -->
<div style="display: flex; justify-content: center; width: 100%; padding: 10px;">
  <iframe 
    src="https://testbook-website.github.io/ssc-gd-result-checker/" 
    width="100%" 
    height="580" 
    style="max-width: 440px; border: none; border-radius: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.06);"
    title="SSC GD Constable Result Checker"
    loading="lazy">
  </iframe>
</div>
```

---

## 📋 Data Columns Logged in Google Sheets

When candidates check their result, the following columns are recorded automatically:

| Timestamp | Entered Name | Mobile Number | Roll Number | Result Status | Official Name (From List) | Category | Gender / List |
|---|---|---|---|---|---|---|---|
| 12/10/2026, 7:00 PM | Rakesh Sharma | 9876543210 | 126280000054 | QUALIFIED | STANZIN LUNDUP | ST | List-2 (Male Candidates) |
| 12/10/2026, 7:02 PM | Amit Kumar | 9812345678 | 126299999999 | NOT QUALIFIED | - | - | - |
