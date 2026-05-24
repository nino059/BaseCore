-- ============================================================
-- FIX: Reset mật khẩu họa sĩ seed về plain text "Artist@123"
-- Chạy file này trong SSMS nếu không đăng nhập được
-- ============================================================
USE BaseCoreSales;
GO

-- 1. Kiểm tra hiện trạng
SELECT Id, Name, UserName, Password,
       DATALENGTH(Salt) AS SaltLength,
       IsActive, UserType
FROM Users
WHERE UserName IN (N'buixuanphai',N'tongocvan',N'duongbichlien',
                   N'nguyensang',N'tranvancan',N'nguyentunghiem');
GO

-- 2. Reset Salt = NULL và Password = plain text cho tất cả họa sĩ
--    (Salt = NULL → code C# dùng so sánh plain text)
UPDATE Users
SET
    Password = N'Artist@123',
    Salt     = NULL,
    IsActive = 1
WHERE UserName IN (N'buixuanphai',N'tongocvan',N'duongbichlien',
                   N'nguyensang',N'tranvancan',N'nguyentunghiem');

PRINT CONCAT('Rows updated: ', @@ROWCOUNT);
GO

-- 3. Nếu chưa có user nào → insert đầy đủ
IF NOT EXISTS (SELECT 1 FROM Users WHERE UserName = N'buixuanphai')
    INSERT INTO Users (Id, Name, UserName, Password, Salt, Email, Phone, Image, Bio, IsActive, UserType, Created)
    VALUES (N'a0000001-0000-0000-0000-000000000001', N'Bùi Xuân Phái',
            N'buixuanphai', N'Artist@123', NULL,
            N'buixuanphai@arthentic.vn', N'',
            N'https://upload.wikimedia.org/wikipedia/en/8/8b/Bui_Xuan_Phai_image.jpg',
            N'Bùi Xuân Phái (1920–1988) là một trong những họa sĩ tiêu biểu nhất của mỹ thuật Việt Nam hiện đại, đặc biệt nổi danh với những tác phẩm miêu tả phố cổ Hà Nội — được giới mộ điệu gọi trìu mến là "Phố Phái".',
            1, 2, GETDATE());

IF NOT EXISTS (SELECT 1 FROM Users WHERE UserName = N'tongocvan')
    INSERT INTO Users (Id, Name, UserName, Password, Salt, Email, Phone, Image, Bio, IsActive, UserType, Created)
    VALUES (N'a0000002-0000-0000-0000-000000000002', N'Tô Ngọc Vân',
            N'tongocvan', N'Artist@123', NULL,
            N'tongocvan@arthentic.vn', N'',
            N'https://upload.wikimedia.org/wikipedia/commons/4/49/Portrait_of_T%C3%B4_Ng%E1%BB%8Dc_V%C3%A2n.png',
            N'Tô Ngọc Vân (1906–1954) là một trong những danh họa vĩ đại nhất của mỹ thuật Việt Nam.',
            1, 2, GETDATE());

IF NOT EXISTS (SELECT 1 FROM Users WHERE UserName = N'duongbichlien')
    INSERT INTO Users (Id, Name, UserName, Password, Salt, Email, Phone, Image, Bio, IsActive, UserType, Created)
    VALUES (N'a0000003-0000-0000-0000-000000000003', N'Dương Bích Liên',
            N'duongbichlien', N'Artist@123', NULL,
            N'duongbichlien@arthentic.vn', N'',
            N'https://upload.wikimedia.org/wikipedia/en/f/f2/Duong_Bich_Lien_Portrait_of_a_lady.jpg',
            N'Dương Bích Liên (1924–1988) là họa sĩ tài danh thuộc "Tứ kiệt mỹ thuật Việt Nam".',
            1, 2, GETDATE());

IF NOT EXISTS (SELECT 1 FROM Users WHERE UserName = N'nguyensang')
    INSERT INTO Users (Id, Name, UserName, Password, Salt, Email, Phone, Image, Bio, IsActive, UserType, Created)
    VALUES (N'a0000004-0000-0000-0000-000000000004', N'Nguyễn Sáng',
            N'nguyensang', N'Artist@123', NULL,
            N'nguyensang@arthentic.vn', N'',
            N'https://upload.wikimedia.org/wikipedia/en/2/20/Nguyen_Sang_Ladies.jpg',
            N'Nguyễn Sáng (1923–1988) là trưởng nhóm "Tứ kiệt" trong mỹ thuật Việt Nam hiện đại.',
            1, 2, GETDATE());

IF NOT EXISTS (SELECT 1 FROM Users WHERE UserName = N'tranvancan')
    INSERT INTO Users (Id, Name, UserName, Password, Salt, Email, Phone, Image, Bio, IsActive, UserType, Created)
    VALUES (N'a0000005-0000-0000-0000-000000000005', N'Trần Văn Cẩn',
            N'tranvancan', N'Artist@123', NULL,
            N'tranvancan@arthentic.vn', N'',
            N'https://upload.wikimedia.org/wikipedia/en/6/65/Tran_Van_Can%2C_Em_Thuy.jpg',
            N'Trần Văn Cẩn (1910–1994) sinh tại Kiến An, Hải Phòng — họa sĩ và nhà giáo dục nghệ thuật lớn của Việt Nam.',
            1, 2, GETDATE());

IF NOT EXISTS (SELECT 1 FROM Users WHERE UserName = N'nguyentunghiem')
    INSERT INTO Users (Id, Name, UserName, Password, Salt, Email, Phone, Image, Bio, IsActive, UserType, Created)
    VALUES (N'a0000006-0000-0000-0000-000000000006', N'Nguyễn Tư Nghiêm',
            N'nguyentunghiem', N'Artist@123', NULL,
            N'nguyentunghiem@arthentic.vn', N'',
            N'',
            N'Nguyễn Tư Nghiêm (1919–2016) là một trong "Tứ kiệt mỹ thuật Việt Nam".',
            1, 2, GETDATE());
GO

-- 4. Xác nhận kết quả cuối
SELECT Id, Name, UserName,
       LEFT(Password,20) AS PasswordPreview,
       Salt,
       IsActive, UserType
FROM Users
WHERE UserName IN (N'buixuanphai',N'tongocvan',N'duongbichlien',
                   N'nguyensang',N'tranvancan',N'nguyentunghiem')
ORDER BY UserName;
GO
