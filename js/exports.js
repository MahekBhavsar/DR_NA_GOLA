// ═══════════════════════════════════════════
// EXPORTS & ANALYTICS
// ═══════════════════════════════════════════

function formatOrdersForExport() {
  return allOrders.map(o => {
    const items = (o.items || []).map(i => `${i.name?.en || i.name} (x${i.qty})`).join(', ');
    const date = new Date(o.timestamp).toLocaleString('en-IN');
    return {
      'Order ID': o.orderId,
      'Date': date,
      'Customer': o.customerName,
      'Phone': o.phone,
      'Type': o.orderType === 'parcel' ? 'Parcel' : 'Pickup',
      'Items': items,
      'Total (Rs)': o.total,
      'Status': o.status.toUpperCase()
    };
  });
}

function exportOrders(format) {
  if (!allOrders || allOrders.length === 0) {
    admToast('No orders to export', '#DC2626');
    return;
  }
  
  admToast(`Generating ${format.toUpperCase()}...`);
  const data = formatOrdersForExport();

  if (format === 'csv') {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Orders_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else if (format === 'excel') {
    if (typeof XLSX === 'undefined') { admToast('Excel library not loaded', '#DC2626'); return; }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, `Orders_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  } else if (format === 'pdf') {
    if (typeof window.jspdf === 'undefined') { admToast('PDF library not loaded', '#DC2626'); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(18);
    doc.text("Doctor Na Gola - Orders Report", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 14, 30);
    
    doc.autoTable({
      startY: 40,
      head: [Object.keys(data[0])],
      body: data.map(Object.values),
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [37, 99, 235] }
    });
    
    doc.save(`Orders_Export_${new Date().toISOString().split('T')[0]}.pdf`);
  }
}

function generateSalesReport() {
  if (!allOrders || allOrders.length === 0) {
    admToast('No data to generate report', '#DC2626');
    return;
  }
  
  if (typeof window.jspdf === 'undefined') { admToast('PDF library not loaded', '#DC2626'); return; }
  admToast('Generating Sales Report PDF...');
  
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  let totalRev = 0;
  let parcelCount = 0;
  let pickupCount = 0;
  const itemCounts = {};
  
  allOrders.forEach(o => {
    totalRev += (o.total || 0);
    if (o.orderType === 'parcel') parcelCount++;
    else pickupCount++;
    
    (o.items || []).forEach(i => {
      const name = i.name?.en || i.name;
      itemCounts[name] = (itemCounts[name] || 0) + i.qty;
    });
  });
  
  const topItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  
  doc.setFontSize(22);
  doc.setTextColor(37, 99, 235);
  doc.text("Sales Analytics Report", 14, 25);
  
  doc.setFontSize(12);
  doc.setTextColor(50);
  doc.text(`Doctor Na Gola`, 14, 35);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 42);
  
  doc.setDrawColor(200);
  doc.line(14, 48, 196, 48);
  
  doc.setFontSize(14);
  doc.setTextColor(20);
  doc.text("Executive Summary", 14, 60);
  
  doc.setFontSize(11);
  doc.text(`Total Orders: ${allOrders.length}`, 20, 70);
  doc.text(`Total Revenue: Rs. ${totalRev}`, 20, 78);
  doc.text(`Pickup Orders: ${pickupCount}`, 20, 86);
  doc.text(`Parcel Orders: ${parcelCount}`, 20, 94);
  
  doc.setFontSize(14);
  doc.text("Top 10 Best Selling Items", 14, 115);
  
  doc.autoTable({
    startY: 125,
    head: [['Item Name', 'Quantity Sold']],
    body: topItems,
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235] },
    margin: { left: 14, right: 14 }
  });
  
  doc.save(`Sales_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}
