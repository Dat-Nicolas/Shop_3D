import React, { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setEmail('');
    setTimeout(() => {
      setSubmitted(false);
    }, 4000);
  };

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-container-max mx-auto px-6">
        <div className="relative rounded-[40px] overflow-hidden bg-gradient-to-tr from-primary to-emerald-800 text-white py-16 px-8 md:px-16 text-center shadow-2xl">
          {/* Subtle design blobs inside the container */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full filter blur-2xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full filter blur-3xl translate-x-1/3 translate-y-1/3"></div>

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="font-display-lg text-3xl md:text-4xl font-extrabold mb-4 leading-tight tracking-tight">
              Đăng Ký Nhận Ngay Ưu Đãi 10%
            </h2>
            
            <p className="text-white/80 font-body-lg text-base md:text-lg mb-8 leading-relaxed max-w-lg mx-auto">
              Nhận thông báo sớm nhất về nguồn hàng tươi sạch mới về cùng hàng ngàn mã giảm giá đặc quyền hàng tuần.
            </p>

            {submitted ? (
              <div className="flex items-center justify-center gap-2 text-white bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl max-w-md mx-auto animate-fade-in">
                <CheckCircle2 className="w-6 h-6 text-yellow-300" />
                <span className="font-semibold text-sm">Đăng ký thành công! Kiểm tra hộp thư của bạn nhé.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  required
                  placeholder="Nhập email của bạn..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20 transition-all font-medium text-sm"
                />
                
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary font-bold text-sm rounded-2xl hover:bg-slate-100 active:scale-98 transition-all duration-200"
                >
                  Đăng Ký
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
