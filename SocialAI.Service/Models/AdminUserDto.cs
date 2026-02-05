namespace SocialAI.Service.Models
{
    public class AdminUserDto
    {
        public string Id { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Role { get; set; } = null!;
        public bool IsBlocked { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
