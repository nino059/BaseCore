using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Entities;
using BaseCore.Services.Authen;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace BaseCore.AuthService.Controllers
{
    [Route("api/users")]
    [ApiController]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;

        public UserController(IUserService userService)
        {
            _userService = userService;
        }

        // GET /api/users/artists — public
        [HttpGet("artists")]
        [AllowAnonymous]
        public async Task<IActionResult> GetArtists()
        {
            var (users, _) = await _userService.Search(null, 1, 9999);
            var artists = users
                .Where(u => u.UserType == 2)
                .Select(u => new { u.Id, u.Name, avatarUrl = u.Image ?? "", bio = u.Bio ?? "" })
                .ToList();
            return Ok(artists);
        }

        // GET /api/users — Admin only
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll([FromQuery] string keyword = "", [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var (users, totalCount) = await _userService.Search(keyword, page, pageSize);

            var result = users.Select(u => new UserResponse
            {
                Id        = u.Id,
                Username  = u.UserName,
                Name      = u.Name,
                Email     = u.Email,
                Phone     = u.Phone,
                AvatarUrl = u.Image ?? "",
                IsActive  = u.IsActive,
                UserType  = u.UserType,
                Created   = u.Created
            });

            return Ok(new
            {
                data = result,
                totalCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            });
        }

        // GET /api/users/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var callerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var callerRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (callerId != id && callerRole != "Admin")
                return Forbid();

            var user = await _userService.GetById(id);
            if (user == null)
                return NotFound(new { message = "User not found" });

            return Ok(new UserResponse
            {
                Id        = user.Id,
                Username  = user.UserName,
                Name      = user.Name,
                Email     = user.Email,
                Phone     = user.Phone,
                AvatarUrl = user.Image ?? "",
                Bio       = user.Bio   ?? "",
                IsActive  = user.IsActive,
                UserType  = user.UserType,
                Created   = user.Created
            });
        }

        // POST /api/users — Admin only
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
        {
            if (request == null)
                return BadRequest(new { message = "Invalid request" });

            if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
                return BadRequest(new { message = "Username and password are required" });

            try
            {
                var user = new User
                {
                    Id       = Guid.NewGuid().ToString(),
                    UserName = request.Username,
                    Name     = request.Name ?? request.Username,
                    Email    = request.Email ?? "",
                    Phone    = request.Phone ?? "",
                    Image    = "",
                    UserType = request.UserType
                };

                var createdUser = await _userService.Create(user, request.Password);

                return CreatedAtAction(nameof(GetById), new { id = createdUser.Id }, new UserResponse
                {
                    Id        = createdUser.Id,
                    Username  = createdUser.UserName,
                    Name      = createdUser.Name,
                    Email     = createdUser.Email,
                    Phone     = createdUser.Phone,
                    AvatarUrl = createdUser.Image ?? "",
                    IsActive  = createdUser.IsActive,
                    UserType  = createdUser.UserType,
                    Created   = createdUser.Created
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Failed to create user: " + ex.Message });
            }
        }

        // PUT /api/users/{id} — self (name/phone/avatarUrl) or Admin (+ userType/isActive/password)
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateUserRequest request)
        {
            if (request == null)
                return BadRequest(new { message = "Invalid request" });

            var callerId   = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var callerRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (callerId != id && callerRole != "Admin")
                return Forbid();

            var existingUser = await _userService.GetById(id);
            if (existingUser == null)
                return NotFound(new { message = "User not found" });

            if (request.Name      != null) existingUser.Name  = request.Name;
            if (request.Phone     != null) existingUser.Phone = request.Phone;
            if (request.AvatarUrl != null) existingUser.Image = request.AvatarUrl;
            if (request.Bio       != null) existingUser.Bio   = request.Bio;

            // Only Admin can change role / active status
            if (callerRole == "Admin")
            {
                if (request.Email    != null) existingUser.Email    = request.Email;
                if (request.UserType.HasValue) existingUser.UserType = request.UserType.Value;
                if (request.IsActive.HasValue) existingUser.IsActive = request.IsActive.Value;
            }

            await _userService.Update(existingUser, request.Password);

            return Ok(new UserResponse
            {
                Id        = existingUser.Id,
                Username  = existingUser.UserName,
                Name      = existingUser.Name,
                Email     = existingUser.Email,
                Phone     = existingUser.Phone,
                AvatarUrl = existingUser.Image ?? "",
                Bio       = existingUser.Bio   ?? "",
                IsActive  = existingUser.IsActive,
                UserType  = existingUser.UserType,
                Created   = existingUser.Created
            });
        }

        // DELETE /api/users/{id} — Admin only
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(string id)
        {
            var existingUser = await _userService.GetById(id);
            if (existingUser == null)
                return NotFound(new { message = "User not found" });

            await _userService.Delete(id);
            return NoContent();
        }
    }

    public class UserResponse
    {
        public string?   Id        { get; set; }
        public string?   Username  { get; set; }
        public string?   Name      { get; set; }
        public string?   Email     { get; set; }
        public string?   Phone     { get; set; }
        public string?   AvatarUrl { get; set; }
        public string?   Bio       { get; set; }
        public bool     IsActive  { get; set; }
        public int      UserType  { get; set; }
        public DateTime Created   { get; set; }
    }

    public class CreateUserRequest
    {
        public string? Username  { get; set; }
        public string? Password  { get; set; }
        public string? Name      { get; set; }
        public string? Email     { get; set; }
        public string? Phone     { get; set; }
        public string? Position  { get; set; }
        public int    UserType  { get; set; }
    }

    public class UpdateUserRequest
    {
        public string? Password  { get; set; }
        public string? Name      { get; set; }
        public string? Email     { get; set; }
        public string? Phone     { get; set; }
        public string? AvatarUrl { get; set; }
        public string? Bio       { get; set; }
        public int?    UserType  { get; set; }
        public bool?   IsActive  { get; set; }
    }
}
