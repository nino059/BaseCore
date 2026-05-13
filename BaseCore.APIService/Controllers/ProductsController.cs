using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Entities;
using BaseCore.Repository.EFCore;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

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
        // GET /api/products
        // ─────────────────────────────────────────────
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? keyword,
            [FromQuery] int? categoryId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 12)
        {
            var (products, totalCount) = await _productRepository.SearchAsync(keyword, categoryId, page, pageSize);

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
        public async Task<IActionResult> GetById(int id)
        {
            var product = await _productRepository.GetByIdAsync(id);
            if (product == null)
                return NotFound(new { message = "Không tìm thấy sản phẩm" });

            return Ok(ToDto(product));
        }

        // ─────────────────────────────────────────────
        // POST /api/products
        // ─────────────────────────────────────────────
        [HttpPost]

        public async Task<IActionResult> Create([FromBody] ProductCreateDto dto)
        {
            var category = await _categoryRepository.GetByIdAsync(dto.CategoryId);
            if (category == null)
                return BadRequest(new { message = "Thể loại không tồn tại" });

            var product = new Product
            {
                Name        = dto.Name,
                ArtistName  = dto.ArtistName  ?? "",
                Price       = dto.Price,
                Stock       = dto.Stock,
                CategoryId  = dto.CategoryId,
                Description = dto.Description ?? "",
                ImageUrl    = dto.ImageUrl    ?? "",
                SellerId    = dto.SellerId,
                Theme       = dto.Theme,
                Technique   = dto.Technique,
                Material    = dto.Material,
                Size        = dto.Size,
                Year        = dto.Year,
                IsOriginal  = dto.IsOriginal,
                Condition   = dto.Condition,
                Status      = dto.Status ?? "Available"
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

            if (dto.Name        != null) product.Name        = dto.Name;
            if (dto.ArtistName  != null) product.ArtistName  = dto.ArtistName;
            if (dto.Price       != null) product.Price       = dto.Price.Value;
            if (dto.Stock       != null) product.Stock       = dto.Stock.Value;
            if (dto.CategoryId  != null) product.CategoryId  = dto.CategoryId.Value;
            if (dto.Description != null) product.Description = dto.Description;
            if (dto.ImageUrl    != null) product.ImageUrl    = dto.ImageUrl;
            if (dto.SellerId    != null) product.SellerId    = dto.SellerId;
            if (dto.Theme       != null) product.Theme       = dto.Theme;
            if (dto.Technique   != null) product.Technique   = dto.Technique;
            if (dto.Material    != null) product.Material    = dto.Material;
            if (dto.Size        != null) product.Size        = dto.Size;
            if (dto.Year        != null) product.Year        = dto.Year;
            if (dto.IsOriginal  != null) product.IsOriginal  = dto.IsOriginal.Value;
            if (dto.Condition   != null) product.Condition   = dto.Condition;
            if (dto.Status      != null) product.Status      = dto.Status;


            await _productRepository.UpdateAsync(product);
            return Ok(ToDto(product));
        }

        // ─────────────────────────────────────────────
        // DELETE /api/products/{id}
        // ─────────────────────────────────────────────
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(int id)
        {
            var product = await _productRepository.GetByIdAsync(id);
            if (product == null)
                return NotFound(new { message = "Không tìm thấy sản phẩm" });

            await _productRepository.DeleteAsync(product);
            return Ok(new { message = "Xóa thành công" });
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
        p.Id, p.Name, p.ArtistName, p.Price, p.Stock,
        p.Description, p.ImageUrl, p.CategoryId, p.SellerId,
        p.Theme, p.Technique, p.Material, p.Size,
        p.Year, p.IsOriginal, p.Condition, p.Status,
        categoryName = p.Category?.Name ?? ""
    };
    }

    // ─── DTOs ───────────────────────────────────────

    // DTOs
    public class ProductCreateDto
    {
        public string  Name        { get; set; } = "";
        public string? ArtistName  { get; set; }
        public decimal Price       { get; set; }
        public int     Stock       { get; set; } = 1;
        public int     CategoryId  { get; set; }
        public string? Description { get; set; }
        public string? ImageUrl    { get; set; }
        public string? SellerId    { get; set; }
        public string? Theme       { get; set; }
        public string? Technique   { get; set; }
        public string? Material    { get; set; }
        public string? Size        { get; set; }
        public int?    Year        { get; set; }
        public bool    IsOriginal  { get; set; } = true;
        public string? Condition   { get; set; }
        public string? Status      { get; set; }
    }

    public class ProductUpdateDto
    {
        public string?  Name        { get; set; }
        public string?  ArtistName  { get; set; }
        public decimal? Price       { get; set; }
        public int?     Stock       { get; set; }
        public int?     CategoryId  { get; set; }
        public string?  Description { get; set; }
        public string?  ImageUrl    { get; set; }
        public string?  SellerId    { get; set; }
        public string?  Theme       { get; set; }
        public string?  Technique   { get; set; }
        public string?  Material    { get; set; }
        public string?  Size        { get; set; }
        public int?     Year        { get; set; }
        public bool?    IsOriginal  { get; set; }
        public string?  Condition   { get; set; }
        public string?  Status      { get; set; }
    }
}