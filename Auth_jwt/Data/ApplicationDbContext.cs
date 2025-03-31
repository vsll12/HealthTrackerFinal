using Auth_jwt.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Auth_jwt.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {

        }

		protected override void OnModelCreating(ModelBuilder builder)
		{
			base.OnModelCreating(builder);

			builder.Entity<Message>()
				.HasOne(m => m.Sender)
				.WithMany()
				.HasForeignKey(m => m.SenderId)
				.OnDelete(DeleteBehavior.Restrict); 

			builder.Entity<Message>()
				.HasOne(m => m.Receiver)
				.WithMany()
				.HasForeignKey(m => m.ReceiverId)
				.OnDelete(DeleteBehavior.Restrict);  


			builder.Entity<Friendship>()
				.HasOne(f => f.User1)
				.WithMany()
				.HasForeignKey(f => f.UserId1)
				.OnDelete(DeleteBehavior.Restrict);

			builder.Entity<Friendship>()
				.HasOne(f => f.User2)
				.WithMany()
				.HasForeignKey(f => f.UserId2)
				.OnDelete(DeleteBehavior.Restrict);
		}

		public DbSet<ChartData> ChartData { get; set; }
		public DbSet<Friendship> Friendships { get; set; }
		public DbSet<Post> Posts { get; set; }
		public DbSet<StepRecord> StepRecords { get; set; }
        public DbSet<Message> Messages { get; set; }
    }
}
