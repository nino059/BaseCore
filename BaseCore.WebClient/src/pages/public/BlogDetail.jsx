import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PublicLayout from '../../components/layout/PublicLayout';
import { blogApi } from '../../services/api';
import BlogRenderer from '../../components/common/BlogRenderer';

const BlogDetail = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    blogApi.getById(id)
      .then(res => setPost(res.data))
      .catch(() => setError('Không tìm thấy bài viết hoặc bài viết chưa được công khai.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <PublicLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-[42px] h-[42px] mx-auto mb-[18px] rounded-full border-[3px] border-line border-t-brand animate-spin [animation-duration:0.85s]" />
            <p className="text-[#888] text-[0.9rem]">Đang tải bài viết...</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (error || !post) {
    return (
      <PublicLayout>
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="text-center max-w-[420px]">
            <div className="text-[3.2rem] text-line mb-3">✦</div>
            <h2 className="font-normal text-[#333] mb-2.5">Bài viết không tồn tại</h2>
            <p className="text-[#777] mb-7">{error}</p>
            <Link to="/blog" className="text-brand-dark font-semibold no-underline">
              ← Quay lại trang Bài viết
            </Link>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="bg-[#f5f1e9] min-h-screen pb-20">
        {/* Elegant top navigation bar */}
        <div className="bg-[#f9f6f1] border-b border-[#e6d9c9]">
          <div className="max-w-[1140px] mx-auto px-4 py-[13px]">
            <Link
              to="/blog"
              className="inline-flex items-center gap-[9px] text-[0.83rem] text-[#5c4630] hover:text-ink no-underline font-medium py-1 transition-colors"
            >
              <i className="fas fa-arrow-left text-[0.78rem]" />
              <span>Quay lại Tạp chí Nghệ thuật</span>
            </Link>
          </div>
        </div>

        {/* The beautiful article */}
        <div className="pt-2 pb-5">
          <BlogRenderer post={post} />
        </div>

        {/* Elegant bottom navigation */}
        <div className="max-w-[780px] mx-auto px-5 pb-[60px]">
          <div className="border-t border-[#e6d9c9] pt-6 flex items-center justify-between flex-wrap gap-3.5">
            <Link to="/blog" className="text-brand-dark font-semibold text-[0.93rem] no-underline inline-flex items-center gap-[7px]">
              ← Xem thêm bài viết khác
            </Link>

            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="bg-transparent hover:bg-[#f9f6f1] border border-[#d4c5af] hover:border-brand text-brand-dark px-[18px] py-2 rounded-full text-[0.81rem] font-semibold cursor-pointer transition-colors"
            >
              Lên đầu trang ↑
            </button>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default BlogDetail;
