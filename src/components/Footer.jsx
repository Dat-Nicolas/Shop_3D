import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 border-t border-slate-800">
      <div className="max-w-container-max mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
        {/* Column 1: Brand Info */}
        <div className="md:col-span-1">
          <h3 className="font-display-lg text-xl font-bold text-white mb-4 tracking-tight">
            Nông Hải Sản 360
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Nền tảng mua sắm nông lâm hải sản trực tuyến hàng đầu, mang công nghệ 3D nâng tầm trải nghiệm thực phẩm sạch.
          </p>
          <div className="flex space-x-4">
            <a href="#" className="p-2 bg-slate-800 hover:bg-primary hover:text-white rounded-full transition-all text-slate-300">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="#" className="p-2 bg-slate-800 hover:bg-primary hover:text-white rounded-full transition-all text-slate-300">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.01 3.71.054 2.39.11 3.5 1.23 3.6 3.6.046.927.056 1.282.056 3.71 0 2.428-.01 2.784-.056 3.71-.1 2.39-1.21 3.5-3.6 3.6-.926.044-1.28.054-3.71.054s-2.784-.01-3.71-.054c-2.39-.1-3.5-1.21-3.6-3.6-.047-.926-.056-1.28-.056-3.71 0-2.428.01-2.784.056-3.71.1-2.39 1.21-3.5 3.6-3.6.927-.044 1.283-.054 3.71-.054zm0 2.232c-2.41 0-2.72.01-3.67.054-1.61.074-2.26.719-2.33 2.33-.044.95-.054 1.262-.054 3.67 0 2.41.01 2.72.054 3.67.07 1.61.72 2.26 2.33 2.33.95.044 1.262.054 3.67.054 2.41 0 2.72-.01 3.67-.054 1.61-.074 2.26-.719 2.33-2.33.044-.95.054-1.262.054-3.67 0-2.41-.01-2.72-.054-3.67-.07-1.61-.72-2.26-2.33-2.33-.95-.044-1.262-.054-3.67-.054zm0 2.617c2.62 0 4.75 2.13 4.75 4.75s-2.13 4.75-4.75 4.75-4.75-2.13-4.75-4.75 2.13-4.75 4.75-4.75zm0 7.268c1.39 0 2.518-1.128 2.518-2.518s-1.128-2.518-2.518-2.518-2.518 1.128-2.518 2.518 1.128 2.518 2.518 2.518zm5.733-8.818c.502 0 .91.408.91.91s-.408.91-.91.91-.91-.408-.91-.91.408-.91.91-.91z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="#" className="p-2 bg-slate-800 hover:bg-primary hover:text-white rounded-full transition-all text-slate-300">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.502 2.502 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C3 15.255 3 12 3 12s0-3.255.418-4.814a2.507 2.507 0 0 1 1.768-1.768C6.744 5 12 5 12 5s5.255 0 7.812.418ZM9.75 15.002 15.5 12 9.75 8.998v6.004Z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h4 className="font-display-lg text-base font-bold text-white mb-4 tracking-tight">
            Sản Phẩm
          </h4>
          <ul className="space-y-2.5 text-sm">
            <li><a href="#" className="hover:text-primary transition-colors">Trái Cây Nhiệt Đới</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Rau Củ Hữu Cơ</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Hải Sản Tươi Sống</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Đồ Khô Đặc Sản</a></li>
          </ul>
        </div>

        {/* Column 3: Corporate Info */}
        <div>
          <h4 className="font-display-lg text-base font-bold text-white mb-4 tracking-tight">
            Chính Sách
          </h4>
          <ul className="space-y-2.5 text-sm">
            <li><a href="#" className="hover:text-primary transition-colors">Chính Sách Giao Hàng</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Đổi Trả & Hoàn Tiền</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Bảo Mật Thông Tin</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Điều Khoản Dịch Vụ</a></li>
          </ul>
        </div>

        {/* Column 4: Contact info */}
        <div>
          <h4 className="font-display-lg text-base font-bold text-white mb-4 tracking-tight">
            Liên Hệ
          </h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary shrink-0" />
              <span>123 Đường 3/2, Quận Ninh Kiều, TP. Cần Thơ</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-primary shrink-0" />
              <span>1900 360 360</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-primary shrink-0" />
              <span>support@nonghaisan360.vn</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-container-max mx-auto px-6 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
        <p>© 2026 Nông Hải Sản 360. Bản quyền được bảo lưu. Thiết kế và công nghệ 3D bởi Antigravity.</p>
      </div>
    </footer>
  );
}
