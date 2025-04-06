using Auth_jwt.Models;
using Microsoft.AspNetCore.Identity;

namespace Auth_jwt.Data
{
    public class ApplicationUser : IdentityUser
    {
        public string? Name { get; set; }
        public int? Age { get; set; }
        public double? Weight { get; set; }
        public double? Height { get; set; }
        public string? Gender { get; set; }
        public string? ProfileImagePath { get; set; }

		public List<Friendship> Friends { get; set; } = new();
		public List<ForumPost> Posts { get; set; } = new();
		public List<StepRecord> StepRecords { get; set; } = new();

		public ICollection<Message> SentMessages { get; set; } = new List<Message>();  
		public ICollection<Message> ReceivedMessages { get; set; } = new List<Message>(); 
	}
}
