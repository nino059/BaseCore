using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Entities;
using BaseCore.Repository.EFCore;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using BaseCore.Common;
using System.Security.Claims;

namespace BaseCore.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly IUserRepositoryEF _userRepository;
        private readonly IUserAddressRepositoryEF _addressRepository;
        private readonly Cloudinary _cloudinary;

        public UsersController(
            IUserRepositoryEF userRepository,
            IUserAddressRepositoryEF addressRepository,
            Cloudinary cloudinary)
        {
            _userRepository    = userRepository;
            _addressRepository = addressRepository;
            _cloudinary        = cloudinary;
        }

        private bool CanAccessUser(string userId)
        {
            var callerId   = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var callerRole = User.FindFirst(ClaimTypes.Role)?.Value;
            return callerId == userId || callerRole == "Admin";
        }

        private static object ToAddressResponse(UserAddress a) => new
        {
            a.Id,
            fullName    = a.FullName,
            phone       = a.Phone,
            addressLine = a.AddressLine,
            ward        = a.Ward ?? "",
            city        = a.City,
            isDefault   = a.IsDefault,
            a.CreatedAt
        };

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
                .Where(u => u.UserType == 2)
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
            [FromQuery] int pageSize = 20,
            [FromQuery] int? userType = null)
        {
            var (users, totalCount) = await _userRepository.SearchAsync(keyword, page, pageSize, userType);
            return Ok(new
            {
                items = users.Select(u => new
                {
                    u.Id,
                    username  = u.UserName,
                    u.Name,
                    u.Email,
                    u.Phone,
                    avatarUrl = u.Image ?? "",
                    userType  = u.UserType,
                    role      = u.UserType switch { 1 => "Admin", 2 => "Artist", _ => "User" },
                    u.Created
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
                user.Id,
                username  = user.UserName,
                user.Name,
                user.Email,
                user.Phone,
                avatarUrl = user.Image ?? "",
                bio       = user.Bio ?? "",
                userType  = user.UserType,
                role      = user.UserType switch { 1 => "Admin", 2 => "Artist", _ => "User" },
                user.Created
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

            if (!string.IsNullOrEmpty(dto.NewPassword))
            {
                if (dto.NewPassword.Length < 6)
                    return BadRequest(new { message = "Mat khau moi phai co it nhat 6 ky tu" });

                if (callerRole != "Admin")
                {
                    if (string.IsNullOrEmpty(dto.CurrentPassword))
                        return BadRequest(new { message = "Vui long nhap mat khau hien tai" });

                    var validCurrentPassword = user.Salt != null && user.Salt.Length > 1
                        ? TokenHelper.IsValidPassword(dto.CurrentPassword, user.Salt, user.Password)
                        : user.Password == dto.CurrentPassword;

                    if (!validCurrentPassword)
                        return BadRequest(new { message = "Mat khau hien tai khong dung" });
                }

                user.Password = TokenHelper.HashPassword(dto.NewPassword, out var salt);
                user.Salt = salt;
            }

            await _userRepository.UpdateAsync(user);
            return Ok(new
            {
                user.Id, user.UserName, user.Name, user.Email, user.Phone,
                avatarUrl = user.Image ?? "",
                bio = user.Bio ?? "",
                user.UserType
            });
        }

        // ─────────────────────────────────────────────
        // GET /api/users/{id}/addresses
        // ─────────────────────────────────────────────
        [HttpGet("{id}/addresses")]
        public async Task<IActionResult> GetAddresses(string id)
        {
            if (!CanAccessUser(id)) return Forbid();

            var addresses = await _addressRepository.GetByUserIdAsync(id);
            return Ok(addresses.Select(ToAddressResponse));
        }

        // ─────────────────────────────────────────────
        // POST /api/users/{id}/addresses
        // ─────────────────────────────────────────────
        [HttpPost("{id}/addresses")]
        public async Task<IActionResult> CreateAddress(string id, [FromBody] UserAddressDto dto)
        {
            if (!CanAccessUser(id)) return Forbid();
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var count = await _addressRepository.CountByUserIdAsync(id);
            var makeDefault = dto.IsDefault || count == 0;
            if (!makeDefault && await _addressRepository.GetDefaultAsync(id) == null)
                makeDefault = true;

            if (makeDefault)
                await _addressRepository.ClearDefaultAsync(id);

            var address = new UserAddress
            {
                UserId      = id,
                FullName    = dto.FullName.Trim(),
                Phone       = dto.Phone.Trim(),
                AddressLine = dto.AddressLine.Trim(),
                Ward        = string.IsNullOrWhiteSpace(dto.Ward) ? null : dto.Ward.Trim(),
                City        = dto.City.Trim(),
                IsDefault   = makeDefault,
                CreatedAt   = DateTime.Now
            };

            await _addressRepository.AddAsync(address);
            return Ok(ToAddressResponse(address));
        }

        // ─────────────────────────────────────────────
        // PUT /api/users/{id}/addresses/{addressId}
        // ─────────────────────────────────────────────
        [HttpPut("{id}/addresses/{addressId}")]
        public async Task<IActionResult> UpdateAddress(string id, int addressId, [FromBody] UserAddressDto dto)
        {
            if (!CanAccessUser(id)) return Forbid();

            var address = await _addressRepository.GetByIdAsync(addressId, id);
            if (address == null) return NotFound(new { message = "Không tìm thấy địa chỉ" });

            address.FullName    = dto.FullName.Trim();
            address.Phone       = dto.Phone.Trim();
            address.AddressLine = dto.AddressLine.Trim();
            address.Ward        = string.IsNullOrWhiteSpace(dto.Ward) ? null : dto.Ward.Trim();
            address.City        = dto.City.Trim();

            if (dto.IsDefault && !address.IsDefault)
            {
                await _addressRepository.ClearDefaultAsync(id);
                address.IsDefault = true;
            }
            else if (!dto.IsDefault && address.IsDefault)
            {
                var others = await _addressRepository.GetByUserIdAsync(id);
                if (others.Count <= 1)
                    address.IsDefault = true;
                else
                {
                    address.IsDefault = false;
                    await _addressRepository.UpdateAsync(address);
                    var next = others.FirstOrDefault(a => a.Id != addressId);
                    if (next != null)
                    {
                        next.IsDefault = true;
                        await _addressRepository.UpdateAsync(next);
                    }
                    return Ok(ToAddressResponse(address));
                }
            }

            await _addressRepository.UpdateAsync(address);
            return Ok(ToAddressResponse(address));
        }

        // ─────────────────────────────────────────────
        // PUT /api/users/{id}/addresses/{addressId}/default
        // ─────────────────────────────────────────────
        [HttpPut("{id}/addresses/{addressId}/default")]
        public async Task<IActionResult> SetDefaultAddress(string id, int addressId)
        {
            if (!CanAccessUser(id)) return Forbid();

            var address = await _addressRepository.GetByIdAsync(addressId, id);
            if (address == null) return NotFound(new { message = "Không tìm thấy địa chỉ" });

            await _addressRepository.ClearDefaultAsync(id);
            address.IsDefault = true;
            await _addressRepository.UpdateAsync(address);
            return Ok(ToAddressResponse(address));
        }

        // ─────────────────────────────────────────────
        // DELETE /api/users/{id}/addresses/{addressId}
        // ─────────────────────────────────────────────
        [HttpDelete("{id}/addresses/{addressId}")]
        public async Task<IActionResult> DeleteAddress(string id, int addressId)
        {
            if (!CanAccessUser(id)) return Forbid();

            var address = await _addressRepository.GetByIdAsync(addressId, id);
            if (address == null) return NotFound(new { message = "Không tìm thấy địa chỉ" });

            var wasDefault = address.IsDefault;
            await _addressRepository.DeleteAsync(address);

            if (wasDefault)
            {
                var remaining = await _addressRepository.GetByUserIdAsync(id);
                if (remaining.Count > 0)
                {
                    remaining[0].IsDefault = true;
                    await _addressRepository.UpdateAsync(remaining[0]);
                }
            }

            return Ok(new { message = "Đã xóa địa chỉ" });
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

            await _userRepository.DeleteAsync(user);
            return Ok(new { message = "Đã xóa tài khoản" });
        }
    }

    public class UserUpdateDto
    {
        public string? Name      { get; set; }
        public string? Phone     { get; set; }
        public string? AvatarUrl { get; set; }
        public string? Bio       { get; set; }
        public string? CurrentPassword { get; set; }
        public string? NewPassword { get; set; }
        public int?    UserType  { get; set; }
    }

    public class UserAddressDto
    {
        public string FullName    { get; set; } = "";
        public string Phone       { get; set; } = "";
        public string AddressLine { get; set; } = "";
        public string? Ward       { get; set; }
        public string City        { get; set; } = "";
        public bool IsDefault     { get; set; }
    }
}
