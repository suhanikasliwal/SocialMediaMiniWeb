using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;
using SocialAI.Service.Services;
using SocialAI.Service.Infrastructure;

namespace SocialAI.Service.Controllers
{
    [ApiController]
    [Route("admin")]
    public class AdminController : Controller
    {
        private readonly AdminService _service;
        private readonly IWebHostEnvironment _env;

        public AdminController(
            AdminService service,
            IConfiguration config,
            IWebHostEnvironment env)
        {
            _service = service;
            _env = env;

            if (!_env.IsDevelopment())
            {
                DemoAuthState.BypassAuth = false;
            }
            else
            {
                DemoAuthState.BypassAuth =
                    config.GetValue<bool>("Demo:BypassAuth");
            }
        }

        // ======================================================
        // VIEW — Admin UI
        // ======================================================
        [HttpGet]
        public IActionResult Index()
        {
            return View();
        }

        // ======================================================
        // AUTH STATUS
        // ======================================================
        [HttpGet("auth-status")]
        public IActionResult GetAuthStatus()
        {
            return Ok(new
            {
                bypassAuth = DemoAuthState.BypassAuth,
                mode = DemoAuthState.BypassAuth
                    ? "Demo / Open"
                    : "Production / Secured"
            });
        }

        // ======================================================
        // TOGGLE AUTH (DEV ONLY)
        // ======================================================
        [HttpPost("toggle-auth")]
        public IActionResult ToggleAuth([FromQuery] bool enableBypass)
        {
            if (!_env.IsDevelopment())
                return Forbid("Auth toggle disabled in production");

            DemoAuthState.BypassAuth = enableBypass;

            return Ok(new
            {
                message = "Admin auth mode updated (runtime only)",
                bypassAuth = DemoAuthState.BypassAuth
            });
        }

        // ======================================================
        // UPDATE USER ROLE
        // ======================================================
        [HttpPut("users/{id}/role")]
        public async Task<IActionResult> UpdateUserRole(
            string id,
            [FromQuery] string role)
        {
            if (!IsAdminAllowed())
                return Forbid();

            if (role != "Admin" && role != "User")
                return BadRequest("Invalid role");

            await _service.UpdateUserRoleAsync(id, role);

            return Ok(new
            {
                message = "User role updated",
                role
            });
        }

        // ======================================================
        // ADMIN GATE
        // ======================================================
        private bool IsAdminAllowed()
        {
            if (DemoAuthState.BypassAuth)
                return true;

            return User.IsInRole("Admin");
        }

        // ======================================================
        // GET USERS (SEARCH + PAGINATION)
        // ======================================================
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers(
            [FromQuery] string? search,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            if (!IsAdminAllowed())
                return Forbid();

            var (items, totalCount) =
                await _service.GetUsersAsync(search, page, pageSize);

            return Ok(new
            {
                items,
                page,
                pageSize,
                totalCount,
                totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            });
        }

        // ======================================================
        // DELETE USER
        // ======================================================
        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            if (!IsAdminAllowed())
                return Forbid();

            await _service.DeleteUserAsync(id);
            return Ok(new { message = "User deleted successfully" });
        }

        // ======================================================
        // BLOCK USER
        // ======================================================
        [HttpPut("users/{id}/block")]
        public async Task<IActionResult> BlockUser(string id)
        {
            if (!IsAdminAllowed())
                return Forbid();

            await _service.BlockUserAsync(id);
            return Ok(new { message = "User blocked successfully" });
        }
    }
}
