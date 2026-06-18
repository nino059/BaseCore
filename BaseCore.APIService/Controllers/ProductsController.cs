using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Entities;
using BaseCore.Repository;
using BaseCore.Repository.EFCore;
using BaseCore.APIService.Helpers;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BaseCore.APIService.Controllers
{
    /*
     * Sơ đồ trạng thái tranh:
     *  Pending → ForSale | Rejected
     *  ForSale → Ordered (đặt hàng) | Sold (restock từ Sold)
     *  Ordered → Sold (giao xong) | ForSale (hủy đơn)
     *  Sold    → ForSale (restock)
     *  Rejected: không thể chuyển trạng thái nữa
     */
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly IProductRepositoryEF _productRepository;
        private readonly ICategoryRepositoryEF _categoryRepository;
        private readonly Cloudinary _cloudinary;
        private readonly AppDbContext _db;

        public ProductsController(
            IProductRepositoryEF productRepository,
            ICategoryRepositoryEF categoryRepository,
            Cloudinary cloudinary,
            AppDbContext db)
        {
            _productRepository = productRepository;
            _categoryRepository = categoryRepository;
            _cloudinary = cloudinary;
            _db = db;
        }

        // ── Upload ảnh ────────────────────────────────────────────────────────
        // POST /api/products/upload-image
        [HttpPost("upload-image")]
        [Authorize(Roles = "Artist,Admin")]
        public async Task<IActionResult> UploadImage([FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Chưa chọn file" });

            var allowed = new[] { "image/jpeg", "image/png", "image/webp", "image/gif" };
            if (!allowed.Contains(file.ContentType.ToLower()))
                return BadRequest(new { message = "Chỉ chấp nhận JPG, PNG, WEBP, GIF" });

            if (file.Length > 5 * 1024 * 1024)
                return BadRequest(new { message = "File không được vượt quá 5MB" });

            try
            {
                using var stream = file.OpenReadStream();
                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = "basecore/products",
                    Transformation = new Transformation()
                        .Width(1200).Height(1200).Crop("limit")
                        .Quality("auto").FetchFormat("auto")
                };

                var result = await _cloudinary.UploadAsync(uploadParams);

                if (result.Error != null)
                    return StatusCode(500, new { message = result.Error.Message });

                return Ok(new { url = result.SecureUrl.ToString(), publicId = result.PublicId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Upload thất bại: {ex.Message}" });
            }
        }

        // ── Danh sách sản phẩm ───────────────────────────────────────────────
        // GET /api/products              ← public: chỉ ForSale
        // GET /api/products?admin=1      ← admin: tất cả
        // GET /api/products?sellerId=xxx ← artist: tất cả tranh của mình
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? keyword,
            [FromQuery] int? categoryId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 12,
            [FromQuery] bool admin = false,
            [FromQuery] string? sellerId = null)
        {
            var callerRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var callerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var isAdmin = callerRole == "Admin";
            var canViewAllPrivate = admin && isAdmin;
            var canViewSellerPrivate = canViewAllPrivate || (!string.IsNullOrEmpty(sellerId) && sellerId == callerId);

            var effectiveSellerId = sellerId;
            var publicOnly = !canViewAllPrivate && !canViewSellerPrivate;

            var (products, totalCount) = await _productRepository.SearchAsync(keyword, categoryId, page, pageSize, publicOnly, effectiveSellerId);

            return Ok(new
            {
                items = products.Select(p => ToDto(p)).ToList(),
                totalCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            });
        }

        // GET /api/products/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id, [FromQuery] bool admin = false)
        {
            var product = await _productRepository.GetByIdAsync(id);
            if (product == null)
                return NotFound(new { message = "Không tìm thấy sản phẩm" });

            var callerRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var callerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var canViewPrivate = (admin && callerRole == "Admin") || (!string.IsNullOrEmpty(callerId) && product.SellerId == callerId);

            if (!canViewPrivate && !IsPubliclyViewable(product.Status))
                return NotFound(new { message = "Sản phẩm không khả dụng" });

            return Ok(ToDto(product));
        }

        // ── Tạo tranh mới ────────────────────────────────────────────────────
        // POST /api/products
        // Artist đăng → Pending. Admin tạo → ForSale ngay.
        [HttpPost]
        [Authorize(Roles = "Artist,Admin")]
        public async Task<IActionResult> Create([FromBody] ProductCreateDto dto)
        {
            var callerRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var callerId   = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (callerRole != "Admin" && callerRole != "Artist")
                return Forbid();

            var validationError = ValidateCreateDto(dto);
            if (validationError != null)
                return BadRequest(new { message = validationError });

            var category = await _categoryRepository.GetByIdAsync(dto.CategoryId);
            if (category == null)
                return BadRequest(new { message = "Thể loại không tồn tại" });

            var product = new Product
            {
                Name          = dto.Name,
                ArtistName    = dto.ArtistName  ?? "",
                Price         = dto.Price,
                CategoryId    = dto.CategoryId,
                Description   = dto.Description ?? "",
                ImageUrl      = dto.ImageUrl    ?? "",
                SellerId      = callerRole == "Artist" ? callerId : dto.SellerId,
                Theme         = dto.Theme,
                Material      = dto.Material,
                Width         = dto.Width,
                Height        = dto.Height,
                Status        = callerRole == "Artist" ? "Pending" : "ForSale"
            };

            await _productRepository.AddAsync(product);

            // Notify Admin khi artist đăng tranh mới chờ duyệt (lỗi thông báo không được làm fail tạo tranh)
            if (callerRole == "Artist")
            {
                await TryNotifyAdminsNewProductAsync(product);
            }

            return CreatedAtAction(nameof(GetById), new { id = product.Id }, ToDto(product));
        }

        // ── Cập nhật thông tin tranh ─────────────────────────────────────────
        // PUT /api/products/{id}
        // Chỉ sửa được khi Status = Pending hoặc ForSale hoặc Sold (không cho sửa khi Ordered/Rejected)
        [HttpPut("{id}")]
        [Authorize(Roles = "Artist,Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] ProductUpdateDto dto)
        {
            var callerRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var callerId   = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var product = await _productRepository.GetByIdAsync(id);
            if (product == null)
                return NotFound(new { message = "Không tìm thấy sản phẩm" });

            if (callerRole != "Admin" && (callerRole != "Artist" || product.SellerId != callerId))
                return Forbid();

            // Artist không được sửa khi đang có đơn hoặc bị từ chối
            if (callerRole == "Artist" && !new[] { "Pending", "ForSale", "Sold" }.Contains(product.Status))
                return BadRequest(new { message = "Không thể sửa tranh đang có đơn hàng" });

            if (dto.Name        != null) product.Name         = dto.Name;
            if (dto.ArtistName  != null) product.ArtistName   = dto.ArtistName;
            if (dto.Price       != null) product.Price        = dto.Price.Value;
            if (dto.CategoryId  != null) product.CategoryId  = dto.CategoryId.Value;
            if (dto.Description != null) product.Description = dto.Description;
            if (dto.ImageUrl    != null) product.ImageUrl    = dto.ImageUrl;
            if (dto.Theme       != null) product.Theme       = dto.Theme;
            if (dto.Material    != null) product.Material    = dto.Material;
            if (dto.Width       != null) product.Width       = dto.Width;
            if (dto.Height      != null) product.Height      = dto.Height;

            await _productRepository.UpdateAsync(product);
            return Ok(ToDto(product));
        }

        // ── Xóa tranh ────────────────────────────────────────────────────────
        // DELETE /api/products/{id} — Admin only
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var product = await _productRepository.GetByIdAsync(id);
            if (product == null)
                return NotFound(new { message = "Không tìm thấy sản phẩm" });

            try
            {
                await _productRepository.DeleteAsync(product);
                return Ok(new { message = "Đã xóa sản phẩm thành công", deleted = true });
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateException)
            {
                return BadRequest(new { message = "Không thể xóa tranh đang có đơn hàng liên kết" });
            }
        }

        // ── Admin duyệt ──────────────────────────────────────────────────────
        // PUT /api/products/{id}/approve
        // Chỉ duyệt được tranh đang Pending
        [HttpPut("{id}/approve")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Approve(int id)
        {
            var product = await _productRepository.GetByIdAsync(id);
            if (product == null) return NotFound(new { message = "Không tìm thấy sản phẩm" });

            if (product.Status != "Pending")
                return BadRequest(new { message = $"Chỉ có thể duyệt tranh đang ở trạng thái Chờ duyệt (hiện tại: {product.Status})" });

            product.Status    = "ForSale";
            product.AdminNote = null;
            await _productRepository.UpdateAsync(product);

            if (!string.IsNullOrEmpty(product.SellerId))
                await NotificationHelper.CreateAsync(_db, product.SellerId,
                    "Tranh được duyệt ✓",
                    $"Tranh \"{product.Name}\" đã được duyệt và hiện đang bán.",
                    "product", product.Id.ToString());

            return Ok(ToDto(product));
        }

        // ── Admin từ chối ────────────────────────────────────────────────────
        // PUT /api/products/{id}/reject
        // Chỉ từ chối được tranh đang Pending, kèm lý do bắt buộc
        [HttpPut("{id}/reject")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Reject(int id, [FromBody] AdminNoteDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Note))
                return BadRequest(new { message = "Vui lòng cung cấp lý do từ chối" });

            var product = await _productRepository.GetByIdAsync(id);
            if (product == null) return NotFound(new { message = "Không tìm thấy sản phẩm" });

            if (product.Status != "Pending")
                return BadRequest(new { message = $"Chỉ có thể từ chối tranh đang ở trạng thái Chờ duyệt (hiện tại: {product.Status})" });

            product.Status    = "Rejected";
            product.AdminNote = dto.Note.Trim();
            await _productRepository.UpdateAsync(product);

            if (!string.IsNullOrEmpty(product.SellerId))
                await NotificationHelper.CreateAsync(_db, product.SellerId,
                    "Tranh bị từ chối",
                    $"Tranh \"{product.Name}\" bị từ chối: {dto.Note.Trim()}",
                    "product", product.Id.ToString());

            return Ok(ToDto(product));
        }

        // ── Artist đánh lại còn hàng ─────────────────────────────────────────
        // PUT /api/products/{id}/restock
        // Chuyển Sold → ForSale (họa sĩ vẽ lại hoặc muốn bán lại)
        [HttpPut("{id}/restock")]
        [Authorize(Roles = "Artist")]
        public async Task<IActionResult> Restock(int id)
        {
            var callerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var product = await _productRepository.GetByIdAsync(id);
            if (product == null) return NotFound(new { message = "Không tìm thấy sản phẩm" });

            if (product.SellerId != callerId)
                return Forbid();

            if (product.Status != "Sold")
                return BadRequest(new { message = "Chỉ có thể đánh còn hàng cho tranh đã bán (Sold)" });

            product.Status = "ForSale";
            await _productRepository.UpdateAsync(product);
            return Ok(ToDto(product));
        }

        // ── Lấy theo danh mục ────────────────────────────────────────────────
        // GET /api/products/category/{categoryId}
        [HttpGet("category/{categoryId}")]
        public async Task<IActionResult> GetByCategory(int categoryId)
        {
            var products = await _productRepository.GetByCategoryAsync(categoryId);
            return Ok(products.Where(p => IsPubliclyViewable(p.Status)).Select(p => ToDto(p)).ToList());
        }

        // ── Helper ───────────────────────────────────────────────────────────
        private static object ToDto(Product p) => new
        {
            p.Id, p.Name, p.ArtistName, p.Price,
            p.Description, p.ImageUrl, p.CategoryId, p.SellerId,
            p.Theme, p.Material, p.Width, p.Height,
            // Normalize legacy status values from old database records
            Status = NormalizeProductStatus(p.Status),
            p.AdminNote,
            categoryName = p.Category?.Name ?? ""
        };

        private static bool IsSellable(string? status)
        {
            var normalized = NormalizeProductStatus(status);
            return normalized == "ForSale";
        }

        private static bool IsPubliclyViewable(string? status)
        {
            var normalized = NormalizeProductStatus(status);
            return normalized is "ForSale" or "Ordered" or "Sold";
        }

        /// <summary>
        /// Normalizes legacy product status values to the current system.
        /// This ensures the frontend always receives clean data even if the database still has old values.
        /// </summary>
        private static string NormalizeProductStatus(string? status)
        {
            return status switch
            {
                "Available" => "ForSale",
                "Unavailable" or "Hidden" => "Rejected",
                "OutOfStock" => "Sold",
                null or "" => "Pending",
                _ => status
            };
        }

        private static string? ValidateCreateDto(ProductCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return "Vui lòng nhập tên tác phẩm";
            if (dto.Name.Length > 200)
                return "Tên tác phẩm tối đa 200 ký tự";
            if (dto.CategoryId <= 0)
                return "Vui lòng chọn thể loại";
            if (dto.Price <= 0)
                return "Giá bán phải lớn hơn 0";
            if (string.IsNullOrWhiteSpace(dto.Material))
                return "Vui lòng chọn chất liệu";
            if (string.IsNullOrWhiteSpace(dto.Theme))
                return "Vui lòng chọn chủ đề";
            if (!dto.Width.HasValue || dto.Width <= 0)
                return "Chiều rộng phải lớn hơn 0";
            if (!dto.Height.HasValue || dto.Height <= 0)
                return "Chiều cao phải lớn hơn 0";
            if (string.IsNullOrWhiteSpace(dto.Description))
                return "Vui lòng nhập mô tả tác phẩm";
            if (dto.Description.Length > 1000)
                return "Mô tả tối đa 1000 ký tự";
            if (string.IsNullOrWhiteSpace(dto.ImageUrl))
                return "Vui lòng upload ảnh tác phẩm";
            if (dto.ImageUrl.Length > 500)
                return "URL ảnh quá dài — vui lòng upload lại ảnh";
            return null;
        }

        private async Task TryNotifyAdminsNewProductAsync(Product product)
        {
            try
            {
                var adminIds = await NotificationHelper.GetAdminUserIdsAsync(_db);
                foreach (var adminId in adminIds)
                {
                    await NotificationHelper.CreateAsync(_db, adminId,
                        "Tranh mới chờ duyệt",
                        $"Họa sĩ vừa đăng tranh \"{product.Name}\" — cần xét duyệt.",
                        "product", product.Id.ToString());
                }
            }
            catch
            {
                foreach (var entry in _db.ChangeTracker.Entries<Notification>()
                    .Where(e => e.State == EntityState.Added).ToList())
                {
                    entry.State = EntityState.Detached;
                }
            }
        }
    }

    // ─── DTOs ───────────────────────────────────────────────────────────────

    public class ProductCreateDto
    {
        public string   Name          { get; set; } = "";
        public string?  ArtistName    { get; set; }
        public decimal  Price         { get; set; }
        public int      CategoryId    { get; set; }
        public string?  Description   { get; set; }
        public string?  ImageUrl      { get; set; }
        public string?  SellerId      { get; set; }
        public string?  Theme         { get; set; }
        public string?  Material      { get; set; }
        public int?     Width         { get; set; }
        public int?     Height        { get; set; }
    }

    public class ProductUpdateDto
    {
        public string?  Name          { get; set; }
        public string?  ArtistName    { get; set; }
        public decimal? Price         { get; set; }
        public int?     CategoryId    { get; set; }
        public string?  Description   { get; set; }
        public string?  ImageUrl      { get; set; }
        public string?  Theme         { get; set; }
        public string?  Material      { get; set; }
        public int?     Width         { get; set; }
        public int?     Height        { get; set; }
    }

    public class AdminNoteDto
    {
        public string Note { get; set; } = "";
    }
}
