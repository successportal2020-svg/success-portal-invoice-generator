const SHEET_NAME = 'Documents';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = spreadsheet.getSheetByName(SHEET_NAME);
      if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);
      ensureHeaders_(sheet);
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        const existingNumbers = sheet.getRange(2, 3, lastRow - 1, 1).getDisplayValues().flat();
        if (existingNumbers.some(number => String(number).trim() === String(data.number).trim())) {
          return json_({ok:false, duplicate:true, error:'Document number already exists', number:data.number});
        }
      }
      sheet.appendRow([
        new Date(), data.type, data.number, data.date, data.dueDate || '',
        data.customerName, data.customerDetails, data.currency,
        data.subtotal, data.discount, data.taxRate, data.tax, data.total,
        data.amountPaid || 0, data.amountDue || 0,
        JSON.stringify(data.items), data.notes || ''
      ]);
    } finally {
      lock.releaseLock();
    }
    return json_({ok:true, number:data.number});
  } catch (error) {
    return json_({ok:false, error:String(error)});
  }
}

function doGet() {
  return json_({ok:true, service:'Success Portal document records'});
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() > 0) return;
  sheet.appendRow(['Saved At','Type','Number','Date','Due Date','Customer','Customer Details','Currency','Subtotal','Discount','Tax Rate','Tax','Total','Amount Paid','Amount Due','Items (JSON)','Notes']);
  sheet.getRange(1,1,1,17).setFontWeight('bold').setBackground('#17212b').setFontColor('#ffffff');
  sheet.setFrozenRows(1);
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
