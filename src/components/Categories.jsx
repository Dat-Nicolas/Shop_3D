import React from 'react';
import { categories } from '../data/products';

export default function Categories({ activeCategory, setActiveCategory }) {
  // Map icons from material icon list to category
  const categoryDetails = {
    all: {
      bg: 'bg-slate-100 hover:bg-slate-200 text-slate-800',
      activeBg: 'bg-slate-900 text-white shadow-lg shadow-slate-900/10',
      desc: 'Tất cả các sản phẩm tươi sống hữu cơ',
      materialIcon: 'grid_view'
    },
    fruits: {
      bg: 'bg-rose-50 hover:bg-rose-100 text-rose-800',
      activeBg: 'bg-rose-600 text-white shadow-lg shadow-rose-600/20',
      desc: 'Táo hữu cơ, cam Hàm Yên, nho và các loại quả ngọt',
      materialIcon: 'nutrition'
    },
    agriculture: {
      bg: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800',
      activeBg: 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20',
      desc: 'Rau cải xanh hữu cơ, cà rốt baby sạch Đà Lạt',
      materialIcon: 'eco'
    },
    seafood: {
      bg: 'bg-sky-50 hover:bg-sky-100 text-sky-800',
      activeBg: 'bg-sky-600 text-white shadow-lg shadow-sky-600/20',
      desc: 'Tôm hùm bông, cá hồi Nauy fillet đẳng cấp',
      materialIcon: 'water_ec'
    }
  };

  return (
    <section className="py-16 bg-white border-b border-outline-variant/10">
      <div className="max-w-container-max mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="font-display-lg text-3xl font-extrabold text-on-surface mb-3 tracking-tight">
            Danh Mục Nổi Bật
          </h2>
          <p className="text-on-surface-variant max-w-lg mx-auto">
            Khám phá nguồn dinh dưỡng tươi sạch, tự nhiên 100% được chứng nhận chất lượng an toàn.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            const details = categoryDetails[cat.id] || categoryDetails.all;
            
            return (
              <div
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`group p-6 rounded-3xl border border-outline-variant/35 cursor-pointer transition-all duration-300 ${
                  isActive ? details.activeBg : 'bg-white hover:-translate-y-1 hover:shadow-xl hover:border-primary/20'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Icon wrap */}
                  <div className={`p-4 rounded-2xl transition-all duration-300 ${
                    isActive ? 'bg-white/20 text-white' : details.bg
                  }`}>
                    <span className="material-symbols-outlined text-3xl">
                      {details.materialIcon}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-headline-sm text-lg font-bold">
                      {cat.name}
                    </h3>
                    <p className={`text-sm mt-1 line-clamp-1 ${
                      isActive ? 'text-white/80' : 'text-on-surface-variant group-hover:text-primary transition-colors'
                    }`}>
                      {details.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
