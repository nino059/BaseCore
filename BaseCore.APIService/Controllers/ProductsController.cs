using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Entities;
using BaseCore.Repository.EFCore;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using System.Security.Claims;

namespace BaseCore.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly IProductRepositoryEF _productRepository;
        private readonly ICategoryRepositoryEF _categoryRepository;
        private readonly Cloudinary _cloudinary;

        public ProductsController(
            IProductRepositoryEF productRepository,
            ICategoryRepositoryEF categoryRepository,
            Cloudinary cloudinary)
        {
            _productRepository = productRepository;
            _categoryRepository = categoryRepository;
            _cloudinary = cloudinary;
        }

        // ─────────────────────────────────────────────
        // POST /api/products/upload-image
        // Upload ảnh lên Cloudinary qua backend (có auth)
        // ─────────────────────────────────────────────
        [HttpPost("upload-image")]
        [Authorize]
        public async Task<IActionResult> UploadImage(IFormFile file)
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

                return Ok(new
                {
                    url = result.SecureUrl.ToString(),
                    publicId = result.PublicId
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Upload thất bại: {ex.Message}" });
            }
        }

        // ─────────────────────────────────────────────
        // GET /api/products              ← public: chỉ Available + inStock
        // GET /api/products?admin=1      ← admin: tất cả sản phẩm
        // GET /api/products?sellerId=xxx ← artist: tranh của mình (kể cả Pending)
        // ─────────────────────────────────────────────
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? keyword,
            [FromQuery] int? categoryId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 12,
            [FromQuery] bool admin = false,
            [FromQuery] string? sellerId = null)
        {
            bool publicOnly = !admin && string.IsNullOrEmpty(sellerId);
            var (products, totalCount) = await _productRepository.SearchAsync(keyword, categoryId, page, pageSize, publicOnly, sellerId);

            var items = products.Select(p => ToDto(p)).ToList();

            return Ok(new
            {
                items,
                totalCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            });
        }

        // ─────────────────────────────────────────────
        // GET /api/products/{id}
        // ─────────────────────────────────────────────
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id, [FromQuery] bool admin = false)
        {
            var product = await _productRepository.GetByIdAsync(id);
            if (product == null)
                return NotFound(new { message = "Không tìm thấy sản phẩm" });

            // Public: ẩn sản phẩm không Available hoặc hết hàng
            if (!admin && (product.Status != "Available" || product.Stock <= 0))
                return NotFound(new { message = "Sản phẩm không còn bán" });

            return Ok(ToDto(product));
        }

        // ─────────────────────────────────────────────
        // POST /api/products
        // ─────────────────────────────────────────────
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] ProductCreateDto dto)
        {
            var callerRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var callerId   = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var category = await _categoryRepository.GetByIdAsync(dto.CategoryId);
            if (category == null)
                return BadRequest(new { message = "Thể loại không tồn tại" });

            // Artist: default Pending + auto-set SellerId
            string defaultStatus = callerRole == "Artist" ? "Pending" : (dto.Status ?? "Available");
            string? sellerId = callerRole == "Artist" ? callerId : dto.SellerId;

            var product = new Product
            {
                Name          = dto.Name,
                ArtistName    = dto.ArtistName  ?? "",
                Price         = dto.Price,
                DiscountPrice = dto.DiscountPrice,
                Stock         = dto.Stock,
                CategoryId    = dto.CategoryId,
                Description   = dto.Description ?? "",
                ImageUrl      = dto.ImageUrl    ?? "",
                SellerId      = sellerId,
                Theme         = dto.Theme,
                Material      = dto.Material,
                Width         = dto.Width,
                Height        = dto.Height,
                Status        = defaultStatus
            };

            await _productRepository.AddAsync(product);
            return CreatedAtAction(nameof(GetById), new { id = product.Id }, ToDto(product));
        }

        // ─────────────────────────────────────────────
        // PUT /api/products/{id}
        // ─────────────────────────────────────────────
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> Update(int id, [FromBody] ProductUpdateDto dto)
        {
            var product = await _productRepository.GetByIdAsync(id);
            if (product == null)
                return NotFound(new { message = "Không tìm thấy sản phẩm" });

            if (dto.Name        != null) product.Name          = dto.Name;
            if (dto.ArtistName  != null) product.ArtistName    = dto.ArtistName;
            if (dto.Price       != null) product.Price         = dto.Price.Value;
            product.DiscountPrice = dto.DiscountPrice;
            if (dto.Stock       != null) product.Stock         = dto.Stock.Value;
            if (dto.CategoryId  != null) product.CategoryId  = dto.CategoryId.Value;
            if (dto.Description != null) product.Description = dto.Description;
            if (dto.ImageUrl    != null) product.ImageUrl    = dto.ImageUrl;
            if (dto.SellerId    != null) product.SellerId    = dto.SellerId;
            if (dto.Theme       != null) product.Theme       = dto.Theme;
            if (dto.Material    != null) product.Material    = dto.Material;
            if (dto.Width       != null) product.Width       = dto.Width;
            if (dto.Height      != null) product.Height      = dto.Height;
            if (dto.Status      != null) product.Status      = dto.Status;


            await _productRepository.UpdateAsync(product);
            return Ok(ToDto(product));
        }

        // ─────────────────────────────────────────────
        // DELETE /api/products/{id}  — Admin only
        // Xóa hẳn nếu không có đơn hàng; ẩn (Unavailable) nếu có
        // ─────────────────────────────────────────────
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
                // Sản phẩm đã có trong đơn hàng — ẩn thay vì xóa cứng
                product.Status = "Unavailable";
                await _productRepository.UpdateAsync(product);
                return Ok(new { message = "Sản phẩm đã được ẩn (có đơn hàng liên kết)", deleted = false });
            }
        }

        // ─────────────────────────────────────────────
        // PUT /api/products/{id}/approve — Admin
        // ─────────────────────────────────────────────
        [HttpPut("{id}/approve")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Approve(int id)
        {
            var product = await _productRepository.GetByIdAsync(id);
            if (product == null) return NotFound(new { message = "Không tìm thấy sản phẩm" });

            product.Status = "Available";
            await _productRepository.UpdateAsync(product);
            return Ok(ToDto(product));
        }

        // ─────────────────────────────────────────────
        // PUT /api/products/{id}/reject — Admin
        // ─────────────────────────────────────────────
        [HttpPut("{id}/reject")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Reject(int id)
        {
            var product = await _productRepository.GetByIdAsync(id);
            if (product == null) return NotFound(new { message = "Không tìm thấy sản phẩm" });

            product.Status = "Rejected";
            await _productRepository.UpdateAsync(product);
            return Ok(ToDto(product));
        }

        // ─────────────────────────────────────────────
        // GET /api/products/category/{categoryId}
        // ─────────────────────────────────────────────
        [HttpGet("category/{categoryId}")]
        public async Task<IActionResult> GetByCategory(int categoryId)
        {
            var products = await _productRepository.GetByCategoryAsync(categoryId);
            return Ok(products.Select(p => ToDto(p)).ToList());
        }

        // ─────────────────────────────────────────────
        // Helper: map entity → DTO (tránh circular reference)
        // ─────────────────────────────────────────────
        private static object ToDto(Product p) => new
        {
            p.Id, p.Name, p.ArtistName, p.Price, p.DiscountPrice, p.Stock,
            p.Description, p.ImageUrl, p.CategoryId, p.SellerId,
            p.Theme, p.Material, p.Width, p.Height,
            p.Status,
            categoryName = p.Category?.Name ?? ""
        };
    }

    // ─── DTOs ───────────────────────────────────────

    public class ProductCreateDto
    {
        public string  Name        { get; set; } = "";
        public string? ArtistName  { get; set; }
        public decimal Price       { get; set; }
        public decimal? DiscountPrice { get; set; }
        public int     Stock       { get; set; } = 1;
        public int     CategoryId  { get; set; }
        public string? Description { get; set; }
        public string? ImageUrl    { get; set; }
        public string? SellerId    { get; set; }
        public string? Theme       { get; set; }
        public string? Material    { get; set; }
        public int?    Width       { get; set; }
        public int?    Height      { get; set; }
        public string? Status      { get; set; }
    }

    public class ProductUpdateDto
    {
        public string?  Name        { get; set; }
        public string?  ArtistName  { get; set; }
        public decimal? Price       { get; set; }
        public decimal? DiscountPrice { get; set; }
        public int?     Stock       { get; set; }
        public int?     CategoryId  { get; set; }
        public string?  Description { get; set; }
        public string?  ImageUrl    { get; set; }
        public string?  SellerId    { get; set; }
        public string?  Theme       { get; set; }
        public string?  Material    { get; set; }
        public int?     Width       { get; set; }
        public int?     Height      { get; set; }
        public string?  Status      { get; set; }
    }
}