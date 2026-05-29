import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Categories from './components/Categories';
import ProductList from './components/ProductList';
import DetailModal from './components/DetailModal';
import Features from './components/Features';
import Newsletter from './components/Newsletter';
import Footer from './components/Footer';
import { ShoppingBag, Trash2, X, Plus, Minus, CreditCard, Sparkles } from 'lucide-react';
import './App.css';

export default function App() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Cart operations
  const handleAddToCart = (product) => {
    const qtyToAdd = product.quantity || 1;
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + qtyToAdd }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: qtyToAdd }];
    });
  };

  const handleUpdateQuantity = (productId, change) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + change) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const handleCheckout = () => {
    setCart([]);
    setCartOpen(false);
    setCheckoutSuccess(true);
    setTimeout(() => {
      setCheckoutSuccess(false);
    }, 4000);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-body-md text-on-surface">
      {/* Top Navigation */}
      <Header 
        activeCategory={activeCategory} 
        setActiveCategory={setActiveCategory} 
        onOpenCart={() => setCartOpen(true)}
      />

      {/* Hero Section */}
      <Hero onExploreClick={() => {
        document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
      }} />

      {/* Categories Selection */}
      <Categories 
        activeCategory={activeCategory} 
        setActiveCategory={setActiveCategory} 
      />

      {/* Product List Grid */}
      <ProductList 
        activeCategory={activeCategory} 
        onProductSelect={setSelectedProduct} 
        onAddToCart={handleAddToCart}
      />

      {/* Trust Features */}
      <Features />

      {/* Promotion / Newsletter */}
      <Newsletter />

      {/* Footer */}
      <Footer />

      {/* Product Detail & 3D Viewer Modal */}
      {selectedProduct && (
        <DetailModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Sliding Shopping Cart Drawer */}
      {cartOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end transition-opacity duration-300"
          onClick={() => setCartOpen(false)}
        >
          <div 
            className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between relative animate-slide-in-right p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-primary" />
                <h3 className="font-display-lg text-lg font-bold text-slate-800">
                  Giỏ Hàng ({cartItemCount})
                </h3>
              </div>
              <button 
                onClick={() => setCartOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full transition-all text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 text-center py-20">
                  <ShoppingBag className="w-16 h-16 stroke-1" />
                  <p className="font-semibold text-sm">Giỏ hàng của bạn đang trống</p>
                  <button 
                    onClick={() => setCartOpen(false)}
                    className="px-6 py-2.5 bg-primary/10 text-primary text-xs font-bold rounded-xl hover:bg-primary/20 transition-all"
                  >
                    Tiếp tục mua sắm
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div 
                    key={item.id}
                    className="flex gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 items-center justify-between"
                  >
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-16 h-16 object-cover rounded-xl shrink-0" 
                    />
                    
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-slate-800 line-clamp-1">{item.name}</h4>
                      <p className="text-xs text-primary font-bold mt-1">{formatPrice(item.price)}</p>
                      
                      {/* Quantity Selector inside cart */}
                      <div className="flex items-center gap-2 mt-2">
                        <button 
                          onClick={() => handleUpdateQuantity(item.id, -1)}
                          className="p-1 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-all"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-bold text-slate-800 px-1">{item.quantity}</span>
                        <button 
                          onClick={() => handleUpdateQuantity(item.id, 1)}
                          className="p-1 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleRemoveFromCart(item.id)}
                      className="p-2 hover:bg-rose-50 text-rose-500 hover:text-rose-600 rounded-xl transition-all self-center"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer */}
            {cart.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center mb-6">
                  <span className="font-semibold text-slate-500 text-sm">Tổng cộng:</span>
                  <span className="text-2xl font-extrabold text-primary">{formatPrice(cartTotal)}</span>
                </div>
                
                <button 
                  onClick={handleCheckout}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white font-bold text-sm rounded-2xl hover:bg-emerald-700 active:scale-98 transition-all duration-150 shadow-lg shadow-primary/10"
                >
                  <CreditCard className="w-5 h-5" />
                  Thanh Toán Ngay
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Success Toast */}
      {checkoutSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-800 animate-fade-in-up">
          <Sparkles className="w-5 h-5 text-yellow-300" />
          <div>
            <p className="font-bold text-sm">Thanh toán hoàn tất!</p>
            <p className="text-xs text-slate-400">Cảm ơn bạn đã lựa chọn Nông Hải Sản 360.</p>
          </div>
        </div>
      )}
    </div>
  );
}
