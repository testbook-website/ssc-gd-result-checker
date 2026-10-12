/**
 * SSC GD Constable Result Checker - Configuration
 * 
 * Replace YOUR_DEPLOYMENT_ID with the Web App Deployment ID from Google Apps Script.
 * Example: AKfycbx...
 * 
 * You can also specify the full web app URL if preferred.
 */
const CONFIG = {
    // Paste your Google Apps Script Deployment ID here:
    // e.g. "AKfycbxXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
    DEPLOYMENT_ID: "",

    // Or paste the complete Google Apps Script Web App URL here:
    // e.g. "https://script.google.com/macros/s/AKfycbx.../exec"
    WEB_APP_URL: "",

    // Path to the sharded result data folder
    DATA_PATH: "./data/"
};

// Allow overriding via URL query parameters if embedded in iframe:
// e.g. index.html?deploymentId=AKfycbx...
(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('deploymentId')) {
        CONFIG.DEPLOYMENT_ID = params.get('deploymentId');
    }
    if (params.get('webAppUrl')) {
        CONFIG.WEB_APP_URL = params.get('webAppUrl');
    }
})();
