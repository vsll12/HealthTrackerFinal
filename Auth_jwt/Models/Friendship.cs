using Auth_jwt.Data;

namespace Auth_jwt.Models
{
	public class Friendship
	{
        public int Id { get; set; }
        public string UserId1 { get; set; }
        public string UserId2 { get; set; }

		public FriendshipStatus Status { get; set; } = FriendshipStatus.Pending;

		public ApplicationUser User1 { get; set; }
		public ApplicationUser User2 { get; set; }
	}

    public enum FriendshipStatus
    {
        Pending,
        Accepted,
        Rejected
    }
}
