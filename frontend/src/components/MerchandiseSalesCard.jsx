import { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Receipt,
  TrendingUp,
  Store,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Banknote,
  Smartphone,
  Tag,
} from 'lucide-react';
import PropTypes from 'prop-types';

// ---------------------------------------------------------------------------
// Static reference data (mirrors venueMatchDayMerchandiseEngine constants)
// ---------------------------------------------------------------------------

const PRODUCT_CATEGORIES = ['APPAREL', 'ACCESSORIES', 'FOOD_BEVERAGE', 'MEMORABILIA', 'PROGRAMMES', 'EQUIPMENT'];

const PAYMENT_METHODS = [
  { id: 'CARD', label: 'Card', icon: CreditCard },
  { id: 'CASH', label: 'Cash', icon: Banknote },
  { id: 'MOBILE', label: 'Mobile', icon: Smartphone },
  { id: 'VOUCHER', label: 'Voucher', icon: Tag },
];

const STALL_ZONES = ['NORTH_CONCOURSE', 'SOUTH_CONCOURSE', 'EAST_GATE', 'WEST_GATE', 'MAIN_ENTRANCE', 'ONLINE_PICKUP'];

const VAT_RATE = 0.15;
const CATEGORY_COLORS = {
  APPAREL: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  ACCESSORIES: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  FOOD_BEVERAGE: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  MEMORABILIA: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  PROGRAMMES: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  EQUIPMENT: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtGBP(val) {
  return `£${Number(val).toFixed(2)}`;
}

function calcAvailable(product) {
  return product.stockQty - product.soldQty;
}

function PaymentIcon({ method, className }) {
  const found = PAYMENT_METHODS.find((m) => m.id === method);
  if (!found) return null;
  const Icon = found.icon;
  return <Icon className={className} />;
}
PaymentIcon.propTypes = { method: PropTypes.string.isRequired, className: PropTypes.string };
PaymentIcon.defaultProps = { className: 'w-4 h-4' };

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function MerchandiseSalesCard({ stallId, stallZone, matchId, initialProducts, initialSales }) {
  // Catalogue
  const [products, setProducts] = useState(initialProducts);
  const [filterCat, setFilterCat] = useState('ALL');

  // Cart
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('CARD');

  // Sales log
  const [sales, setSales] = useState(initialSales);
  const [lastSaleId, setLastSaleId] = useState(null);

  // Add product form
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState(PRODUCT_CATEGORIES[0]);
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');

  // Revenue panel
  const [showRevenue, setShowRevenue] = useState(false);

  // -------------------------------------------------------------------------
  // Cart helpers
  // -------------------------------------------------------------------------

  function addToCart(product) {
    const available = calcAvailable(product);
    if (available <= 0) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === product.productId);
      if (existing) {
        if (existing.qty >= available) return prev;
        return prev.map((c) =>
          c.productId === product.productId ? { ...c, qty: c.qty + 1 } : c,
        );
      }
      return [...prev, { productId: product.productId, name: product.name, unitPriceGBP: product.unitPriceGBP, qty: 1 }];
    });
  }

  function decrementCart(productId) {
    setCart((prev) =>
      prev
        .map((c) => (c.productId === productId ? { ...c, qty: c.qty - 1 } : c))
        .filter((c) => c.qty > 0),
    );
  }

  function removeFromCart(productId) {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  }

  // -------------------------------------------------------------------------
  // Sale recording
  // -------------------------------------------------------------------------

  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce((sum, c) => sum + c.unitPriceGBP * c.qty, 0);
    const vat = Math.round(subtotal * VAT_RATE * 100) / 100;
    const total = Math.round((subtotal + vat) * 100) / 100;
    return { subtotal: Math.round(subtotal * 100) / 100, vat, total };
  }, [cart]);

  function handleCheckout() {
    if (cart.length === 0) return;

    const saleId = `SALE-${Date.now()}`;
    const lines = cart.map((c) => ({
      productId: c.productId,
      name: c.name,
      qty: c.qty,
      unitPriceGBP: c.unitPriceGBP,
      lineTotalGBP: Math.round(c.unitPriceGBP * c.qty * 100) / 100,
    }));

    const newSale = {
      saleId,
      stallId,
      matchId,
      paymentMethod,
      items: lines,
      subtotalGBP: cartTotals.subtotal,
      vatAmountGBP: cartTotals.vat,
      totalGBP: cartTotals.total,
      status: 'COMPLETED',
      recordedAt: new Date().toISOString(),
    };

    // Deduct from stock
    setProducts((prev) =>
      prev.map((p) => {
        const line = lines.find((l) => l.productId === p.productId);
        if (!line) return p;
        return { ...p, soldQty: p.soldQty + line.qty };
      }),
    );

    setSales((prev) => [newSale, ...prev]);
    setLastSaleId(saleId);
    setCart([]);
    setTimeout(() => setLastSaleId(null), 4000);
  }

  // -------------------------------------------------------------------------
  // Add product
  // -------------------------------------------------------------------------

  function handleAddProduct() {
    const price = parseFloat(newPrice);
    const stock = parseInt(newStock, 10);
    if (!newName.trim() || isNaN(price) || price <= 0 || isNaN(stock) || stock < 0) return;
    const product = {
      productId: `PROD-${Date.now()}`,
      name: newName.trim(),
      category: newCat,
      unitPriceGBP: Math.round(price * 100) / 100,
      stockQty: stock,
      soldQty: 0,
      description: '',
    };
    setProducts((prev) => [...prev, product]);
    setNewName('');
    setNewPrice('');
    setNewStock('');
    setShowAddProduct(false);
  }

  // -------------------------------------------------------------------------
  // Revenue summary
  // -------------------------------------------------------------------------

  const revenue = useMemo(() => {
    const completed = sales.filter((s) => s.status === 'COMPLETED');
    const refunded = sales.filter((s) => s.status === 'REFUNDED');
    const gross = completed.reduce((s, x) => s + x.totalGBP, 0);
    const refundTotal = refunded.reduce((s, x) => s + x.totalGBP, 0);
    const totalVat = completed.reduce((s, x) => s + x.vatAmountGBP, 0);

    const byMethod = {};
    for (const sale of completed) {
      byMethod[sale.paymentMethod] = (byMethod[sale.paymentMethod] ?? 0) + sale.totalGBP;
    }

    const topProducts = {};
    for (const sale of completed) {
      for (const line of sale.items) {
        if (!topProducts[line.productId]) {
          topProducts[line.productId] = { name: line.name, units: 0, revenue: 0 };
        }
        topProducts[line.productId].units += line.qty;
        topProducts[line.productId].revenue += line.lineTotalGBP;
      }
    }

    return {
      gross: Math.round(gross * 100) / 100,
      net: Math.round((gross - refundTotal) * 100) / 100,
      vat: Math.round(totalVat * 100) / 100,
      refunds: Math.round(refundTotal * 100) / 100,
      txCount: completed.length,
      byMethod,
      topProducts: Object.entries(topProducts)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 5),
    };
  }, [sales]);

  const filteredProducts = useMemo(
    () => (filterCat === 'ALL' ? products : products.filter((p) => p.category === filterCat)),
    [products, filterCat],
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="bg-slate-950/95 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl w-full max-w-2xl">
      {/* Accent bar */}
      <div className="h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-500" />

      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-slate-800/60 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 mt-0.5">
          <ShoppingBag className="w-5 h-5 text-orange-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-bold text-slate-100 leading-tight">Merchandise Sales POS</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            <Store className="w-3 h-3 inline mr-1" />
            <span className="font-mono text-orange-400">{stallId}</span>
            <span className="mx-1.5 text-slate-600">·</span>
            {stallZone.replace('_', ' ')}
            <span className="mx-1.5 text-slate-600">·</span>
            Match <span className="font-mono text-amber-400">{matchId}</span>
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
            {products.length} products
          </span>
          <span className="px-2 py-1 rounded-lg bg-emerald-900/30 text-emerald-300 border border-emerald-700/30">
            {fmtGBP(revenue.net)} net
          </span>
        </div>
      </div>

      {/* Product catalogue */}
      <div className="px-5 py-3 border-b border-slate-800/40">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Catalogue</p>
          <button
            onClick={() => setShowAddProduct((p) => !p)}
            className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> {showAddProduct ? 'Cancel' : 'Add Product'}
          </button>
        </div>

        {/* Add product form */}
        {showAddProduct && (
          <div className="mb-3 rounded-xl bg-slate-800/50 border border-slate-700/40 p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Product name"
                className="col-span-2 bg-slate-900/60 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
              />
              <select
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                className="bg-slate-900/60 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
              >
                {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="Price £"
                  min="0.01"
                  step="0.01"
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
                <input
                  type="number"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  placeholder="Stock"
                  min="0"
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
            <button
              onClick={handleAddProduct}
              disabled={!newName.trim() || !newPrice || !newStock}
              className="w-full py-1.5 rounded-lg bg-orange-700 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-xs text-white font-semibold transition-colors"
            >
              Add to Catalogue
            </button>
          </div>
        )}

        {/* Category filter */}
        <div className="flex gap-1.5 flex-wrap mb-2">
          {['ALL', ...PRODUCT_CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-2 py-0.5 rounded-lg text-xs border transition-colors ${
                filterCat === cat
                  ? 'bg-orange-600/40 border-orange-500/60 text-orange-200'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              {cat === 'ALL' ? 'All' : cat.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
          {filteredProducts.length === 0 && (
            <p className="col-span-2 text-xs text-slate-500 italic text-center py-3">No products in this category.</p>
          )}
          {filteredProducts.map((product) => {
            const available = calcAvailable(product);
            const inCart = cart.find((c) => c.productId === product.productId)?.qty ?? 0;
            return (
              <div
                key={product.productId}
                className={`rounded-xl bg-slate-800/50 border border-slate-700/30 p-2.5 flex flex-col gap-1 ${available === 0 ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start justify-between gap-1">
                  <p className="text-xs font-semibold text-slate-200 leading-tight">{product.name}</p>
                  <span className={`inline-flex shrink-0 items-center px-1.5 py-0.5 rounded-md text-xs border ${CATEGORY_COLORS[product.category] ?? 'text-slate-400 bg-slate-700/30 border-slate-600'}`}>
                    {product.category.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <div>
                    <p className="text-sm font-bold text-orange-300">{fmtGBP(product.unitPriceGBP)}</p>
                    <p className={`text-xs ${available <= 5 && available > 0 ? 'text-amber-400' : available === 0 ? 'text-red-400' : 'text-slate-500'}`}>
                      {available === 0 ? 'Out of stock' : `${available} left`}
                    </p>
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    disabled={available === 0 || inCart >= available}
                    className="p-1.5 rounded-lg bg-orange-600/30 hover:bg-orange-600/60 disabled:opacity-30 disabled:cursor-not-allowed border border-orange-600/30 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-orange-300" />
                  </button>
                </div>
                {inCart > 0 && (
                  <div className="text-xs text-orange-400 font-semibold">In cart: {inCart}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Cart & checkout */}
      <div className="px-5 py-3 border-b border-slate-800/40">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
          Cart {cart.length > 0 && <span className="text-orange-400 normal-case font-normal">({cart.length} item{cart.length !== 1 ? 's' : ''})</span>}
        </p>

        {cart.length === 0 ? (
          <p className="text-xs text-slate-500 italic text-center py-2">Cart is empty. Add items from the catalogue.</p>
        ) : (
          <div className="space-y-1.5 mb-3 max-h-32 overflow-y-auto pr-1">
            {cart.map((item) => (
              <div key={item.productId} className="flex items-center gap-2 rounded-lg bg-slate-800/40 px-2.5 py-1.5">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-200 truncate">{item.name}</p>
                  <p className="text-xs text-slate-400">{fmtGBP(item.unitPriceGBP)} each</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => decrementCart(item.productId)} className="p-0.5 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors">
                    <Minus className="w-3 h-3 text-slate-300" />
                  </button>
                  <span className="text-xs font-bold text-slate-200 w-5 text-center">{item.qty}</span>
                  <button
                    onClick={() => {
                      const product = products.find((p) => p.productId === item.productId);
                      if (product) addToCart(product);
                    }}
                    className="p-0.5 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors"
                  >
                    <Plus className="w-3 h-3 text-slate-300" />
                  </button>
                </div>
                <p className="text-xs font-semibold text-orange-300 w-14 text-right">
                  {fmtGBP(item.unitPriceGBP * item.qty)}
                </p>
                <button onClick={() => removeFromCart(item.productId)} className="p-0.5 rounded-md hover:bg-red-800/40 transition-colors">
                  <Trash2 className="w-3.5 h-3.5 text-slate-500 hover:text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Totals */}
        {cart.length > 0 && (
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/30 px-3 py-2 mb-3 space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span><span className="text-slate-200">{fmtGBP(cartTotals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>VAT (15%)</span><span className="text-slate-200">{fmtGBP(cartTotals.vat)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm border-t border-slate-700/40 pt-1">
              <span className="text-slate-200">Total</span><span className="text-orange-300">{fmtGBP(cartTotals.total)}</span>
            </div>
          </div>
        )}

        {/* Payment method selector */}
        <div className="flex gap-2 mb-3">
          {PAYMENT_METHODS.map((pm) => {
            const Icon = pm.icon;
            return (
              <button
                key={pm.id}
                onClick={() => setPaymentMethod(pm.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                  paymentMethod === pm.id
                    ? 'bg-orange-600/30 border-orange-500/60 text-orange-200'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                {pm.label}
              </button>
            );
          })}
        </div>

        {/* Checkout button / success */}
        {lastSaleId ? (
          <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-900/20 border border-emerald-700/30 rounded-xl px-3 py-2">
            <CheckCircle2 className="w-4 h-4" />
            Sale <span className="font-mono">{lastSaleId}</span> recorded successfully
          </div>
        ) : (
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            <Receipt className="w-4 h-4" />
            Complete Sale {cart.length > 0 && `· ${fmtGBP(cartTotals.total)}`}
          </button>
        )}
      </div>

      {/* Revenue panel */}
      <div className="px-5 py-3">
        <button
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-widest hover:text-slate-300 transition-colors mb-1"
          onClick={() => setShowRevenue((p) => !p)}
        >
          <span className="flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Revenue Summary ({revenue.txCount} sales)</span>
          {showRevenue ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showRevenue && (
          <div className="space-y-3 mt-2">
            {/* KPI row */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Gross', value: fmtGBP(revenue.gross), color: 'text-orange-300' },
                { label: 'Net', value: fmtGBP(revenue.net), color: 'text-emerald-300' },
                { label: 'VAT', value: fmtGBP(revenue.vat), color: 'text-blue-300' },
                { label: 'Refunds', value: fmtGBP(revenue.refunds), color: 'text-red-400' },
              ].map((kpi) => (
                <div key={kpi.label} className="bg-slate-800/50 rounded-xl px-2 py-2 text-center">
                  <div className={`text-sm font-bold ${kpi.color}`}>{kpi.value}</div>
                  <div className="text-xs text-slate-400">{kpi.label}</div>
                </div>
              ))}
            </div>

            {/* By payment method */}
            {Object.keys(revenue.byMethod).length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-1.5">By Payment Method</p>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(revenue.byMethod).map(([method, total]) => (
                    <div key={method} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/50 border border-slate-700/40 text-xs">
                      <PaymentIcon method={method} className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-300">{method}</span>
                      <span className="font-bold text-orange-300">{fmtGBP(total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top products */}
            {revenue.topProducts.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-1.5">Top Products</p>
                <div className="space-y-1">
                  {revenue.topProducts.map(([productId, data]) => (
                    <div key={productId} className="flex items-center gap-2 text-xs rounded-lg bg-slate-800/30 px-2.5 py-1.5">
                      <div className="flex-1 text-slate-300 truncate">{data.name}</div>
                      <span className="text-slate-400">{data.units} sold</span>
                      <span className="font-bold text-amber-300">{fmtGBP(data.revenue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {revenue.txCount === 0 && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 italic">
                <AlertTriangle className="w-3.5 h-3.5" /> No sales recorded yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

MerchandiseSalesCard.propTypes = {
  stallId: PropTypes.string,
  stallZone: PropTypes.string,
  matchId: PropTypes.string,
  initialProducts: PropTypes.arrayOf(
    PropTypes.shape({
      productId: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      category: PropTypes.string.isRequired,
      unitPriceGBP: PropTypes.number.isRequired,
      stockQty: PropTypes.number.isRequired,
      soldQty: PropTypes.number,
    }),
  ),
  initialSales: PropTypes.arrayOf(
    PropTypes.shape({
      saleId: PropTypes.string.isRequired,
      stallId: PropTypes.string,
      paymentMethod: PropTypes.string,
      items: PropTypes.array,
      subtotalGBP: PropTypes.number,
      vatAmountGBP: PropTypes.number,
      totalGBP: PropTypes.number,
      status: PropTypes.string,
      recordedAt: PropTypes.string,
    }),
  ),
};

MerchandiseSalesCard.defaultProps = {
  stallId: 'STALL-01',
  stallZone: STALL_ZONES[0],
  matchId: 'MATCH-001',
  initialProducts: [],
  initialSales: [],
};
