-- ============================================================
-- Seed BlogPosts — 6 bài viết cho 3 họa sĩ cụ thể
-- Chạy trong SSMS trên database BaseCoreSales
-- ============================================================

-- ── Bùi Xuân Phái – bài 1 ────────────────────────────────
INSERT INTO BlogPosts
    (Title, Excerpt, Content, Category, AuthorId, AuthorName,
     CoverImageUrl, Status, CreatedAt, PublishedAt)
SELECT
    N'Hành Trình Khám Phá Nghệ Thuật Tranh Lụa Việt Nam',
    N'Tranh lụa là một trong những thể loại nghệ thuật truyền thống tinh tế nhất của Việt Nam, kết hợp kỹ thuật vẽ với vẻ đẹp mềm mại của tơ lụa để tạo ra những tác phẩm độc đáo.',
    N'Tranh lụa Việt Nam có lịch sử hàng trăm năm, gắn liền với nền văn hóa dân gian phong phú. Đây là loại hình nghệ thuật đòi hỏi sự kiên nhẫn và kỹ thuật cao, kết hợp giữa kỹ thuật vẽ truyền thống và vẻ đẹp tự nhiên của tơ lụa.

Những họa sĩ vẽ tranh lụa phải học cách kiểm soát màu sắc trên nền lụa mỏng manh, tạo ra hiệu ứng trong suốt và chiều sâu đặc trưng mà không thể tìm thấy ở bất kỳ chất liệu nào khác.

Màu sắc trong tranh lụa thường được pha chế từ các nguyên liệu tự nhiên như khoáng vật và thực vật, tạo nên sắc thái nhẹ nhàng và hài hòa. Kỹ thuật vẽ nhiều lớp, để khô giữa các lớp màu, tạo ra chiều sâu và sự trong suốt đặc trưng.

Ngày nay, các họa sĩ trẻ đang kết hợp kỹ thuật truyền thống với cái nhìn hiện đại, mang lại làn gió mới cho nghệ thuật tranh lụa Việt Nam.',
    N'Kỹ thuật vẽ',
    u.Id, u.Name,
    'https://images.unsplash.com/photo-1580136579312-94651dfd596d?w=800',
    'Published',
    DATEADD(DAY, -2,  GETUTCDATE()),
    DATEADD(DAY, -2,  GETUTCDATE())
FROM Users u WHERE u.Name = N'Bùi Xuân Phái' AND u.UserType = 2;

-- ── Bùi Xuân Phái – bài 2 ────────────────────────────────
INSERT INTO BlogPosts
    (Title, Excerpt, Content, Category, AuthorId, AuthorName,
     CoverImageUrl, Status, CreatedAt, PublishedAt)
SELECT
    N'Màu Sắc Trong Hội Họa: Cảm Xúc Và Ý Nghĩa',
    N'Mỗi màu sắc trong hội họa không chỉ là sắc tố mà còn chứa đựng cảm xúc, ký ức và câu chuyện riêng. Tìm hiểu cách họa sĩ sử dụng màu sắc để truyền tải thông điệp nghệ thuật.',
    N'Trong nghệ thuật hội họa, màu sắc là ngôn ngữ mạnh mẽ nhất của họa sĩ. Không chỉ đơn thuần là sự kết hợp của các sắc tố, mỗi màu sắc mang trong mình những cảm xúc, liên tưởng và ý nghĩa văn hóa sâu sắc.

Màu đỏ thường gợi lên sự mạnh mẽ và đam mê. Màu xanh dương mang lại cảm giác bình yên, tin tưởng. Màu vàng tượng trưng cho niềm vui và ánh sáng. Hiểu được ngôn ngữ màu sắc giúp người xem cảm nhận tác phẩm sâu sắc hơn.

Các họa sĩ Việt Nam truyền thống thường sử dụng bảng màu tự nhiên lấy từ khoáng vật và thực vật — son đỏ từ thủy ngân, xanh lam từ lazurit, vàng từ hoàng thổ. Những màu sắc này tạo nên vẻ đẹp trầm ấm, bền vững theo thời gian đặc trưng của hội họa cổ điển Việt Nam.',
    N'Tìm hiểu nghệ thuật',
    u.Id, u.Name,
    'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800',
    'Published',
    DATEADD(DAY, -8,  GETUTCDATE()),
    DATEADD(DAY, -8,  GETUTCDATE())
FROM Users u WHERE u.Name = N'Bùi Xuân Phái' AND u.UserType = 2;

-- ── Tô Ngọc Vân – bài 1 ──────────────────────────────────
INSERT INTO BlogPosts
    (Title, Excerpt, Content, Category, AuthorId, AuthorName,
     CoverImageUrl, Status, CreatedAt, PublishedAt)
SELECT
    N'Câu Chuyện Đằng Sau Bức Tranh: Từ Cảm Hứng Đến Tác Phẩm',
    N'Mỗi bức tranh đều ẩn chứa một câu chuyện về nguồn cảm hứng, về quá trình sáng tạo, về những thất bại và thành công. Hãy cùng tôi kể câu chuyện đằng sau những tác phẩm của mình.',
    N'Nhiều người nghĩ rằng một bức tranh được vẽ ra trong vài giờ hay vài ngày. Nhưng thực ra, quá trình tạo ra một tác phẩm nghệ thuật có thể kéo dài hàng tuần, thậm chí hàng tháng, từ lúc nảy sinh ý tưởng đến khi hoàn thiện.

Cảm hứng có thể đến từ bất cứ đâu — một buổi sáng sương mù trên núi, ánh nắng chiều tà trên sông Hương, tiếng cười của trẻ em trong sân làng, hay thậm chí một giấc mơ kỳ lạ giữa đêm khuya.

Sau khi có ý tưởng, tôi thường phác thảo nhiều bản khác nhau trước khi bắt đầu vẽ chính thức. Đây là giai đoạn quan trọng để thử nghiệm bố cục, ánh sáng và màu sắc.

Quá trình vẽ đòi hỏi sự kiên nhẫn và tập trung cao độ. Có những buổi vẽ trôi chảy như nước, nhưng cũng có ngày nhìn vào bức tranh mà không biết phải làm gì tiếp theo — đó là lúc tôi đứng dậy, đi dạo, để tâm trí nghỉ ngơi và tìm lại cảm hứng.',
    N'Câu chuyện tác phẩm',
    u.Id, u.Name,
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800',
    'Published',
    DATEADD(DAY, -5,  GETUTCDATE()),
    DATEADD(DAY, -5,  GETUTCDATE())
FROM Users u WHERE u.Name = N'Tô Ngọc Vân' AND u.UserType = 2;

-- ── Tô Ngọc Vân – bài 2 ──────────────────────────────────
INSERT INTO BlogPosts
    (Title, Excerpt, Content, Category, AuthorId, AuthorName,
     CoverImageUrl, Status, CreatedAt, PublishedAt)
SELECT
    N'Nghệ Thuật Sơn Mài: Di Sản Văn Hóa Cần Được Gìn Giữ',
    N'Sơn mài Việt Nam là một trong những di sản nghệ thuật quý giá nhất. Nhưng nghề sơn mài truyền thống đang đứng trước nguy cơ mai một khi ít người trẻ theo học.',
    N'Sơn mài Việt Nam có lịch sử hơn 2000 năm, gắn liền với nền văn minh lúa nước và tín ngưỡng dân gian. Sơn mài Việt Nam sử dụng nhựa cây sơn ta — loại nhựa cây mọc tự nhiên ở vùng núi phía Bắc — tạo ra bề mặt đặc trưng không thể nhầm lẫn.

Quy trình làm một bức tranh sơn mài truyền thống có thể mất từ 3 đến 6 tháng, với hàng chục lớp sơn được phủ và mài đi mài lại cho đến khi đạt được độ bóng và chiều sâu mong muốn.

Điều đáng lo ngại là hiện nay rất ít thanh niên muốn theo nghề sơn mài truyền thống. Quá trình học nghề kéo dài, đòi hỏi sức khỏe tốt vì nhựa sơn có thể gây dị ứng da, và thu nhập không ổn định trong giai đoạn đầu.

Nhưng vẫn còn những người trẻ đang gìn giữ nghề này — họ nhận ra giá trị kinh tế và văn hóa to lớn của sơn mài Việt Nam trên thị trường quốc tế.',
    N'Nghệ sĩ & Cảm hứng',
    u.Id, u.Name,
    'https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=800',
    'Published',
    DATEADD(DAY, -15, GETUTCDATE()),
    DATEADD(DAY, -15, GETUTCDATE())
FROM Users u WHERE u.Name = N'Tô Ngọc Vân' AND u.UserType = 2;

-- ── Nguyễn Sáng – bài 1 ──────────────────────────────────
INSERT INTO BlogPosts
    (Title, Excerpt, Content, Category, AuthorId, AuthorName,
     CoverImageUrl, Status, CreatedAt, PublishedAt)
SELECT
    N'Tranh Trừu Tượng Và Cách Cảm Nhận Không Cần Giải Thích',
    N'Nhiều người nói rằng không hiểu tranh trừu tượng. Nhưng thực ra, tranh trừu tượng không cần được hiểu — nó cần được cảm nhận. Đây là nghệ thuật giao tiếp trực tiếp với cảm xúc.',
    N'Tranh trừu tượng thường bị hiểu lầm là loại tranh dễ vẽ hay không có ý nghĩa. Thực ra đây là một trong những thể loại đòi hỏi sự nắm vững ngôn ngữ nghệ thuật nhất — họa sĩ phải truyền tải cảm xúc và ý tưởng chỉ thông qua màu sắc, đường nét và hình dạng mà không có sự hỗ trợ của hình ảnh cụ thể.

Khi đứng trước một bức tranh trừu tượng, đừng cố tìm xem nó vẽ cái gì. Thay vào đó, hãy để cảm xúc của bạn dẫn lối. Bạn cảm thấy gì khi nhìn vào bức tranh?

Kandinsky, cha đẻ của nghệ thuật trừu tượng, tin rằng màu sắc và âm nhạc có mối liên hệ sâu sắc — màu vàng có âm thanh như tiếng kèn trumpet, màu xanh lam tối như tiếng đàn organ trầm trầm.

Khi vẽ tranh trừu tượng, tôi thường bắt đầu bằng cảm xúc, không phải ý tưởng. Tôi để tay dẫn cọ theo nhịp của cảm xúc, để màu sắc chảy tự nhiên trên toan.',
    N'Tìm hiểu nghệ thuật',
    u.Id, u.Name,
    'https://images.unsplash.com/photo-1549490349-8643362247b5?w=800',
    'Published',
    DATEADD(DAY, -3,  GETUTCDATE()),
    DATEADD(DAY, -3,  GETUTCDATE())
FROM Users u WHERE u.Name = N'Nguyễn Sáng' AND u.UserType = 2;

-- ── Nguyễn Sáng – bài 2 ──────────────────────────────────
INSERT INTO BlogPosts
    (Title, Excerpt, Content, Category, AuthorId, AuthorName,
     CoverImageUrl, Status, CreatedAt, PublishedAt)
SELECT
    N'Vẽ Phong Cảnh Việt Nam: Tìm Vẻ Đẹp Trong Từng Góc Nhỏ',
    N'Từ ruộng bậc thang Sapa đến bãi biển Mũi Né, từ phố cổ Hội An đến đồng bằng sông Cửu Long — Việt Nam là kho tàng vô tận cho những họa sĩ yêu phong cảnh.',
    N'Mỗi vùng đất của Việt Nam có vẻ đẹp riêng biệt mà không nơi nào trên thế giới có được. Sapa với những thửa ruộng bậc thang vàng óng trong mùa lúa chín, bao quanh bởi những ngọn núi mây phủ quanh năm. Hội An với ánh đèn lồng lung linh phản chiếu trên mặt nước sông Thu Bồn trong những đêm rằm.

Là một họa sĩ chuyên vẽ phong cảnh, tôi đã đặt chân đến hàng chục tỉnh thành trên khắp đất nước. Mỗi chuyến đi là một cuộc khám phá mới, mỗi buổi sáng ở một vùng đất lạ là cơ hội để nhìn thế giới qua lăng kính khác.

Điều thú vị nhất khi vẽ phong cảnh không phải là những cảnh quan hùng vĩ mà chính là những góc nhỏ bình dị — con đường đất đỏ bên bờ ruộng, hàng tre xanh mướt buổi sáng sớm, chiếc thuyền nan neo đậu bên bờ kênh.

Những vẻ đẹp bình dị ấy mới là linh hồn của phong cảnh Việt Nam. Khi vẽ chúng, tôi không chỉ ghi lại hình ảnh mà còn cố gắng lưu giữ một cảm xúc, một khoảnh khắc, một mảnh ký ức về quê hương.',
    N'Câu chuyện tác phẩm',
    u.Id, u.Name,
    'https://images.unsplash.com/photo-1557750255-c76072a7aad1?w=800',
    'Published',
    DATEADD(DAY, -11, GETUTCDATE()),
    DATEADD(DAY, -11, GETUTCDATE())
FROM Users u WHERE u.Name = N'Nguyễn Sáng' AND u.UserType = 2;

-- Ghi nhận vào lịch sử migration EF
IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE MigrationId = '20260619080000_SeedBlogPosts')
    INSERT INTO [__EFMigrationsHistory] (MigrationId, ProductVersion)
    VALUES ('20260619080000_SeedBlogPosts', '9.0.0');
