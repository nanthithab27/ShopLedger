const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function totals({ subtotal, discount, tax, cgst, sgst, total }) {
  return { subtotal, discount, tax, cgst, sgst, total };
}

test('#1001 invoices HSN lines at their 5% and 12% checkout rates', () => {
  // Saved order lines have HSN codes and omit gstRate.
  const order = {
    id: 1001,
    coupon: '',
    items: [
      { name: 'Rice', price: 100, qty: 2, hsn: '1006' },
      { name: 'Ghee', price: 300, qty: 1, hsn: '0405' }
    ]
  };

  const billed = pricing.computeTotals(order.items, order.coupon);
  const printed = invoice.computeInvoiceFigures(order);

  assert.deepEqual(totals(billed), {
    subtotal: 500, discount: 0, tax: 46, cgst: 23, sgst: 23, total: 546
  });
  assert.deepEqual(totals(printed), {
    subtotal: 500, discount: 0, tax: 46, cgst: 23, sgst: 23, total: 546
  });
  assert.deepEqual(billed.lines.map(line => line.gstPercent), [5, 12]);
  assert.deepEqual(printed.rows.map(row => [row.gstPercent, row.lineTax]), [
    [5, 10], [12, 36]
  ]);
});

test('#1002 invoices GST after applying SAVE10 to the pre-tax subtotal', () => {
  // An explicit rate keeps slab lookup out of this coupon comparison.
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [{ name: 'Ghee', price: 500, qty: 2, hsn: '0405', gstRate: 12 }]
  };

  const billed = pricing.computeTotals(order.items, order.coupon);
  const printed = invoice.computeInvoiceFigures(order);

  assert.deepEqual(totals(billed), {
    subtotal: 1000, discount: 100, tax: 108, cgst: 54, sgst: 54, total: 1008
  });
  assert.deepEqual(totals(printed), {
    subtotal: 1000, discount: 100, tax: 108, cgst: 54, sgst: 54, total: 1008
  });
  assert.deepEqual(printed.rows.map(row => [row.gstPercent, row.lineTax]), [[12, 108]]);
});

test('#1004 invoice applies the SAVE10 cap on 2240', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [{ name: 'Tea', price: 1120, qty: 2, hsn: '0902' }]
  };

  const billed = pricing.computeTotals(order.items, order.coupon);
  const printed = invoice.computeInvoiceFigures(order);

  assert.deepEqual(totals(billed), {
    subtotal: 2240, discount: 150, tax: 376.2, cgst: 188.1, sgst: 188.1, total: 2466.2
  });
  assert.deepEqual(totals(printed), {
    subtotal: 2240, discount: 150, tax: 376.2, cgst: 188.1, sgst: 188.1, total: 2466.2
  });
  assert.deepEqual(printed.rows.map(row => [row.gstPercent, row.lineTax]), [[18, 376.2]]);
});

test('CURRENT BEHAVIOUR: #1008 invoice matches checkout for 18% lines without a coupon', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      { name: 'Tea', price: 100, qty: 2, hsn: '0902' },
      { name: 'Coffee', price: 300, qty: 1, hsn: '0901' }
    ]
  };

  const billed = pricing.computeTotals(order.items, order.coupon);
  const printed = invoice.computeInvoiceFigures(order);

  assert.deepEqual(totals(printed), {
    subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590
  });
  assert.deepEqual(totals(printed), totals(billed));
  assert.deepEqual(printed.rows.map(row => [row.gstPercent, row.lineTax]), [
    [18, 36], [18, 54]
  ]);
});

test('invoice matches checkout on mixed GST slabs with a capped SAVE10 coupon', () => {
  const order = {
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 500, qty: 2, hsn: '1006' },
      { name: 'Ghee', price: 620, qty: 2, hsn: '0405' }
    ]
  };

  const billed = pricing.computeTotals(order.items, order.coupon);
  const printed = invoice.computeInvoiceFigures(order);

  assert.deepEqual(totals(billed), {
    subtotal: 2240, discount: 150, tax: 185.49, cgst: 92.75, sgst: 92.74, total: 2275.49
  });
  assert.deepEqual(totals(printed), totals(billed));
  assert.deepEqual(printed.rows.map(row => [row.gstPercent, row.lineTax]), [
    [5, 46.65], [12, 138.84]
  ]);

  const html = invoice.render({ ...order, id: 1010, total: billed.total });
  assert.match(html, /<td class="r">5%<\/td><td class="r">\u20b946\.65<\/td>/);
  assert.match(html, /<td class="r">12%<\/td><td class="r">\u20b9138\.84<\/td>/);
  assert.match(html, /Invoice Total<\/td><td class="r">\u20b92275\.49<\/td>/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
});
