# Food3D — Cửa Hàng Thực Phẩm 3D

Ứng dụng thương mại điện tử hiển thị sản phẩm bằng mô hình 3D tương tác, xây dựng với React + Vite + Three.js.

## Tính năng

- Xem mô hình 3D cho từng sản phẩm: xoay, zoom, tự quay
- Hỗ trợ load file GLTF/GLB thực từ Blender, tự động fallback về model procedural nếu chưa có file
- Danh mục sản phẩm đa dạng: thực phẩm, hải sản, điện tử, xe hơi, nông cụ
- Giỏ hàng, modal chi tiết sản phẩm, newsletter

## Cấu trúc dự án

```
Food3D/
├── public/
│   └── Blender/              # File 3D model
│       ├── iphone X.glb      # Model Blender thực (GLB binary)
│       ├── iphone X.gltf     # Model Blender thực (GLTF + .bin)
│       ├── apple.gltf        # Model sinh tự động
│       ├── orange.gltf
│       └── ...               # 30 file .gltf cho tất cả sản phẩm
├── src/
│   ├── components/
│   │   ├── Viewer3D.jsx      # Viewer Three.js — load GLTF hoặc procedural
│   │   ├── DetailModal.jsx   # Modal chi tiết sản phẩm
│   │   ├── ProductList.jsx   # Lưới sản phẩm
│   │   ├── Hero.jsx
│   │   ├── Categories.jsx
│   │   ├── Features.jsx
│   │   ├── Newsletter.jsx
│   │   └── Footer.jsx
│   ├── data/
│   │   └── products/
│   │       ├── fruits.js
│   │       ├── agriculture.js
│   │       ├── seafood.js
│   │       ├── electronics.js
│   │       ├── luxury_cars.js
│   │       ├── processed_food.js
│   │       ├── agri_tools.js
│   │       └── index.js
│   └── App.jsx
└── scripts/
    └── generate-gltf.cjs     # Script tạo file .gltf tự động
```

## Cài đặt & Chạy

```bash
npm install
npm run dev
```

Build production:

```bash
npm run build
npm run preview
```

## Hệ thống 3D Model

### Logic load model (`Viewer3D.jsx`)

Viewer3D ưu tiên load file GLTF từ `/Blender/` trước. Nếu file không tồn tại, tự động fallback về model procedural Three.js.

```
Có /Blender/{modelType}.glb hoặc .gltf?
  ├── Có → Load và render file 3D thực
  └── Không → Render model procedural (Three.js geometry)
```

**Tên file đặc biệt** (tên file khác với `modelType`):

| modelType | File trong /Blender |
|---|---|
| `phone_iphone_x` | `iphone X.glb` |

### Tạo file GLTF tự động

Script `scripts/generate-gltf.cjs` sinh 30 file `.gltf` self-contained (geometry base64 nhúng trong JSON, không cần file `.bin`) cho tất cả sản phẩm:

```bash
node scripts/generate-gltf.cjs
```

Output: `public/Blender/{modelType}.gltf`

### Thêm model Blender thực

Để thay thế model procedural bằng file Blender thực cho một sản phẩm:

1. Export từ Blender sang định dạng **GLB** (File → Export → glTF 2.0, chọn Binary `.glb`)
2. Đặt file vào `public/Blender/` với tên trùng `modelType` của sản phẩm
   - Ví dụ: `modelType: "apple"` → đặt file `apple.glb`
3. Viewer3D tự động ưu tiên dùng file GLB mới

Nếu tên file có khoảng trắng hoặc khác với `modelType`, thêm vào map trong [Viewer3D.jsx](src/components/Viewer3D.jsx):

```js
const glbFilenameMap = {
  'phone_iphone_x': 'iphone X.glb',
  // thêm mapping tại đây
};
```

## Danh sách sản phẩm & modelType

| Danh mục | Sản phẩm | modelType |
|---|---|---|
| Trái cây | Táo Fuji | `apple` |
| | Cam Sành | `orange` |
| | Xoài Cát Hòa Lộc | `mango` |
| | Dâu Tây Đà Lạt | `strawberry` |
| | Dưa Lưới | `melon` |
| Rau củ | Cà Rốt Baby | `carrot` |
| | Súp Lơ Xanh | `broccoli` |
| | Cà Chua Cherry | `cherry_tomato` |
| | Cải Bó Xôi | `spinach` |
| | Bắp Ngọt | `sweet_corn` |
| Hải sản | Cá Hồi Nauy | `salmon` |
| | Tôm Hùm Bông | `lobster` |
| | Cá Ngừ Saku | `tuna` |
| | Bạch Tuộc | `octopus` |
| Xe hơi | Mercedes S450 | `car_mercedes_s450` |
| | BMW 730Li | `car_bmw_7` |
| | Audi Q8 | `car_audi_q8` |
| Điện tử | iPhone 15 Pro Max | `phone_iphone` |
| | iPhone X | `phone_iphone_x` |
| | Samsung S24 Ultra | `phone_samsung` |
| | MacBook Pro M3 | `laptop_macbook` |
| | Sony Alpha A7 IV | `camera_sony` |
| | AirPods Pro Gen 2 | `headphone_airpods` |
| | LG OLED 65C3 | `tv_lg` |
| | PlayStation 5 | `console_ps5` |
| | Garmin Fenix 7X | `watch_garmin` |
| Thực phẩm | Jamón Ibérico | `food_ham` |
| | Rượu Vang Margaux | `food_wine` |
| | Cà Phê Chồn | `food_coffee` |
| | Phô Mai Burrata | `food_cheese` |
| Nông cụ | Máy Đo pH | `tool_meter` |

## Công nghệ

- [React 19](https://react.dev)
- [Vite](https://vite.dev)
- [Three.js](https://threejs.org) — rendering 3D, OrbitControls, GLTFLoader
- [Lucide React](https://lucide.dev) — icon
- [Tailwind CSS](https://tailwindcss.com)
