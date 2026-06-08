// ═══════════════════════════════════════════
// EXPORTS & ANALYTICS  — Doctor Na Gola Admin
// ═══════════════════════════════════════════

// ── Helpers ─────────────────────────────────────────────────────────────────

function _getFilteredOrders(days) {
  if (!allOrders || allOrders.length === 0) return [];
  if (!days) return allOrders;                           // all-time
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return allOrders.filter(o => (o.timestamp || 0) >= cutoff);
}

function _formatOrdersForExport(orders) {
  return (orders || allOrders).map(o => {
    const items = (o.items || []).map(i => `${i.name?.en || i.name} (x${i.qty})`).join(', ');
    return {
      'Order ID'    : o.orderId,
      'Date'        : new Date(o.timestamp).toLocaleString('en-IN'),
      'Customer'    : o.customerName || '—',
      'Phone'       : o.phone || '—',
      'Type'        : o.orderType === 'parcel' ? 'Parcel' : 'Pickup',
      'Items'       : items,
      'Total (Rs)'  : o.total,
      'Payment'     : (o.paymentMethod || '').toUpperCase(),
      'Status'      : (o.status || '').toUpperCase()
    };
  });
}

function _getPdfLib() {
  // jsPDF UMD exposes itself as window.jspdf.jsPDF
  if (window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF;
  // Some CDN builds expose it directly
  if (window.jsPDF) return window.jsPDF;
  return null;
}

// ── CSV Export ───────────────────────────────────────────────────────────────

function exportOrders(format) {
  if (!allOrders || allOrders.length === 0) {
    admToast('No orders to export', '#DC2626'); return;
  }
  admToast(`Generating ${format.toUpperCase()}…`);
  const data = _formatOrdersForExport(allOrders);

  if (format === 'csv') {
    const headers = Object.keys(data[0]).join(',');
    const rows    = data.map(row =>
      Object.values(row).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const blob = new Blob([headers + '\n' + rows], { type: 'text/csv;charset=utf-8;' });
    _downloadBlob(blob, `Orders_${_today()}.csv`);

  } else if (format === 'excel') {
    if (typeof XLSX === 'undefined') { admToast('Excel library not loaded', '#DC2626'); return; }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');
    XLSX.writeFile(wb, `Orders_${_today()}.xlsx`);

  } else if (format === 'pdf') {
    const jsPDF = _getPdfLib();
    if (!jsPDF) { admToast('PDF library not loaded yet — try again in a second', '#DC2626'); return; }

    const doc = new jsPDF('landscape', 'mm', 'a4');
    doc.setFontSize(18);
    doc.text('Doctor Na Gola — Orders Report', 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 26);

    if (typeof doc.autoTable === 'function') {
      doc.autoTable({
        startY     : 32,
        head       : [Object.keys(data[0])],
        body       : data.map(Object.values),
        theme      : 'grid',
        styles     : { fontSize: 7, cellPadding: 2 },
        headStyles : { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [239, 246, 255] }
      });
    } else {
      doc.setFontSize(10);
      doc.text('(autoTable plugin not loaded — install jspdf-autotable)', 14, 40);
    }

    doc.save(`Orders_${_today()}.pdf`);
  }
}

// ── Sales Report PDF ─────────────────────────────────────────────────────────

function generateSalesReport(days) {
  days = parseInt(days) || 0;   // 0 = all-time
  const orders = _getFilteredOrders(days || null);

  if (!orders || orders.length === 0) {
    admToast('No orders in the selected period', '#DC2626'); return;
  }

  const jsPDF = _getPdfLib();
  if (!jsPDF) { admToast('PDF library not loaded yet — try again in a second', '#DC2626'); return; }

  admToast('Generating Sales Report PDF…');

  // ── Aggregate ──
  let totalRev = 0, parcelCount = 0, pickupCount = 0, cashCount = 0, upiCount = 0;
  const itemCounts = {};

  orders.forEach(o => {
    totalRev += (o.total || 0);
    if (o.orderType === 'parcel') parcelCount++; else pickupCount++;
    if ((o.paymentMethod || '') === 'cash') cashCount++; else upiCount++;
    (o.items || []).forEach(i => {
      const name = i.name?.en || i.name || 'Unknown';
      itemCounts[name] = (itemCounts[name] || 0) + (i.qty || 1);
    });
  });

  const topItems   = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const avgOrder   = orders.length ? (totalRev / orders.length).toFixed(2) : 0;
  const periodLabel = days === 1  ? 'Last 1 Day'
                    : days === 7  ? 'Last 7 Days'
                    : days === 30 ? 'Last 30 Days'
                    : days === 90 ? 'Last 90 Days'
                    : 'All Time';

  // ── PDF ──
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const W   = doc.internal.pageSize.getWidth();

  // Header band
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, W, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont(undefined, 'bold');
  doc.text('Doctor Na Gola', 14, 16);
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text('Sales Analytics Report', 14, 24);
  doc.setFontSize(9);
  doc.text(`Period: ${periodLabel}   |   Generated: ${new Date().toLocaleString('en-IN')}`, 14, 33);

  // Summary cards (two rows × two cols)
  const cards = [
    { label: 'Total Orders',   value: orders.length },
    { label: 'Total Revenue',  value: `Rs. ${totalRev.toLocaleString('en-IN')}` },
    { label: 'Avg Order Value',value: `Rs. ${avgOrder}` },
    { label: 'Pending/Active', value: orders.filter(o => o.status === 'pending' || o.status === 'processing').length }
  ];

  doc.setTextColor(30, 58, 138);
  let cardX = 14, cardY = 46, cardW = (W - 28 - 9) / 2;
  cards.forEach((c, idx) => {
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(cardX, cardY, cardW, 22, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100);
    doc.text(c.label, cardX + 5, cardY + 8);
    doc.setFontSize(15);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(30, 58, 138);
    doc.text(String(c.value), cardX + 5, cardY + 18);
    if (idx % 2 === 0) { cardX += cardW + 9; }
    else               { cardX = 14; cardY += 27; }
  });

  let curY = cardY + (cards.length % 2 === 0 ? 27 : 0);

  // Order breakdown table
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('Order Breakdown', 14, curY + 6);
  curY += 10;

  if (typeof doc.autoTable === 'function') {
    doc.autoTable({
      startY    : curY,
      head      : [['Metric', 'Count / Value']],
      body      : [
        ['Pickup Orders',   pickupCount],
        ['Parcel Orders',   parcelCount],
        ['Cash Payments',   cashCount],
        ['UPI / Other Payments', upiCount]
      ],
      theme      : 'striped',
      styles     : { fontSize: 10, cellPadding: 4 },
      headStyles : { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [239, 246, 255] },
      columnStyles: { 1: { halign: 'center', fontStyle: 'bold' } },
      margin     : { left: 14, right: 14 }
    });
    curY = doc.lastAutoTable.finalY + 10;

    // Top selling items
    if (topItems.length > 0) {
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(30, 58, 138);
      doc.text('Top 10 Best-Selling Items', 14, curY);
      curY += 4;

      doc.autoTable({
        startY    : curY,
        head      : [['#', 'Item Name', 'Qty Sold']],
        body      : topItems.map((item, i) => [i + 1, item[0], item[1]]),
        theme      : 'grid',
        styles     : { fontSize: 10, cellPadding: 4 },
        headStyles : { fillColor: [16, 163, 74], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 253, 244] },
        columnStyles: { 0: { halign: 'center', cellWidth: 15 }, 2: { halign: 'center', fontStyle: 'bold' } },
        margin     : { left: 14, right: 14 }
      });
    }
  }

  // Footer
  const pages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(160);
    doc.text(
      `Doctor Na Gola  |  Page ${p} of ${pages}`,
      W / 2, doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
  }

  doc.save(`SalesReport_${periodLabel.replace(/ /g, '_')}_${_today()}.pdf`);
  admToast(`✅ ${periodLabel} Sales Report downloaded!`, '#16A34A');
}

// ── Utilities ────────────────────────────────────────────────────────────────

function _today() { return new Date().toISOString().split('T')[0]; }

function _downloadBlob(blob, filename) {
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href  = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
