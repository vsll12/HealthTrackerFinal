using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Auth_jwt.Migrations
{
    /// <inheritdoc />
    public partial class ForumPostSuccessfull : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FileUrl",
                table: "ForumPosts",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FileUrl",
                table: "ForumPosts");
        }
    }
}
