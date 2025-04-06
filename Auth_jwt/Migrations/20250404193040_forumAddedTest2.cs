using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Auth_jwt.Migrations
{
    /// <inheritdoc />
    public partial class forumAddedTest2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "TimeStamp",
                table: "ForumPosts",
                newName: "Timestamp");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Timestamp",
                table: "ForumPosts",
                newName: "TimeStamp");
        }
    }
}
