/**
 * Utility for printing full multi-page Detailed Project Reports (DPR)
 * without viewport clipping, scroll offsets, or missing sections.
 */

export const printReportDocument = (
  selector: string = '.printable-report',
  documentTitle: string = 'GramBiz AI - Detailed Project Report'
): void => {
  const reportElement = document.querySelector(selector) as HTMLElement | null;

  if (!reportElement) {
    window.scrollTo(0, 0);
    window.print();
    return;
  }

  // Create an invisible iframe to isolate the document for pure multi-page printing
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    // Fallback: reset scroll position on current window and print
    window.scrollTo(0, 0);
    document.querySelectorAll('main, div').forEach((el) => {
      if (el.scrollTop > 0) el.scrollTop = 0;
    });
    setTimeout(() => window.print(), 100);
    return;
  }

  // Clean HTML clone of the printable report
  const reportHtml = reportElement.innerHTML;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${documentTitle}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Urbanist:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
      <style>
        @page {
          size: A4 portrait;
          margin: 14mm 14mm 14mm 14mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        html, body {
          margin: 0;
          padding: 0;
          background: #FFFFFF !important;
          color: #1E293B !important;
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          font-size: 10.5pt;
          line-height: 1.45;
          width: 100%;
        }
        h1, h2, h3, h4, .font-heading {
          font-family: 'Urbanist', 'DM Sans', sans-serif;
          letter-spacing: -0.02em;
          color: #176B67 !important;
        }
        .report-page-container {
          width: 100%;
          max-width: 100%;
          background: #FFFFFF;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 6px 0;
          font-size: 9.5pt;
        }
        th, td {
          border: 1px solid #E2E8F0;
          padding: 5px 8px;
          text-align: left;
        }
        th {
          background-color: #EDF3F1 !important;
          color: #176B67 !important;
          font-weight: 700;
        }
        tr:nth-child(even) {
          background-color: #F8FAF9;
        }
        h2 {
          page-break-after: avoid;
          break-after: avoid;
          margin-top: 14px;
          margin-bottom: 6px;
        }
        .avoid-break, table, tr {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .no-print {
          display: none !important;
        }
      </style>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="p-2">
      <div class="report-page-container">
        ${reportHtml}
      </div>
    </body>
    </html>
  `;

  doc.open();
  doc.write(htmlContent);
  doc.close();

  // Allow styles, fonts, and DOM to settle before opening the native print dialog
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error('Print iframe error, falling back to window.print', e);
      window.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }
  }, 400);
};
