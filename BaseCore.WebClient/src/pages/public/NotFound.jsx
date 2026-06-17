import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PublicLayout from '../../components/layout/PublicLayout';

const NotFound = () => {
    const navigate = useNavigate();
    return (
        <PublicLayout>
            <div className="text-center px-5 py-20">
                <div className="text-[7rem] font-black leading-none mb-2 bg-linear-to-br from-[#a78bfa] to-[#7c3aed] bg-clip-text text-transparent">
                    404
                </div>
                <h4 className="font-bold text-gray-800 mb-2">
                    Trang không tồn tại
                </h4>
                <p className="text-gray-400 max-w-100 mx-auto mb-8">
                    Trang bạn đang tìm không tồn tại hoặc đã bị xóa. Hãy quay về trang chủ nhé!
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="px-7 py-3 rounded-xl font-bold text-[0.95rem] cursor-pointer bg-white border-2 border-[#a78bfa] text-[#7c3aed]"
                    >
                        <i className="fas fa-arrow-left mr-2"></i>Quay lại
                    </button>
                    <Link
                        to="/"
                        className="px-7 py-3 rounded-xl font-bold text-[0.95rem] no-underline text-white bg-linear-to-br from-[#a78bfa] to-[#7c3aed]"
                    >
                        <i className="fas fa-home mr-2"></i>Trang chủ
                    </Link>
                </div>
            </div>
        </PublicLayout>
    );
};

export default NotFound;
