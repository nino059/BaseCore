import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import PublicLayout from '../components/PublicLayout';

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          api.get('/api/categories'),
          api.get('/api/products?status=Available&_limit=8')
        ]);
        setCategories(catRes.data || []);
        setFeatured(prodRes.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <PublicLayout>
      {/* HERO BANNER - ĐẸP CAO CẤP */}
      <section className="relative h-screen flex items-center justify-center bg-black overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/id/1015/1920/1080')] bg-cover bg-center opacity-75"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-black"></div>

        <div className="relative z-10 text-center text-white px-6 max-w-4xl">
          <h1 className="text-6xl md:text-7xl font-light tracking-widest leading-none mb-6">
            NGHỆ THUẬT<br />KHÔNG GIỚI HẠN
          </h1>
          <p className="text-2xl md:text-3xl mb-12 text-gray-200">
            Bộ sưu tập những tác phẩm tranh độc đáo từ các nghệ sĩ tài năng Việt Nam
          </p>
          <Link 
            to="/shop"
            className="inline-block px-14 py-5 border-2 border-white text-white text-xl font-medium rounded-2xl hover:bg-white hover:text-black transition-all duration-300"
          >
            KHÁM PHÁ BỘ SƯU TẬP
          </Link>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-8">
          <h2 className="text-4xl font-light text-center mb-4">Khám Phá Theo Chủ Đề</h2>
          <p className="text-center text-gray-600 mb-16">Chọn phong cách nghệ thuật phù hợp với không gian của bạn</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {categories.map(cat => (
              <Link key={cat.id} to={`/shop?category=${cat.id}`} className="group">
                <div className="relative h-80 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500">
                  <img 
                    src={cat.imageUrl || `https://picsum.photos/id/${cat.id}/600/400`} 
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-8 left-8 text-white">
                    <h3 className="text-3xl font-medium">{cat.name}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex justify-between items-end mb-12">
            <h2 className="text-4xl font-light">Tranh Nổi Bật</h2>
            <Link to="/shop" className="text-lg hover:underline">Xem tất cả →</Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {featured.map(product => (
              <div key={product.id} className="bg-white rounded-3xl overflow-hidden shadow hover:shadow-2xl transition group">
                <div className="relative">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-full h-72 object-cover group-hover:scale-105 transition duration-500"
                  />
                </div>
                <div className="p-6">
                  <h4 className="font-medium text-lg line-clamp-2 group-hover:text-blue-600 transition">{product.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">{product.theme}</p>
                  <div className="mt-6 flex justify-between items-end">
                    <p className="text-2xl font-semibold text-gray-900">
                      {product.price?.toLocaleString('vi-VN')} ₫
                    </p>
                    <button className="bg-black text-white px-6 py-3 rounded-2xl text-sm hover:bg-gray-800 transition">
                      Thêm vào giỏ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Home;