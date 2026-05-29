import React, { useState } from 'react';
import { X, Star, ShoppingBag, RotateCw, MapPin, Sparkles } from 'lucide-react';
import Viewer3D from './Viewer3D';

export default function DetailModal({ product, onClose, onAddToCart }) {
  const [quantity, setQuantity] = useState(1);
  const [autoRotate, setAutoRotate] = useState(true);

  if (!product) return null;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const handleAddToCart = () => {
    onAddToCart({ ...product, quantity });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 transition-all duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-5xl rounded-[32px] overflow-hidden shadow-2xl relative grid grid-cols-1 md:grid-cols-12 max-h-[90vh] md:max-h-[85vh] animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full transition-all active:scale-90"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Column: 3D Viewer Container (7 cols on desktop) */}
        <div className="md:col-span-7 bg-slate-100 relative flex flex-col justify-between min-h-[350px] md:min-h-0">
          {/* 3D Mode Active Badge */}
          <div className="absolute top-6 left-6 z-10 flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-full shadow-lg">
            <Sparkles className="w-3.5 h-3.5" />
            Trải Nghiệm 3D Tương Tác
          </div>

          {/* Actual 3D Canvas rendering */}
          <div className="flex-1 w-full h-full relative">
            <Viewer3D modelType={product.modelType} autoRotate={autoRotate} />
          </div>

          {/* 3D control tip overlay */}
          <div className="absolute bottom-6 left-6 right-6 z-10 flex justify-between items-center pointer-events-none">
            <span className="text-xs font-semibold text-slate-500 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200/50">
              🖱️ Nhấp & kéo chuột để xoay 3D | Cuộn để zoom
            </span>
            
            {/* Auto-rotate button (clickable because we override pointer events) */}
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border shadow-sm transition-all active:scale-95 ${
                autoRotate 
                  ? 'bg-primary/10 border-primary/20 text-primary' 
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
              {autoRotate ? 'Xoay tự động' : 'Tự xoay: Tắt'}
            </button>
          </div>
        </div>

        {/* Right Column: Information & Actions (5 cols on desktop) */}
        <div className="md:col-span-5 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto bg-white">
          <div>
            {/* Category badge */}
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full mb-4">
              {product.category === 'fruits' ? 'Trái Cây Tươi' : product.category === 'agriculture' ? 'Nông Sản Sạch' : 'Hải Sản Cao Cấp'}
            </span>

            {/* Title */}
            <h2 className="font-display-lg text-2xl sm:text-3xl font-extrabold text-on-surface mb-3 leading-tight">
              {product.name}
            </h2>

            {/* Ratings & Reviews */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-on-surface-variant mb-6 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-5 h-5 fill-amber-500" />
                <span className="font-bold text-on-surface">{product.rating}</span>
              </div>
              <span className="text-slate-300">|</span>
              <span>{product.reviews} đánh giá</span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1 text-slate-600">
                <MapPin className="w-4 h-4 text-primary" />
                {product.origin}
              </span>
            </div>

            {/* Description */}
            <h4 className="font-bold text-sm text-on-surface mb-2">Giới thiệu sản phẩm:</h4>
            <p className="text-sm leading-relaxed text-on-surface-variant mb-6">
              {product.description}
            </p>
          </div>

          <div>
            {/* Pricing Area */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6 flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-500">Đơn giá:</span>
              <div>
                <span className="text-2xl font-extrabold text-primary">{formatPrice(product.price)}</span>
                <span className="text-xs text-on-surface-variant font-medium"> / {product.unit}</span>
              </div>
            </div>

            {/* Quantity Selector & Add to Cart */}
            <div className="flex items-center gap-4">
              <div className="flex items-center border-2 border-slate-200 rounded-2xl overflow-hidden shrink-0">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-3 bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-lg transition-colors active:scale-95 duration-100"
                >
                  -
                </button>
                <span className="px-4 text-center font-bold w-12 text-slate-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-3 bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-lg transition-colors active:scale-95 duration-100"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-primary text-white font-bold text-sm rounded-2xl hover:bg-emerald-700 active:scale-98 shadow-lg shadow-primary/10 transition-all duration-150"
              >
                <ShoppingBag className="w-5 h-5" />
                Thêm Giỏ Hàng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
