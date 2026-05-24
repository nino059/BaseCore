-- ============================================================
-- SEED DATA v2: Họa sĩ và tác phẩm Việt Nam
-- Database: BaseCoreSales (SQL Server)
-- Ảnh: Wikimedia Commons (public domain / CC BY-SA)
-- Mật khẩu tài khoản họa sĩ: Artist@123
-- ============================================================
USE BaseCoreSales;
GO

-- ════════════════════════════════════════════════════════════
-- ARTIST USERS  (UserType = 2, Salt = 0x = binary rỗng)
-- Hệ thống tự dùng plain text khi Salt.Length <= 1
-- ════════════════════════════════════════════════════════════

IF NOT EXISTS (SELECT 1 FROM Users WHERE UserName = N'buixuanphai')
    INSERT INTO Users (Id, Name, UserName, Password, Salt, Email, Phone, Image, Bio, IsActive, UserType, Created)
    VALUES (
        N'a0000001-0000-0000-0000-000000000001',
        N'Bùi Xuân Phái',
        N'buixuanphai', N'Artist@123', 0x,
        N'buixuanphai@arthentic.vn', N'',
        N'https://upload.wikimedia.org/wikipedia/en/8/8b/Bui_Xuan_Phai_image.jpg',
        N'Bùi Xuân Phái (1920–1988) là một trong những họa sĩ tiêu biểu nhất của mỹ thuật Việt Nam hiện đại, đặc biệt nổi danh với những tác phẩm miêu tả phố cổ Hà Nội — được giới mộ điệu gọi trìu mến là "Phố Phái". Tốt nghiệp khoa Hội họa Cao đẳng Mỹ thuật Đông Dương (1941–1945), ông dùng sơn dầu để ghi lại hồn cốt những con phố cũ: Hàng Thiếc, Hàng Mắm, Mã Mây… Mỗi bức tranh đều mang nỗi hoài cổ da diết và vẻ đẹp trầm mặc của Hà Nội xưa. Ông được truy tặng Giải thưởng Hồ Chí Minh về Văn học – Nghệ thuật năm 1996.',
        1, 2, GETDATE()
    );

IF NOT EXISTS (SELECT 1 FROM Users WHERE UserName = N'tongocvan')
    INSERT INTO Users (Id, Name, UserName, Password, Salt, Email, Phone, Image, Bio, IsActive, UserType, Created)
    VALUES (
        N'a0000002-0000-0000-0000-000000000002',
        N'Tô Ngọc Vân',
        N'tongocvan', N'Artist@123', 0x,
        N'tongocvan@arthentic.vn', N'',
        N'https://upload.wikimedia.org/wikipedia/commons/4/49/Portrait_of_T%C3%B4_Ng%E1%BB%8Dc_V%C3%A2n.png',
        N'Tô Ngọc Vân (1906–1954) là một trong những danh họa vĩ đại nhất của mỹ thuật Việt Nam. Tốt nghiệp xuất sắc Trường Cao đẳng Mỹ thuật Đông Dương (1926–1931), ông nổi tiếng với những tác phẩm sơn dầu lãng mạn về phụ nữ Việt Nam. Là hiệu trưởng Trường Mỹ thuật Kháng chiến Việt Bắc, ông anh dũng hy sinh năm 1954 khi đang ký họa tại mặt trận Điện Biên Phủ. Tác phẩm "Hai Thiếu Nữ và Em Bé" được công nhận là Bảo vật Quốc gia năm 2013.',
        1, 2, GETDATE()
    );

IF NOT EXISTS (SELECT 1 FROM Users WHERE UserName = N'duongbichlien')
    INSERT INTO Users (Id, Name, UserName, Password, Salt, Email, Phone, Image, Bio, IsActive, UserType, Created)
    VALUES (
        N'a0000003-0000-0000-0000-000000000003',
        N'Dương Bích Liên',
        N'duongbichlien', N'Artist@123', 0x,
        N'duongbichlien@arthentic.vn', N'',
        N'https://upload.wikimedia.org/wikipedia/en/f/f2/Duong_Bich_Lien_Portrait_of_a_lady.jpg',
        N'Dương Bích Liên (1924–1988) là họa sĩ tài danh thuộc "Tứ kiệt mỹ thuật Việt Nam" (Sáng – Nghiêm – Liên – Phái). Nổi tiếng với chân dung phụ nữ đầy nội tâm, ông sử dụng sơn dầu, sơn mài, phấn màu và than. Người đương thời nói: "Tranh phố thì có Bùi Xuân Phái, chân dung thiếu nữ thì có Dương Bích Liên". Ông sống lặng lẽ, sáng tác trong cô độc và hiếm khi bán tranh. Được truy tặng Giải thưởng Hồ Chí Minh năm 2000.',
        1, 2, GETDATE()
    );

IF NOT EXISTS (SELECT 1 FROM Users WHERE UserName = N'nguyensang')
    INSERT INTO Users (Id, Name, UserName, Password, Salt, Email, Phone, Image, Bio, IsActive, UserType, Created)
    VALUES (
        N'a0000004-0000-0000-0000-000000000004',
        N'Nguyễn Sáng',
        N'nguyensang', N'Artist@123', 0x,
        N'nguyensang@arthentic.vn', N'',
        N'https://upload.wikimedia.org/wikipedia/en/2/20/Nguyen_Sang_Ladies.jpg',
        N'Nguyễn Sáng (1923–1988) sinh tại Tiền Giang, là trưởng nhóm "Tứ kiệt" (Sáng – Nghiêm – Liên – Phái) trong mỹ thuật Việt Nam hiện đại. Tốt nghiệp Cao đẳng Mỹ thuật Đông Dương (1940–1945), ông nổi tiếng với các tác phẩm sơn mài và sơn dầu về đề tài kháng chiến. "Kết Nạp Đảng Ở Điện Biên Phủ" (1963) là kiệt tác sơn mài được công nhận Bảo vật Quốc gia. Được truy tặng Giải thưởng Hồ Chí Minh năm 1996.',
        1, 2, GETDATE()
    );

IF NOT EXISTS (SELECT 1 FROM Users WHERE UserName = N'tranvancan')
    INSERT INTO Users (Id, Name, UserName, Password, Salt, Email, Phone, Image, Bio, IsActive, UserType, Created)
    VALUES (
        N'a0000005-0000-0000-0000-000000000005',
        N'Trần Văn Cẩn',
        N'tranvancan', N'Artist@123', 0x,
        N'tranvancan@arthentic.vn', N'',
        N'https://upload.wikimedia.org/wikipedia/en/6/65/Tran_Van_Can%2C_Em_Thuy.jpg',
        N'Trần Văn Cẩn (1910–1994) sinh tại Kiến An, Hải Phòng – họa sĩ và nhà giáo dục nghệ thuật lớn của Việt Nam. Tốt nghiệp Cao đẳng Mỹ thuật Đông Dương năm 1936, ông được mệnh danh là người "nâng sơn mài từ nghề thủ công lên nghệ thuật hội họa". "Em Thúy" (1943) là một trong những kiệt tác của hội họa Việt Nam. Ông từng làm Hiệu trưởng Trường Đại học Mỹ thuật Hà Nội (1954–1964). Giải thưởng Hồ Chí Minh đợt I năm 1996.',
        1, 2, GETDATE()
    );

IF NOT EXISTS (SELECT 1 FROM Users WHERE UserName = N'nguyentunghiem')
    INSERT INTO Users (Id, Name, UserName, Password, Salt, Email, Phone, Image, Bio, IsActive, UserType, Created)
    VALUES (
        N'a0000006-0000-0000-0000-000000000006',
        N'Nguyễn Tư Nghiêm',
        N'nguyentunghiem', N'Artist@123', 0x,
        N'nguyentunghiem@arthentic.vn', N'',
        N'',
        N'Nguyễn Tư Nghiêm (1919–2016) là một trong "Tứ kiệt mỹ thuật Việt Nam" (Sáng – Nghiêm – Liên – Phái). Sinh tại Nghệ An, ông học tại Cao đẳng Mỹ thuật Đông Dương (1941–1945). Phong cách của ông kết hợp hiện đại phương Tây với truyền thống dân tộc: hoa văn trống Đông Sơn, gốm Lý – Trần, tranh dân gian, điêu khắc đình làng. Ông sáng tác miệt mài đến tận lúc 90 tuổi và có bảo tàng riêng tại Hà Nội. Giải thưởng Hồ Chí Minh về Mỹ thuật năm 1996.',
        1, 2, GETDATE()
    );

GO

-- ════════════════════════════════════════════════════════════
-- PRODUCTS — dùng CategoryId thực tế từ DB
-- Id 2 = Tranh Sơn Mài | Id 3 = Tranh Lụa | Id 5 = Tranh Sơn Dầu
-- Id 7 = Tranh Màu Nước | Id 9 = Tranh Thủy Mặc
-- ════════════════════════════════════════════════════════════

-- ── BÙI XUÂN PHÁI ──────────────────────────────────────────

IF NOT EXISTS (SELECT 1 FROM Products WHERE Name = N'Hà Nội 1946' AND ArtistName = N'Bùi Xuân Phái')
    INSERT INTO Products (Name, Price, DiscountPrice, Stock, ImageUrl, Description, CategoryId, SellerId, ArtistName, Theme, Material, Width, Height, Status)
    VALUES (N'Hà Nội 1946', 850000000, NULL, 1,
        N'https://upload.wikimedia.org/wikipedia/commons/6/6d/Hano%C3%AF_1946%2C_Bui-xuan-Phai.jpg',
        N'Một trong những tác phẩm tiêu biểu nhất của Bùi Xuân Phái về phố cổ Hà Nội. Bức tranh ghi lại không khí Hà Nội trong những năm tháng lịch sử — những mái ngói rêu phong, con phố vắng lặng mang đậm dấu ấn thời gian. Sơn dầu trên vải với gam màu trầm ấm đặc trưng "Phố Phái".',
        5, N'a0000001-0000-0000-0000-000000000001', N'Bùi Xuân Phái',
        N'Phố Cổ Hà Nội', N'Sơn dầu', 60, 45, N'Available');

IF NOT EXISTS (SELECT 1 FROM Products WHERE Name = N'Phố Hàng Mắm' AND ArtistName = N'Bùi Xuân Phái')
    INSERT INTO Products (Name, Price, DiscountPrice, Stock, ImageUrl, Description, CategoryId, SellerId, ArtistName, Theme, Material, Width, Height, Status)
    VALUES (N'Phố Hàng Mắm', 620000000, 580000000, 1,
        N'https://upload.wikimedia.org/wikipedia/commons/6/6d/Hano%C3%AF_1946%2C_Bui-xuan-Phai.jpg',
        N'Phố Hàng Mắm là một trong những góc phố quen thuộc mà Bùi Xuân Phái trở đi trở lại nhiều lần. Vẻ đẹp trầm mặc, cổ kính của những ngôi nhà hàng phố với mái ngói rêu phong, tường vàng phai — đặc trưng phong cách "Phố Phái".',
        5, N'a0000001-0000-0000-0000-000000000001', N'Bùi Xuân Phái',
        N'Phố Cổ Hà Nội', N'Sơn dầu', 50, 40, N'Available');

IF NOT EXISTS (SELECT 1 FROM Products WHERE Name = N'Phố Vắng' AND ArtistName = N'Bùi Xuân Phái')
    INSERT INTO Products (Name, Price, DiscountPrice, Stock, ImageUrl, Description, CategoryId, SellerId, ArtistName, Theme, Material, Width, Height, Status)
    VALUES (N'Phố Vắng', 490000000, NULL, 1,
        N'https://upload.wikimedia.org/wikipedia/commons/6/6d/Hano%C3%AF_1946%2C_Bui-xuan-Phai.jpg',
        N'Sáng tác năm 1981, "Phố Vắng" là lời tâm sự của Bùi Xuân Phái về một Hà Nội đang dần đổi thay. Những con phố không người qua lại, ánh sáng xế chiều hắt lên mái ngói — gợi nỗi cô đơn và hoài niệm sâu lắng. Thuộc giai đoạn sáng tác chín muồi nhất của ông.',
        5, N'a0000001-0000-0000-0000-000000000001', N'Bùi Xuân Phái',
        N'Phố Cổ Hà Nội', N'Sơn dầu', 45, 35, N'Available');

-- ── TÔ NGỌC VÂN ────────────────────────────────────────────

IF NOT EXISTS (SELECT 1 FROM Products WHERE Name = N'Thiếu Nữ Bên Hoa Huệ' AND ArtistName = N'Tô Ngọc Vân')
    INSERT INTO Products (Name, Price, DiscountPrice, Stock, ImageUrl, Description, CategoryId, SellerId, ArtistName, Theme, Material, Width, Height, Status)
    VALUES (N'Thiếu Nữ Bên Hoa Huệ', 1200000000, NULL, 1,
        N'https://upload.wikimedia.org/wikipedia/commons/6/62/To_Ngoc_Van_thieu_nu_ben_hoa_hue.jpg',
        N'Kiệt tác sơn dầu năm 1943 — một trong những tác phẩm nổi tiếng nhất của Tô Ngọc Vân và của nền mỹ thuật Việt Nam. Hình ảnh người thiếu nữ trong tà áo dài trắng, nghiêng đầu bên bình hoa huệ toát lên vẻ đẹp thuần khiết, dịu dàng. Ánh sáng nhẹ nhàng, bố cục hài hòa — bậc thầy về sắc màu và tâm lý nhân vật.',
        3, N'a0000002-0000-0000-0000-000000000002', N'Tô Ngọc Vân',
        N'Chân Dung Phụ Nữ', N'Sơn dầu', 60, 80, N'Available');

IF NOT EXISTS (SELECT 1 FROM Products WHERE Name = N'Hai Thiếu Nữ và Em Bé' AND ArtistName = N'Tô Ngọc Vân')
    INSERT INTO Products (Name, Price, DiscountPrice, Stock, ImageUrl, Description, CategoryId, SellerId, ArtistName, Theme, Material, Width, Height, Status)
    VALUES (N'Hai Thiếu Nữ và Em Bé', 0, NULL, 0,
        N'https://upload.wikimedia.org/wikipedia/commons/4/49/Portrait_of_T%C3%B4_Ng%E1%BB%8Dc_V%C3%A2n.png',
        N'Sáng tác năm 1944, tác phẩm được Nhà nước Việt Nam công nhận là Bảo vật Quốc gia năm 2013, hiện lưu giữ tại Bảo tàng Mỹ thuật Việt Nam. Hai cô gái ôm ấp em bé trong khung cảnh bình dị — vẻ đẹp mộc mạc và tình cảm ấm áp của người phụ nữ Việt Nam.',
        5, N'a0000002-0000-0000-0000-000000000002', N'Tô Ngọc Vân',
        N'Chân Dung Phụ Nữ', N'Sơn dầu', 110, 60, N'Unavailable');

IF NOT EXISTS (SELECT 1 FROM Products WHERE Name = N'Buổi Trưa' AND ArtistName = N'Tô Ngọc Vân')
    INSERT INTO Products (Name, Price, DiscountPrice, Stock, ImageUrl, Description, CategoryId, SellerId, ArtistName, Theme, Material, Width, Height, Status)
    VALUES (N'Buổi Trưa', 780000000, 720000000, 1,
        N'https://upload.wikimedia.org/wikipedia/commons/6/62/To_Ngoc_Van_thieu_nu_ben_hoa_hue.jpg',
        N'Khoảnh khắc nghỉ ngơi giữa trưa của người phụ nữ Việt Nam thập niên 1940. Ánh sáng chan hòa, nét vẽ tinh tế và cách xử lý màu sắc ấm áp của Tô Ngọc Vân tạo nên bầu không khí yên bình, tĩnh lặng đặc trưng trong nghệ thuật của ông.',
        3, N'a0000002-0000-0000-0000-000000000002', N'Tô Ngọc Vân',
        N'Chân Dung Phụ Nữ', N'Sơn dầu trên lụa', 55, 40, N'Available');

-- ── DƯƠNG BÍCH LIÊN ────────────────────────────────────────

IF NOT EXISTS (SELECT 1 FROM Products WHERE Name = N'Chân Dung Thiếu Nữ' AND ArtistName = N'Dương Bích Liên')
    INSERT INTO Products (Name, Price, DiscountPrice, Stock, ImageUrl, Description, CategoryId, SellerId, ArtistName, Theme, Material, Width, Height, Status)
    VALUES (N'Chân Dung Thiếu Nữ', 540000000, NULL, 1,
        N'https://upload.wikimedia.org/wikipedia/en/f/f2/Duong_Bich_Lien_Portrait_of_a_lady.jpg',
        N'Dương Bích Liên được mệnh danh là bậc thầy về chân dung phụ nữ. Bức tranh phấn màu trên giấy thể hiện nét đẹp u tĩnh, trầm tư của người thiếu nữ. Ánh mắt sâu thẳm, đường nét mềm mại, bố cục tối giản nhưng đầy nội lực — ngôn ngữ hội họa riêng của Dương Bích Liên.',
        5, N'a0000003-0000-0000-0000-000000000003', N'Dương Bích Liên',
        N'Chân Dung Phụ Nữ', N'Phấn màu trên giấy', 40, 55, N'Available');

IF NOT EXISTS (SELECT 1 FROM Products WHERE Name = N'Hào' AND ArtistName = N'Dương Bích Liên')
    INSERT INTO Products (Name, Price, DiscountPrice, Stock, ImageUrl, Description, CategoryId, SellerId, ArtistName, Theme, Material, Width, Height, Status)
    VALUES (N'Hào', 920000000, NULL, 1,
        N'https://upload.wikimedia.org/wikipedia/en/f/f2/Duong_Bich_Lien_Portrait_of_a_lady.jpg',
        N'Sáng tác năm 1972, "Hào" là một trong những tác phẩm ấn tượng nhất của Dương Bích Liên về đề tài chiến tranh. Nét cọ mạnh mẽ, gam màu tối trầm tạo cảm giác căng thẳng và hào hùng. Hiện được nhiều nhà sưu tập đánh giá cao.',
        5, N'a0000003-0000-0000-0000-000000000003', N'Dương Bích Liên',
        N'Chiến Tranh', N'Sơn dầu', 80, 60, N'Available');

IF NOT EXISTS (SELECT 1 FROM Products WHERE Name = N'Chiều Vàng' AND ArtistName = N'Dương Bích Liên')
    INSERT INTO Products (Name, Price, DiscountPrice, Stock, ImageUrl, Description, CategoryId, SellerId, ArtistName, Theme, Material, Width, Height, Status)
    VALUES (N'Chiều Vàng', 430000000, 390000000, 1,
        N'https://upload.wikimedia.org/wikipedia/en/f/f2/Duong_Bich_Lien_Portrait_of_a_lady.jpg',
        N'Ánh chiều vàng hắt qua khung cửa sổ lên khuôn mặt người phụ nữ đang suy tư — ngôn ngữ hội họa đặc trưng của Dương Bích Liên. Ông thường khai thác khoảnh khắc tĩnh lặng khi con người đang chìm vào nội tâm sâu thẳm. Chất liệu than và phấn tạo vẻ đẹp mong manh.',
        5, N'a0000003-0000-0000-0000-000000000003', N'Dương Bích Liên',
        N'Chân Dung Phụ Nữ', N'Than và phấn màu', 35, 50, N'Available');

-- ── NGUYỄN SÁNG ────────────────────────────────────────────

IF NOT EXISTS (SELECT 1 FROM Products WHERE Name = N'Thiếu Nữ' AND ArtistName = N'Nguyễn Sáng')
    INSERT INTO Products (Name, Price, DiscountPrice, Stock, ImageUrl, Description, CategoryId, SellerId, ArtistName, Theme, Material, Width, Height, Status)
    VALUES (N'Thiếu Nữ', 670000000, NULL, 1,
        N'https://upload.wikimedia.org/wikipedia/en/2/20/Nguyen_Sang_Ladies.jpg',
        N'Tác phẩm tiêu biểu về chủ đề thiếu nữ của Nguyễn Sáng. Phong cách của ông khác các họa sĩ cùng thời: hình khối rõ ràng, màu sắc mạnh mẽ và bố cục mang tính tượng trưng. Nhân vật thiếu nữ được xử lý theo hướng giao thoa giữa hiện thực và biểu tượng.',
        5, N'a0000004-0000-0000-0000-000000000004', N'Nguyễn Sáng',
        N'Chân Dung Phụ Nữ', N'Sơn dầu', 65, 50, N'Available');

IF NOT EXISTS (SELECT 1 FROM Products WHERE Name = N'Những Con Mèo' AND ArtistName = N'Nguyễn Sáng')
    INSERT INTO Products (Name, Price, DiscountPrice, Stock, ImageUrl, Description, CategoryId, SellerId, ArtistName, Theme, Material, Width, Height, Status)
    VALUES (N'Những Con Mèo', 380000000, 350000000, 1,
        N'https://upload.wikimedia.org/wikipedia/en/c/c7/Nguyen_Sang_Cats.jpg',
        N'Nguyễn Sáng không chỉ vẽ người — ông còn có những tác phẩm thú vị về thiên nhiên và loài vật. Bức tranh các con mèo thể hiện khả năng quan sát tinh tế và bút pháp khoáng đạt. Đường nét tự do, màu sắc sống động.',
        5, N'a0000004-0000-0000-0000-000000000004', N'Nguyễn Sáng',
        N'Thiên Nhiên', N'Sơn dầu', 45, 35, N'Available');

IF NOT EXISTS (SELECT 1 FROM Products WHERE Name = N'Cưới Trên Chiến Khu' AND ArtistName = N'Nguyễn Sáng')
    INSERT INTO Products (Name, Price, DiscountPrice, Stock, ImageUrl, Description, CategoryId, SellerId, ArtistName, Theme, Material, Width, Height, Status)
    VALUES (N'Cưới Trên Chiến Khu', 1500000000, NULL, 0,
        N'https://upload.wikimedia.org/wikipedia/en/2/20/Nguyen_Sang_Ladies.jpg',
        N'Kiệt tác sơn mài (1962) mô tả đám cưới của các chiến sĩ và dân quân trong kháng chiến. Bố cục hoành tráng với nhiều nhân vật, màu sắc sơn mài óng ánh — một trong những tác phẩm sơn mài đẹp nhất của Nguyễn Sáng. Hiện trưng bày tại Bảo tàng Mỹ thuật Việt Nam.',
        2, N'a0000004-0000-0000-0000-000000000004', N'Nguyễn Sáng',
        N'Lịch Sử Kháng Chiến', N'Sơn mài', 200, 112, N'Unavailable');

-- ── TRẦN VĂN CẨN ───────────────────────────────────────────

IF NOT EXISTS (SELECT 1 FROM Products WHERE Name = N'Em Thúy' AND ArtistName = N'Trần Văn Cẩn')
    INSERT INTO Products (Name, Price, DiscountPrice, Stock, ImageUrl, Description, CategoryId, SellerId, ArtistName, Theme, Material, Width, Height, Status)
    VALUES (N'Em Thúy', 0, NULL, 0,
        N'https://upload.wikimedia.org/wikipedia/en/6/65/Tran_Van_Can%2C_Em_Thuy.jpg',
        N'Kiệt tác sơn dầu năm 1943 — một trong những tác phẩm nổi tiếng nhất của Trần Văn Cẩn. Chân dung bé gái Thúy được vẽ với tình cảm trìu mến, ánh mắt trong trẻo ngây thơ. Được xem là một trong những tác phẩm chân dung trẻ em đẹp nhất trong lịch sử mỹ thuật Việt Nam. Hiện là Bảo vật Quốc gia.',
        5, N'a0000005-0000-0000-0000-000000000005', N'Trần Văn Cẩn',
        N'Chân Dung Trẻ Em', N'Sơn dầu', 55, 65, N'Unavailable');

IF NOT EXISTS (SELECT 1 FROM Products WHERE Name = N'Gội Đầu' AND ArtistName = N'Trần Văn Cẩn')
    INSERT INTO Products (Name, Price, DiscountPrice, Stock, ImageUrl, Description, CategoryId, SellerId, ArtistName, Theme, Material, Width, Height, Status)
    VALUES (N'Gội Đầu', 860000000, 790000000, 1,
        N'https://upload.wikimedia.org/wikipedia/en/3/31/Tran_Van_Can_-_Painting_2.jpg',
        N'Tác phẩm sơn mài tiêu biểu của Trần Văn Cẩn, thể hiện cảnh người phụ nữ gội đầu trong không gian giản dị. Chất liệu sơn mài với màu sắc óng ánh, bố cục cân đối, đường nét dứt khoát — bậc thầy chuyển hóa chất liệu dân gian thành nghệ thuật hội họa đỉnh cao.',
        2, N'a0000005-0000-0000-0000-000000000005', N'Trần Văn Cẩn',
        N'Đời Sống Thường Nhật', N'Sơn mài', 60, 80, N'Available');

IF NOT EXISTS (SELECT 1 FROM Products WHERE Name = N'Tát Nước Đồng Chiêm' AND ArtistName = N'Trần Văn Cẩn')
    INSERT INTO Products (Name, Price, DiscountPrice, Stock, ImageUrl, Description, CategoryId, SellerId, ArtistName, Theme, Material, Width, Height, Status)
    VALUES (N'Tát Nước Đồng Chiêm', 720000000, NULL, 1,
        N'https://upload.wikimedia.org/wikipedia/en/1/10/Tran_Van_Can_Bailing_water_on_the_field.jpg',
        N'Bức tranh khắc họa cảnh tát nước trên cánh đồng chiêm — hình ảnh quen thuộc của nông thôn Việt Nam. Trần Văn Cẩn tái hiện lao động nông nghiệp với tinh thần lạc quan, khỏe khoắn. Màu sắc tươi sáng, chuyển động nhịp nhàng của những người nông dân.',
        5, N'a0000005-0000-0000-0000-000000000005', N'Trần Văn Cẩn',
        N'Phong Cảnh Nông Thôn', N'Sơn dầu', 100, 70, N'Available');

IF NOT EXISTS (SELECT 1 FROM Products WHERE Name = N'Thiếu Nữ Nông Thôn' AND ArtistName = N'Trần Văn Cẩn')
    INSERT INTO Products (Name, Price, DiscountPrice, Stock, ImageUrl, Description, CategoryId, SellerId, ArtistName, Theme, Material, Width, Height, Status)
    VALUES (N'Thiếu Nữ Nông Thôn', 510000000, 470000000, 1,
        N'https://upload.wikimedia.org/wikipedia/en/c/ca/Tran_Van_Can_Rural_Girls.jpg',
        N'Hình ảnh những cô gái nông thôn trong trang phục giản dị, ánh mắt trong sáng và nụ cười rạng rỡ. Trần Văn Cẩn thể hiện vẻ đẹp khỏe khoắn, hồn nhiên của phụ nữ Việt Nam những năm 1950–1960. Tác phẩm mang tinh thần lạc quan của thời kỳ xây dựng đất nước.',
        5, N'a0000005-0000-0000-0000-000000000005', N'Trần Văn Cẩn',
        N'Chân Dung Phụ Nữ', N'Màu nước trên giấy', 50, 40, N'Available');

-- ── NGUYỄN TƯ NGHIÊM ───────────────────────────────────────

IF NOT EXISTS (SELECT 1 FROM Products WHERE Name = N'12 Con Giáp' AND ArtistName = N'Nguyễn Tư Nghiêm')
    INSERT INTO Products (Name, Price, DiscountPrice, Stock, ImageUrl, Description, CategoryId, SellerId, ArtistName, Theme, Material, Width, Height, Status)
    VALUES (N'12 Con Giáp', 950000000, 880000000, 1,
        N'https://upload.wikimedia.org/wikipedia/en/2/20/Nguyen_Sang_Ladies.jpg',
        N'Nguyễn Tư Nghiêm nổi tiếng với loạt tranh về 12 con giáp — kết hợp hoa văn dân gian Đông Sơn và phong cách hiện đại. Đường nét đơn giản nhưng đầy biểu cảm, màu sắc mạnh mẽ. Ông tái hiện các con vật trong 12 con giáp theo phong cách trang trí dân gian Việt Nam độc đáo.',
        2, N'a0000006-0000-0000-0000-000000000006', N'Nguyễn Tư Nghiêm',
        N'Dân Gian', N'Sơn mài', 80, 60, N'Available');

IF NOT EXISTS (SELECT 1 FROM Products WHERE Name = N'Điệu Múa Cổ' AND ArtistName = N'Nguyễn Tư Nghiêm')
    INSERT INTO Products (Name, Price, DiscountPrice, Stock, ImageUrl, Description, CategoryId, SellerId, ArtistName, Theme, Material, Width, Height, Status)
    VALUES (N'Điệu Múa Cổ', 720000000, NULL, 1,
        N'https://upload.wikimedia.org/wikipedia/en/2/20/Nguyen_Sang_Ladies.jpg',
        N'Cảm hứng từ các điệu múa cổ truyền Việt Nam — chèo, hát bội, múa rối nước. Nguyễn Tư Nghiêm biểu đạt chuyển động múa qua đường nét và màu sắc theo phong cách hiện đại kết hợp truyền thống, tạo nên tác phẩm vừa cổ kính vừa đương đại.',
        2, N'a0000006-0000-0000-0000-000000000006', N'Nguyễn Tư Nghiêm',
        N'Dân Gian', N'Sơn mài', 70, 50, N'Available');

GO

-- ════════════════════════════════════════════════════════════
-- KIỂM TRA KẾT QUẢ
-- ════════════════════════════════════════════════════════════
SELECT '=== ARTISTS MỚI ===' AS Info;
SELECT Id, Name, UserName FROM Users
WHERE UserName IN (N'buixuanphai',N'tongocvan',N'duongbichlien',N'nguyensang',N'tranvancan',N'nguyentunghiem');

SELECT '=== SỐ SẢN PHẨM THEO HỌA SĨ ===' AS Info;
SELECT ArtistName, COUNT(*) AS SoTranh
FROM Products
WHERE ArtistName IN (N'Bùi Xuân Phái',N'Tô Ngọc Vân',N'Dương Bích Liên',N'Nguyễn Sáng',N'Trần Văn Cẩn',N'Nguyễn Tư Nghiêm')
GROUP BY ArtistName ORDER BY ArtistName;
GO
