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
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly IUserRepositoryEF _userRepository;
        private readonly Cloudinary _cloudinary;

        public UsersController(IUserRepositoryEF userRepository, Cloudinary cloudinary)
        {
            _userRepository = userRepository;
            _cloudinary     = cloudinary;
        }

        // ─────────────────────────────────────────────
        // POST /api/users/{id}/avatar
        // Upload ảnh đại diện lên Cloudinary và lưu URL vào DB
        // ─────────────────────────────────────────────
        [HttpPost("{id}/avatar")]
        public async Task<IActionResult> UploadAvatar(string id, IFormFile file)
        {
            var callerId   = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var callerRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (callerId != id && callerRole != "Admin")
                return Forbid();

            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Chưa chọn file" });

            var allowed = new[] { "image/jpeg", "image/png", "image/webp", "image/gif" };
            if (!allowed.Contains(file.ContentType.ToLower()))
                return BadRequest(new { message = "Chỉ chấp nhận JPG, PNG, WEBP, GIF" });

            if (file.Length > 5 * 1024 * 1024)
                return BadRequest(new { message = "File không được vượt quá 5MB" });

            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return NotFound(new { message = "Không tìm thấy người dùng" });

            try
            {
                using var stream = file.OpenReadStream();
                var uploadParams = new ImageUploadParams
                {
                    File   = new FileDescription(file.FileName, stream),
                    Folder = "basecore/avatars",
                    Transformation = new Transformation()
                        .Width(400).Height(400).Crop("fill").Gravity("face")
                        .Quality("auto").FetchFormat("auto")
                };

                var result = await _cloudinary.UploadAsync(uploadParams);
                if (result.Error != null)
                    return StatusCode(500, new { message = result.Error.Message });

                user.Image = result.SecureUrl.ToString();
                await _userRepository.UpdateAsync(user);

                return Ok(new { avatarUrl = user.Image });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Upload thất bại: {ex.Message}" });
            }
        }

        // ─────────────────────────────────────────────
        // GET /api/users/{id}/profile — lấy profile kèm avatarUrl
        // ─────────────────────────────────────────────
        [HttpGet("{id}/profile")]
        public async Task<IActionResult> GetProfile(string id)
        {
            var callerId   = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var callerRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (callerId != id && callerRole != "Admin")
                return Forbid();

            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return NotFound(new { message = "Không tìm thấy người dùng" });

            return Ok(new
            {
                user.Id,
                user.Name,
                user.Email,
                user.Phone,
                avatarUrl = user.Image ?? "",
                bio = user.Bio ?? "",
                user.UserType,
                role = user.UserType switch { 1 => "Admin", 2 => "Artist", _ => "User" }
            });
        }

        // ─────────────────────────────────────────────
        // GET /api/users/artists — public, danh sách nghệ sĩ với avatar
        // ─────────────────────────────────────────────
        [HttpGet("artists")]
        [AllowAnonymous]
        public async Task<IActionResult> GetArtists()
        {
            var (users, _) = await _userRepository.SearchAsync(null, 1, 9999);
            var artists = users
                .Where(u => u.UserType == 2 && u.IsActive)
                .Select(u => new { u.Id, u.Name, avatarUrl = u.Image ?? "", bio = u.Bio ?? "" })
                .ToList();
            return Ok(artists);
        }

        // ─────────────────────────────────────────────
        // GET /api/users — Admin only
        // ─────────────────────────────────────────────
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? keyword,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var (users, totalCount) = await _userRepository.SearchAsync(keyword, page, pageSize);
            return Ok(new
            {
                items = users.Select(u => new
                {
                    u.Id, u.UserName, u.Name, u.Email, u.Phone,
                    avatarUrl = u.Image ?? "",
                    u.UserType,
                    role = u.UserType switch { 1 => "Admin", 2 => "Artist", _ => "User" },
                    u.IsActive, u.Created
                }),
                totalCount, page, pageSize,
                totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            });
        }

        // ─────────────────────────────────────────────
        // GET /api/users/{id} — self or Admin
        // ─────────────────────────────────────────────
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var callerId   = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var callerRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (callerId != id && callerRole != "Admin")
                return Forbid();

            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return NotFound(new { message = "Không tìm thấy người dùng" });

            return Ok(new
            {
                user.Id, user.UserName, user.Name, user.Email, user.Phone,
                avatarUrl = user.Image ?? "",
                bio = user.Bio ?? "",
                user.UserType,
                role = user.UserType switch { 1 => "Admin", 2 => "Artist", _ => "User" },
                user.IsActive, user.Created
            });
        }

        // ─────────────────────────────────────────────
        // PUT /api/users/{id} — self (name/phone) or Admin
        // ─────────────────────────────────────────────
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] UserUpdateDto dto)
        {
            var callerId   = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var callerRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (callerId != id && callerRole != "Admin")
                return Forbid();

            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return NotFound(new { message = "Không tìm thấy người dùng" });

            if (dto.Name      != null) user.Name  = dto.Name;
            if (dto.Phone     != null) user.Phone = dto.Phone;
            if (dto.AvatarUrl != null) user.Image = dto.AvatarUrl;
            if (dto.Bio       != null) user.Bio   = dto.Bio;

            if (callerRole == "Admin" && dto.UserType.HasValue)
                user.UserType = dto.UserType.Value;

            await _userRepository.UpdateAsync(user);
            return Ok(new
            {
                user.Id, user.UserName, user.Name, user.Email, user.Phone,
                avatarUrl = user.Image ?? "",
                bio = user.Bio ?? "",
                user.UserType, user.IsActive
            });
        }

        // ─────────────────────────────────────────────
        // DELETE /api/users/{id} — Admin only
        // ─────────────────────────────────────────────
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(string id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return NotFound(new { message = "Không tìm thấy người dùng" });

            user.IsActive = false;
            await _userRepository.UpdateAsync(user);
            return Ok(new { message = "Đã vô hiệu hóa tài khoản" });
        }
    }

    public class UserUpdateDto
    {
        public string? Name      { get; set; }
        public string? Phone     { get; set; }
        public string? AvatarUrl { get; set; }
        public string? Bio       { get; set; }
        public int?    UserType  { get; set; }
    }
}
