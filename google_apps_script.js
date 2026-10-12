/**
 * =========================================================================
 * SSC GD Constable 2026 - Result Checker Google Apps Script
 * =========================================================================
 * 
 * INSTRUCTIONS:
 * 1. Open Google Sheets (create a new blank spreadsheet).
 * 2. In Google Sheets, click: Extensions > Apps Script.
 * 3. Delete any default code in Code.gs, paste this entire script, and click Save (💾).
 * 4. Click the blue "Deploy" button (top-right) -> "New deployment".
 * 5. Select type: "Web app" (click the gear icon ⚙️ if not visible).
 * 6. Set Description: "SSC GD Result Logger"
 * 7. Execute as: "Me" (your email)
 * 8. Who has access: "Anyone"  <-- CRITICAL: Must be "Anyone" so visitors can log
 * 9. Click "Deploy". Grant permissions if prompted (Advanced > Go to ... (unsafe)).
 * 10. Copy the "Deployment ID" or "Web app URL" and paste it into config.js!
 * =========================================================================
 */

function setupSheet(sheet) {
  if (sheet.getLastRow() === 0) {
    const headers = [
      "Timestamp",
      "Entered Name",
      "Mobile Number",
      "Roll Number",
      "Result Status",
      "Official Name (From List)",
      "Category",
      "Gender / List"
    ];
    sheet.appendRow(headers);
    
    // Style the header row
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#1e3a8a");
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    
    // Auto-fit column widths
    for (let i = 1; i <= headers.length; i++) {
      sheet.autoResizeColumn(i);
    }
  }
}

function doPost(e) {
  return handleRequest(e);
}

function doGet(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000); // 10 seconds lock to prevent race conditions during high concurrent traffic

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getActiveSheet();
    setupSheet(sheet);

    let data = {};

    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const enteredName = (data.name || data.enteredName || "").toString().trim();
    const mobile = (data.mobile || data.mobileNumber || "").toString().trim();
    const rollNumber = (data.roll || data.rollNumber || "").toString().trim();
    const resultStatus = (data.status || data.resultStatus || "").toString().trim();
    const officialName = (data.officialName || data.matchedName || "").toString().trim();
    const category = (data.category || "").toString().trim();
    const gender = (data.gender || data.list || "").toString().trim();

    sheet.appendRow([
      timestamp,
      enteredName,
      "'" + mobile, // Prepended apostrophe preserves leading zeroes
      "'" + rollNumber,
      resultStatus,
      officialName,
      category,
      gender
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Data recorded successfully",
      timestamp: timestamp
    }))
    .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    }))
    .setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}
