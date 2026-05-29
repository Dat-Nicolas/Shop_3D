import React from 'react';
import { QrCode, Truck, ShieldCheck } from 'lucide-react';

export default function Features() {
  const items = [
    {
      icon: <QrCode className="w-8 h-8 text-primary" />,
      title: "Nguồn Gốc Rõ Ràng",
      desc: "Mỗi sản phẩm đều tích hợp mã QR truy xuất nguồn gốc 100%, rõ ràng lịch trình từ trang trại hữu cơ đến bàn ăn của bạn."
    },
    {
      icon: <Truck className="w-8 h-8 text-primary" />,
      title: "Giao Hàng Siêu Tốc",
      desc: "Dịch vụ giao nhận nội thành siêu nhanh chỉ trong vòng 2 giờ. Cam kết chất lượng luôn tươi ngon khi đến tay khách hàng."
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-primary" />,
      title: "Đóng Gói Chuyên Nghiệp",
      desc: "Quy trình phân loại và bảo quản nhiệt độ chuẩn quốc tế. Sử dụng bao bì sinh học tự hủy thân thiện môi trường."
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-container-max mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {items.map((item, index) => (
            <div 
              key={index}
              className="flex flex-col items-center text-center p-8 rounded-3xl border border-outline-variant/30 hover:shadow-xl transition-all duration-300 hover:border-primary/20"
            >
              <div className="p-4 bg-primary/5 rounded-2xl mb-6">
                {item.icon}
              </div>
              <h3 className="font-headline-sm text-xl font-bold text-on-surface mb-3">
                {item.title}
              </h3>
              <p className="text-on-surface-variant leading-relaxed text-sm">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
