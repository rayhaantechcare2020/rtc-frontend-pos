import * as XLSX from 'xlsx';

// Main export function
export const exportToExcel = (data, filename, sheetName = 'Sheet1') => {
  try {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    const dateStr = new Date().toISOString().split('T')[0];
    const fullFilename = `${filename}_${dateStr}.xlsx`;
    
    XLSX.writeFile(wb, fullFilename);
    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return false;
  }
};

// ============================================
// PAYMENT REPORTS
// ============================================

// All Payments formatter
export const formatAllPaymentsData = (payments, formatCurrency) => {
  return payments.map(p => ({
    'Date': p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '-',
    'Customer Name': p.customer?.name || 'N/A',
    'Customer Phone': p.customer?.phone || '-',
    'Invoice Number': p.sale?.invoice_number || '-',
    'Payment Method': p.payment_method?.toUpperCase() || '-',
    'Amount (₦)': p.amount,
    'Reference': p.reference || '-',
    'Status': p.status || 'completed',
    'Notes': p.notes || '-',
    'Recorded By': p.user?.name || 'System',
    'Date Recorded': p.created_at ? new Date(p.created_at).toLocaleDateString() : '-'
  }));
};

// Outstanding Payments formatter
export const formatOutstandingData = (customers, formatCurrency) => {
  return customers.map(c => ({
    'Customer Name': c.name,
    'Phone': c.phone || '-',
    'Email': c.email || '-',
    'Current Balance (₦)': c.current_balance,
    'Credit Limit (₦)': c.credit_limit || 'No Limit',
    'Over Limit': c.current_balance > (c.credit_limit || Infinity) ? 'Yes' : 'No',
    'Last Purchase': c.last_purchase ? new Date(c.last_purchase).toLocaleDateString() : '-'
  }));
};

// Payment Methods Stats formatter
export const formatPaymentMethodsData = (stats, totalAmount, formatCurrency) => {
  return stats.map(s => ({
    'Payment Method': s.payment_method?.toUpperCase() || '-',
    'Number of Transactions': s.count || 0,
    'Total Amount (₦)': s.total || 0,
    'Average per Transaction (₦)': s.count ? s.total / s.count : 0,
    'Percentage of Total': totalAmount ? ((s.total / totalAmount) * 100).toFixed(1) + '%' : '0%'
  }));
};

// Payment Summary formatter
export const formatPaymentSummaryData = (summary, formatCurrency) => {
  const summaryRows = [
    { 'Metric': 'Period From', 'Value': summary.period?.from || '-' },
    { 'Metric': 'Period To', 'Value': summary.period?.to || '-' },
    { 'Metric': 'Total Payments', 'Value': summary.total_payments || 0 },
    { 'Metric': 'Total Amount (₦)', 'Value': summary.total_amount || 0 }
  ];

  const methodRows = Object.entries(summary.by_method || {}).map(([method, data]) => ({
    'Payment Method': method,
    'Transactions': data.count,
    'Amount (₦)': data.amount,
    'Percentage': summary.total_amount ? ((data.amount / summary.total_amount) * 100).toFixed(1) + '%' : '0%'
  }));

  const customerRows = Object.entries(summary.by_customer || {}).map(([id, data]) => ({
    'Customer': data.customer_name || 'Unknown',
    'Number of Payments': data.count,
    'Total Paid (₦)': data.amount,
    'Percentage': summary.total_amount ? ((data.amount / summary.total_amount) * 100).toFixed(1) + '%' : '0%'
  }));

  return { summaryRows, methodRows, customerRows };
};

// ============================================
// INVENTORY & STOCK REPORTS
// ============================================

// Stock Levels formatter
export const formatStockData = (products, formatCurrency) => {
  return products.map(p => ({
    'Product Name': p.name,
    'SKU': p.sku || '-',
    'Category': p.category?.name || 'Uncategorized',
    'Current Stock': p.stock_quantity,
    'Low Stock Threshold': p.low_stock_threshold || 5,
    'Status': p.stock_quantity <= 0 ? 'Out of Stock' : 
             p.stock_quantity <= (p.low_stock_threshold || 5) ? 'Low Stock' : 'In Stock',
    'Cost Price': formatCurrency ? formatCurrency(p.cost) : p.cost,
    'Selling Price': formatCurrency ? formatCurrency(p.price) : p.price,
    'Stock Value': formatCurrency ? formatCurrency(p.stock_quantity * (p.cost || 0)) : (p.stock_quantity * (p.cost || 0)),
    'Last Updated': p.updated_at ? new Date(p.updated_at).toLocaleDateString() : '-'
  }));
};

// Low Stock formatter
export const formatLowStockData = (products, formatCurrency) => {
  return products.map(p => ({
    'Product Name': p.name,
    'SKU': p.sku || '-',
    'Category': p.category?.name || 'Uncategorized',
    'Current Stock': p.stock_quantity,
    'Threshold': p.low_stock_threshold || 5,
    'Status': p.stock_quantity <= 0 ? 'Out of Stock' : 'Low Stock',
    'Stock Value': formatCurrency ? formatCurrency(p.stock_quantity * (p.cost || 0)) : (p.stock_quantity * (p.cost || 0)),
    'Last Updated': p.updated_at ? new Date(p.updated_at).toLocaleDateString() : '-'
  }));
};

// Stock Adjustments formatter
export const formatAdjustmentsData = (adjustments, formatCurrency) => {
  return adjustments.map(a => ({
    'Date': a.date ? new Date(a.date).toLocaleDateString() : '-',
    'Product': a.product_name || a.product?.name,
    'SKU': a.product_sku || a.product?.sku || '-',
    'Type': a.type === 'add' ? 'Addition' : a.type === 'remove' ? 'Removal' : 'Set',
    'Quantity': a.quantity,
    'Old Stock': a.old_stock,
    'New Stock': a.new_stock,
    'Reason': a.reason || '-',
    'Notes': a.notes || '-',
    'Adjusted By': a.user?.name || 'System'
  }));
};

// Direct Receives formatter
export const formatDirectReceivesData = (receives, formatCurrency) => {
  return receives.map(r => ({
    'Reference': r.reference_number,
    'Date': r.receive_date ? new Date(r.receive_date).toLocaleDateString() : '-',
    'Vendor': r.vendor_name || r.vendor?.name,
    'Items': r.items?.length || 0,
    'Subtotal': formatCurrency ? formatCurrency(r.subtotal) : r.subtotal,
    'Total': formatCurrency ? formatCurrency(r.total) : r.total,
    'Payment Status': r.payment_status,
    'Payment Method': r.payment_method || '-',
    'Waybill': r.waybill_number || '-',
    'Truck': r.truck_number || '-',
    'Driver': r.driver_name || '-',
    'Created By': r.user?.name || 'System'
  }));
};

// ============================================
// PRODUCT REPORTS
// ============================================

// Products formatter
export const formatProductsData = (products, formatCurrency) => {
  return products.map(p => ({
    'Product Name': p.name,
    'SKU': p.sku || '-',
    'Category': p.category?.name || 'Uncategorized',
    'Price': formatCurrency ? formatCurrency(p.price) : p.price,
    'Cost': formatCurrency ? formatCurrency(p.cost) : p.cost,
    'Stock': p.stock_quantity,
    'Status': p.status || 'active',
    'Created': p.created_at ? new Date(p.created_at).toLocaleDateString() : '-'
  }));
};

// Categories formatter
export const formatCategoriesData = (categories) => {
  return categories.map(c => ({
    'Name': c.name,
    'Slug': c.slug,
    'Description': c.description || '-',
    'Products': c.products_count || 0,
    'Status': c.status,
    'Created': c.created_at ? new Date(c.created_at).toLocaleDateString() : '-'
  }));
};

// ============================================
// SALES REPORTS
// ============================================

// Sales formatter
export const formatSalesData = (sales, formatCurrency) => {
  return sales.map(s => ({
    'Invoice #': s.invoice_number,
    'Date': new Date(s.created_at).toLocaleDateString(),
    'Time': new Date(s.created_at).toLocaleTimeString(),
    'Customer': s.customer?.name || 'Walk-in',
    'Items': s.item_count,
    'Subtotal': formatCurrency ? formatCurrency(s.subtotal) : s.subtotal,
    'Discount': formatCurrency ? formatCurrency(s.discount) : s.discount,
    'Total': formatCurrency ? formatCurrency(s.total) : s.total,
    'Amount Paid': formatCurrency ? formatCurrency(s.amount_paid) : s.amount_paid,
    'Change': formatCurrency ? formatCurrency(s.change_due) : s.change_due,
    'Balance': formatCurrency ? formatCurrency(s.balance_due) : s.balance_due,
    'Payment Method': s.payments?.[0]?.payment_method || 'cash',
    'Payment Status': s.payment_status,
    'Status': s.status,
    'Cashier': s.user?.name || 'System'
  }));
};

// Sale Items formatter
export const formatSaleItemsData = (sale, formatCurrency) => {
  return sale.items?.map(item => ({
    'Invoice #': sale.invoice_number,
    'Date': new Date(sale.created_at).toLocaleDateString(),
    'Customer': sale.customer?.name || 'Walk-in',
    'Product': item.product_name,
    'SKU': item.product_sku || '-',
    'Quantity': item.quantity,
    'Price': formatCurrency ? formatCurrency(item.price) : item.price,
    'Subtotal': formatCurrency ? formatCurrency(item.subtotal) : item.subtotal,
    'Cost': formatCurrency ? formatCurrency(item.cost) : item.cost,
    'Profit': formatCurrency ? formatCurrency((item.price - item.cost) * item.quantity) : ((item.price - item.cost) * item.quantity)
  })) || [];
};

// Daily Sales formatter
export const formatDailySalesData = (summary, transactions, formatCurrency) => {
  const summaryData = [
    { 'Metric': 'Date', 'Value': summary.date },
    { 'Metric': 'Total Revenue', 'Value': formatCurrency ? formatCurrency(summary.total_revenue) : summary.total_revenue },
    { 'Metric': 'Total Profit', 'Value': formatCurrency ? formatCurrency(summary.total_profit) : summary.total_profit },
    { 'Metric': 'Total Transactions', 'Value': summary.total_transactions },
    { 'Metric': 'Total Items Sold', 'Value': summary.total_items_sold },
    { 'Metric': 'Average Sale', 'Value': formatCurrency ? formatCurrency(summary.average_sale) : summary.average_sale },
    { 'Metric': 'Cash Sales', 'Value': formatCurrency ? formatCurrency(summary.by_payment_method?.cash) : summary.by_payment_method?.cash },
    { 'Metric': 'Transfer Sales', 'Value': formatCurrency ? formatCurrency(summary.by_payment_method?.transfer) : summary.by_payment_method?.transfer },
    { 'Metric': 'POS Sales', 'Value': formatCurrency ? formatCurrency(summary.by_payment_method?.pos) : summary.by_payment_method?.pos },
    { 'Metric': 'Credit Sales', 'Value': formatCurrency ? formatCurrency(summary.by_payment_method?.credit) : summary.by_payment_method?.credit }
  ];

  const transactionData = transactions?.map(t => ({
    'Time': t.time,
    'Invoice': t.invoice,
    'Customer': t.customer,
    'Items': t.items,
    'Total': formatCurrency ? formatCurrency(t.total) : t.total,
    'Payment': t.payment
  })) || [];

  return { summaryData, transactionData };
};

// Sales Range formatter
export const formatSalesRangeData = (summary, breakdown, formatCurrency) => {
  const summaryData = [
    { 'Metric': 'From', 'Value': summary.from },
    { 'Metric': 'To', 'Value': summary.to },
    { 'Metric': 'Total Sales', 'Value': summary.total_sales },
    { 'Metric': 'Total Revenue', 'Value': formatCurrency ? formatCurrency(summary.total_revenue) : summary.total_revenue },
    { 'Metric': 'Total Profit', 'Value': formatCurrency ? formatCurrency(summary.total_profit) : summary.total_profit },
    { 'Metric': 'Average Sale', 'Value': formatCurrency ? formatCurrency(summary.average_sale) : summary.average_sale },
    { 'Metric': 'Cash', 'Value': formatCurrency ? formatCurrency(summary.by_payment_method?.cash) : summary.by_payment_method?.cash },
    { 'Metric': 'Transfer', 'Value': formatCurrency ? formatCurrency(summary.by_payment_method?.transfer) : summary.by_payment_method?.transfer },
    { 'Metric': 'POS', 'Value': formatCurrency ? formatCurrency(summary.by_payment_method?.pos) : summary.by_payment_method?.pos },
    { 'Metric': 'Credit', 'Value': formatCurrency ? formatCurrency(summary.by_payment_method?.credit) : summary.by_payment_method?.credit }
  ];

  const breakdownData = breakdown?.map(b => ({
    'Period': b.period,
    'Sales Count': b.count,
    'Items Sold': b.items_sold,
    'Revenue': formatCurrency ? formatCurrency(b.revenue) : b.revenue,
    'Profit': formatCurrency ? formatCurrency(b.profit) : b.profit
  })) || [];

  return { summaryData, breakdownData };
};

// Top Products formatter
export const formatTopProductsData = (products, formatCurrency) => {
  return products.map((p, index) => ({
    'Rank': index + 1,
    'Product Name': p.name,
    'SKU': p.sku || '-',
    'Quantity Sold': p.total_quantity,
    'Revenue': formatCurrency ? formatCurrency(p.total_revenue) : p.total_revenue,
    'Profit': formatCurrency ? formatCurrency(p.total_profit) : p.total_profit,
    'Margin (%)': p.profit_margin,
    '% of Revenue': p.revenue_percentage
  }));
};

// Profit & Loss formatter
export const formatProfitLossData = (data, formatCurrency) => {
  const summaryData = [
    { 'Metric': 'Period From', 'Value': data.period?.from },
    { 'Metric': 'Period To', 'Value': data.period?.to },
    { 'Metric': 'Revenue', 'Value': formatCurrency ? formatCurrency(data.summary?.revenue) : data.summary?.revenue },
    { 'Metric': 'Cost of Goods Sold', 'Value': formatCurrency ? formatCurrency(data.summary?.cogs) : data.summary?.cogs },
    { 'Metric': 'Gross Profit', 'Value': formatCurrency ? formatCurrency(data.summary?.gross_profit) : data.summary?.gross_profit },
    { 'Metric': 'Gross Margin (%)', 'Value': data.summary?.gross_margin }
  ];

  const breakdownData = data.revenue_breakdown?.map(item => ({
    'Category': item.name || 'Uncategorized',
    'Revenue': formatCurrency ? formatCurrency(item.revenue) : item.revenue,
    '% of Total': data.summary?.revenue ? ((item.revenue / data.summary.revenue) * 100).toFixed(1) : 0
  })) || [];

  return { summaryData, breakdownData };
};

// ============================================
// CUSTOMER & VENDOR REPORTS
// ============================================

// Customers formatter
export const formatCustomersData = (customers, formatCurrency) => {
  return customers.map(c => ({
    'Name': c.name,
    'Email': c.email || '-',
    'Phone': c.phone || '-',
    'Address': c.address || '-',
    'Total Purchases': c.total_purchases || 0,
    'Total Spent': formatCurrency ? formatCurrency(c.total_spent) : c.total_spent,
    'Current Balance': formatCurrency ? formatCurrency(c.current_balance) : c.current_balance,
    'Credit Limit': formatCurrency ? formatCurrency(c.credit_limit) : c.credit_limit,
    'Status': c.status,
    'Last Purchase': c.last_purchase ? new Date(c.last_purchase).toLocaleDateString() : '-',
    'Created': c.created_at ? new Date(c.created_at).toLocaleDateString() : '-'
  }));
};

// Vendors formatter
export const formatVendorsData = (vendors) => {
  return vendors.map(v => ({
    'Name': v.name,
    'Contact Person': v.contact_person || '-',
    'Email': v.email || '-',
    'Phone': v.phone || '-',
    'Address': v.address || '-',
    'Tax Number': v.tax_number || '-',
    'Payment Terms': v.payment_terms || '-',
    'Status': v.status,
    'Created': v.created_at ? new Date(v.created_at).toLocaleDateString() : '-'
  }));
};

// ============================================
// PURCHASE REPORTS
// ============================================

// Purchase Orders formatter
export const formatPurchaseOrdersData = (orders, formatCurrency) => {
  return orders.map(o => ({
    'PO Number': o.po_number,
    'Order Date': o.order_date ? new Date(o.order_date).toLocaleDateString() : '-',
    'Vendor': o.vendor?.name || o.vendor_name,
    'Items': o.items?.length || 0,
    'Subtotal': formatCurrency ? formatCurrency(o.subtotal) : o.subtotal,
    'Total': formatCurrency ? formatCurrency(o.total) : o.total,
    'Status': o.status,
    'Payment Status': o.payment_status,
    'Expected Delivery': o.expected_delivery_date ? new Date(o.expected_delivery_date).toLocaleDateString() : '-',
    'Delivery Date': o.delivery_date ? new Date(o.delivery_date).toLocaleDateString() : '-',
    'Created By': o.user?.name || 'System'
  }));
};

// ============================================
// USER & AUDIT REPORTS
// ============================================

// Users formatter
export const formatUsersData = (users) => {
  return users.map(u => ({
    'Name': u.name,
    'Email': u.email,
    'Role': u.role || 'staff',
    'Status': u.status || 'active',
    'Last Login': u.last_login_at ? new Date(u.last_login_at).toLocaleString() : '-',
    'Created': u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'
  }));
};

// Audit Logs formatter
export const formatAuditLogsData = (logs) => {
  return logs.map(l => ({
    'Date & Time': l.created_at ? new Date(l.created_at).toLocaleString() : '-',
    'User': l.user?.name || 'System',
    'Action': l.action,
    'Description': l.description || '-',
    'IP Address': l.ip_address || '-',
    'User Agent': l.user_agent || '-'
  }));
};