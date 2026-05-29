import React from 'react';
import { Star, Eye } from 'lucide-react';
import { products } from '../data/products';

export default function ProductList({ activeCategory, onProductSelect, onAddToCart }) {
  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter(p => p.category === activeCategory);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <section id="products-section" className="py-20 bg-slate-50 scroll-mt-20">
      <div className="max-w-container-max mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
          <div>
            <h2 className="font-display-lg text-3xl font-extrabold text-on-surface mb-2 tracking-tight">
              Sản Phẩm Của Chúng Tôi
            </h2>
            <p className="text-on-surface-variant max-w-md">
              Nhấp vào sản phẩm bất kỳ để mở trình xem 3D tương tác đa chiều 360° độc đáo.
            </p>
          </div>
          
          <div className="px-4 py-2 bg-primary/5 text-primary text-sm font-semibold rounded-full border border-primary/10">
            Hiển thị: {filteredProducts.length} sản phẩm
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="group bg-white rounded-3xl overflow-hidden border border-outline-variant/30 hover:border-primary/20 hover:shadow-2xl transition-all duration-300 flex flex-col cursor-pointer"
              onClick={() => onProductSelect(product)}
            >
              {/* Product Image & Eye Overlay */}
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* View 3D overlay */}
                <div className="absolute inset-0 bg-primary-container/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="flex items-center gap-2 px-5 py-2.5 bg-white text-primary text-sm font-bold rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <Eye className="w-4 h-4" />
                    Tương Tác 3D
                  </div>
                </div>

                {/* Origin tag */}
                <span className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur-md text-on-surface-variant text-xs font-semibold rounded-full border border-outline-variant/30">
                  {product.origin}
                </span>

                {/* 3D badge */}
                <span className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 bg-primary text-white text-xs font-bold rounded-full shadow-md">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                  3D 360°
                </span>
              </div>

              {/* Product Info */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="px-2.5 py-0.5 bg-slate-100 text-on-surface-variant text-xs font-semibold rounded-md">
                      {product.category === 'fruits' ? 'Trái Cây' : product.category === 'agriculture' ? 'Nông Sản' : 'Hải Sản'}
                    </span>
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="w-4 h-4 fill-amber-500" />
                      <span className="text-xs font-bold text-on-surface">{product.rating}</span>
                    </div>
                  </div>

                  <h3 className="font-headline-sm text-lg font-bold text-on-surface mb-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  
                  <p className="text-sm text-on-surface-variant line-clamp-2 mb-4 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-auto">
                  <div>
                    <span className="text-2xl font-extrabold text-primary">{formatPrice(product.price)}</span>
                    <span className="text-xs text-on-surface-variant font-medium"> / {product.unit}</span>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // prevent opening detail modal
                      onAddToCart(product);
                    }}
                    className="px-4 py-2 bg-white border border-primary/30 text-primary text-sm font-bold rounded-xl hover:bg-primary hover:text-white transition-all active:scale-95 duration-150"
                  >
                    Thêm
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
