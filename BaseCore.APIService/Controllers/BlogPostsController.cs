using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Entities;
using BaseCore.Repository;
using BaseCore.APIService.Helpers;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BaseCore.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BlogPostsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public BlogPostsController(AppDbContext db)
        {
            _db = db;
        }

        // GET /api/blogposts              — public: Published only
        // GET /api/blogposts?mine=true    — Artist: own posts (any status)
        // GET /api/blogposts?all=true     — Admin: all posts
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] bool mine = false,
            [FromQuery] bool all = false,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var callerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var callerRole = User.FindFirst(ClaimTypes.Role)?.Value;

            IQueryable<BlogPost> query = _db.BlogPosts.OrderByDescending(b => b.CreatedAt);

            if (all && callerRole == "Admin")
            {
                // Admin sees all
            }
            else if (mine && !string.IsNullOrEmpty(callerId))
            {
                query = query.Where(b => b.AuthorId == callerId);
            }
            else
            {
                query = query.Where(b => b.Status == "Published");
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new { items, totalCount, page, pageSize, totalPages = (int)Math.Ceiling((double)totalCount / pageSize) });
        }

        // GET /api/blogposts/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var post = await _db.BlogPosts.FindAsync(id);
            if (post == null) return NotFound(new { message = "Không tìm thấy bài viết" });

            var callerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var callerRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (post.Status != "Published" && callerId != post.AuthorId && callerRole != "Admin")
                return NotFound(new { message = "Bài viết không tồn tại" });

            return Ok(post);
        }

        // POST /api/blogposts — Artist or Admin
        [HttpPost]
        [Authorize(Roles = "Artist,Admin")]
        public async Task<IActionResult> Create([FromBody] BlogPostDto dto)
        {
            var callerId   = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var callerName = User.FindFirst(ClaimTypes.Name)?.Value ?? User.FindFirst("name")?.Value ?? "";
            var callerRole = User.FindFirst(ClaimTypes.Role)?.Value;

            string authorId   = callerId ?? "";
            string authorName = dto.AuthorName ?? callerName;

            // Admin nhập tên họa sĩ → tìm user khớp để liên kết
            if (callerRole == "Admin" && !string.IsNullOrWhiteSpace(dto.AuthorName))
            {
                var matched = await _db.Users
                    .Where(u => u.Name == dto.AuthorName || u.UserName == dto.AuthorName)
                    .FirstOrDefaultAsync();
                if (matched != null)
                {
                    authorId   = matched.Id;
                    authorName = matched.Name ?? matched.UserName ?? dto.AuthorName;
                }
            }

            var post = new BlogPost
            {
                Title         = dto.Title,
                Excerpt       = dto.Excerpt ?? "",
                Content       = dto.Content ?? "",
                Category      = dto.Category ?? "",
                AuthorId      = authorId,
                AuthorName    = authorName,
                CoverImageUrl = dto.CoverImageUrl,
                Status        = callerRole == "Admin" ? "Published" : "Pending",
                CreatedAt     = DateTime.UtcNow,
                ReadTime      = dto.ReadTime
            };

            _db.BlogPosts.Add(post);
            await _db.SaveChangesAsync();

            // Notify Admin khi artist đăng bài mới chờ duyệt
            if (callerRole == "Artist")
            {
                var adminIds = await NotificationHelper.GetAdminUserIdsAsync(_db);
                foreach (var adminId in adminIds)
                    await NotificationHelper.CreateAsync(_db, adminId,
                        "Bài viết mới chờ duyệt",
                        $"Họa sĩ vừa đăng bài \"{post.Title}\" — cần xét duyệt.",
                        "blog", post.Id.ToString());
            }

            return CreatedAtAction(nameof(GetById), new { id = post.Id }, post);
        }

        // PUT /api/blogposts/{id} — author or Admin
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> Update(int id, [FromBody] BlogPostDto dto)
        {
            var callerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var callerRole = User.FindFirst(ClaimTypes.Role)?.Value;

            var post = await _db.BlogPosts.FindAsync(id);
            if (post == null) return NotFound(new { message = "Không tìm thấy bài viết" });

            if (post.AuthorId != callerId && callerRole != "Admin")
                return Forbid();

            if (dto.Title       != null) post.Title        = dto.Title;
            if (dto.Excerpt     != null) post.Excerpt      = dto.Excerpt;
            if (dto.Content     != null) post.Content      = dto.Content;
            if (dto.Category    != null) post.Category     = dto.Category;
            if (dto.CoverImageUrl != null) post.CoverImageUrl = dto.CoverImageUrl;
            if (dto.ReadTime    != null) post.ReadTime     = dto.ReadTime;

            await _db.SaveChangesAsync();
            return Ok(post);
        }

        // PUT /api/blogposts/{id}/approve — Admin
        [HttpPut("{id}/approve")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Approve(int id)
        {
            var post = await _db.BlogPosts.FindAsync(id);
            if (post == null) return NotFound(new { message = "Không tìm thấy bài viết" });

            post.Status = "Published";
            post.PublishedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            if (!string.IsNullOrEmpty(post.AuthorId))
                await NotificationHelper.CreateAsync(_db, post.AuthorId,
                    "Bài viết được duyệt ✓",
                    $"Bài viết \"{post.Title}\" đã được duyệt và công khai.",
                    "blog", post.Id.ToString());

            return Ok(post);
        }

        // PUT /api/blogposts/{id}/reject — Admin
        [HttpPut("{id}/reject")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Reject(int id)
        {
            var post = await _db.BlogPosts.FindAsync(id);
            if (post == null) return NotFound(new { message = "Không tìm thấy bài viết" });

            post.Status = "Rejected";
            await _db.SaveChangesAsync();

            if (!string.IsNullOrEmpty(post.AuthorId))
                await NotificationHelper.CreateAsync(_db, post.AuthorId,
                    "Bài viết bị từ chối",
                    $"Bài viết \"{post.Title}\" đã bị từ chối.",
                    "blog", post.Id.ToString());

            return Ok(post);
        }

        // DELETE /api/blogposts/{id} — author or Admin
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(int id)
        {
            var callerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var callerRole = User.FindFirst(ClaimTypes.Role)?.Value;

            var post = await _db.BlogPosts.FindAsync(id);
            if (post == null) return NotFound(new { message = "Không tìm thấy bài viết" });

            if (post.AuthorId != callerId && callerRole != "Admin")
                return Forbid();

            _db.BlogPosts.Remove(post);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Đã xóa bài viết" });
        }
    }

    public class BlogPostDto
    {
        public string? Title        { get; set; }
        public string? Excerpt      { get; set; }
        public string? Content      { get; set; }
        public string? Category     { get; set; }
        public string? AuthorName   { get; set; }
        public string? CoverImageUrl { get; set; }
        public string? ReadTime     { get; set; }
    }
}
