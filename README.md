# Success Portal Invoice & Receipt Generator

A static, GitHub Pages-ready invoice and receipt generator. It uses the Success Portal orange/slate identity, downloads A4 PDFs, and records every saved document in Google Sheets.

## 1. Connect Google Sheets

1. Create a new Google Sheet named **Success Portal Invoice Records**.
2. Open **Extensions → Apps Script**.
3. Replace the editor contents with `google-apps-script/Code.gs` and save.
4. Select **Deploy → New deployment → Web app**.
5. Set **Execute as: Me** and **Who has access: Anyone**.
6. Deploy, authorize, and copy the Web App URL ending in `/exec`.
7. Open the generator, select **Settings**, paste the URL, and save.

The first saved document automatically creates a `Documents` tab with headings. The sheet can be downloaded at any time with **File → Download → Microsoft Excel (.xlsx)**.

## 2. Publish on GitHub Pages

1. Create a public GitHub repository, for example `success-portal-invoice-generator`.
2. Upload everything in this project folder to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select `main` and `/ (root)`, then save.

GitHub will show the public website URL after deployment.

## Important security note

The Apps Script URL allows the public generator to append records to its linked sheet. Do not place private keys or Google login details in the webpage. Use a dedicated records sheet and keep the spreadsheet itself private.

## Included features

- Invoice/receipt selector
- Multiple line items with automatic totals
- MWK, USD, ZAR and GBP currencies
- Tax and discount
- Receipt-only amount paid and **Amount Due**
- A4 PDF download
- Automatic Google Sheet record capture
- Mobile-friendly editing interface
- Success Portal contact details and slogan
