import React from 'react';
import { ArrowRight, Leaf } from 'lucide-react';

export default function Hero({ onExploreClick }) {
  return (
    <section className="relative h-[90vh] min-h-[600px] flex items-center overflow-hidden pt-20">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          alt="Nông sản hữu cơ tươi sạch" 
          className="w-full h-full object-cover" 
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1920&q=80"
        />
        {/* Soft gradient from white-greenish transparent to overlay the image for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 md:via-white/60 to-transparent"></div>
      </div>

      <div className="relative z-10 max-w-container-max mx-auto px-6 w-full">
        <div className="max-w-2xl animate-fade-in-up">
          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 mb-6 bg-primary/10 text-primary font-label-md text-sm font-semibold rounded-full border border-primary/20">
            <Leaf className="w-4 h-4" />
            Chuẩn Chất Lượng 5 Sao
          </span>

          {/* Headline */}
          <h1 className="font-display-lg text-4xl md:text-5xl lg:text-6xl mb-6 leading-tight text-on-surface font-extrabold tracking-tight">
            Trải Nghiệm <br /> 
            <span className="text-primary relative inline-block">
              Nông Hải Sản
              <span className="absolute bottom-1 left-0 w-full h-2 bg-primary/10 -z-10 rounded-full"></span>
            </span> <br /> 
            Tươi Ngon 360°
          </h1>

          {/* Subtext */}
          <p className="font-body-lg text-lg text-on-surface-variant mb-10 max-w-lg leading-relaxed">
            Sản phẩm sạch từ thiên nhiên, cam kết chất lượng chuẩn 5 sao. Quy trình kiểm duyệt khắt khe, mang tinh hoa đất trời đến bàn ăn nhà bạn.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={onExploreClick}
              className="flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-label-md text-base font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-200"
            >
              Mua Ngay
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <button 
              onClick={onExploreClick}
              className="px-8 py-4 bg-white/90 backdrop-blur-md border-2 border-primary text-primary rounded-2xl font-label-md text-base font-bold hover:bg-primary/5 hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-200"
            >
              Xem Danh Mục
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
