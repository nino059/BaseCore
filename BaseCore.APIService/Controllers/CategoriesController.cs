using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Entities;
using BaseCore.Repository.EFCore;

namespace BaseCore.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoriesController : ControllerBase
    {
        private readonly ICategoryRepositoryEF _categoryRepository;

        public CategoriesController(ICategoryRepositoryEF categoryRepository)
        {
            _categoryRepository = categoryRepository;
        }

        /// <summary>Get all categories</summary>
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var categories = await _categoryRepository.GetAllAsync();
            // ✅ Map DTO — bỏ Products tránh circular reference
            var result = categories.Select(c => new {
                c.Id,
                c.Name,
                c.Description,
                c.Slug,
                c.Icon
            }).ToList();
            return Ok(result);
        }

        /// <summary>Get category by ID</summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var category = await _categoryRepository.GetByIdAsync(id);
            if (category == null)
                return NotFound(new { message = "Category not found" });

            // ✅ Map DTO
            return Ok(new {
                category.Id,
                category.Name,
                category.Description,
                category.Slug,
                category.Icon
            });
        }

        /// <summary>Create new category</summary>
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CategoryDto dto)
        {
            var existing = await _categoryRepository.GetByNameAsync(dto.Name);
            if (existing != null)
                return BadRequest(new { message = "Tên danh mục đã tồn tại" });

            var category = new Category
            {
                Name = dto.Name,
                Description = dto.Description ?? "",
                Slug = dto.Slug ?? dto.Name.ToLower().Replace(" ", "-"),
                Icon = dto.Icon ?? ""
            };

            await _categoryRepository.AddAsync(category);

            // ✅ Map DTO
            return CreatedAtAction(nameof(GetById), new { id = category.Id }, new {
                category.Id,
                category.Name,
                category.Description,
                category.Slug,
                category.Icon
            });
        }

        /// <summary>Update category</summary>
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> Update(int id, [FromBody] CategoryDto dto)
        {
            var category = await _categoryRepository.GetByIdAsync(id);
            if (category == null)
                return NotFound(new { message = "Category not found" });

            category.Name = dto.Name ?? category.Name;
            category.Description = dto.Description ?? category.Description;
            category.Slug = dto.Slug ?? category.Slug;
            category.Icon = dto.Icon ?? category.Icon;

            await _categoryRepository.UpdateAsync(category);

            // ✅ Map DTO
            return Ok(new {
                category.Id,
                category.Name,
                category.Description,
                category.Slug,
                category.Icon
            });
        }

        /// <summary>Delete category</summary>
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(int id)
        {
            var category = await _categoryRepository.GetByIdAsync(id);
            if (category == null)
                return NotFound(new { message = "Category not found" });

            await _categoryRepository.DeleteAsync(category);
            return Ok(new { message = "Category deleted successfully" });
        }
    }

    public class CategoryDto
    {
        public string Name { get; set; } = "";
        public string? Description { get; set; }
        public string? Slug { get; set; }
        public string? Icon { get; set; }
    }
}