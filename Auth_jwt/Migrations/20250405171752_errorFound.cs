using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Auth_jwt.Migrations
{
    /// <inheritdoc />
    public partial class errorFound : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ApplicationUserId",
                table: "ForumPosts",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ForumPosts_ApplicationUserId",
                table: "ForumPosts",
                column: "ApplicationUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_ForumPosts_AspNetUsers_ApplicationUserId",
                table: "ForumPosts",
                column: "ApplicationUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ForumPosts_AspNetUsers_ApplicationUserId",
                table: "ForumPosts");

            migrationBuilder.DropIndex(
                name: "IX_ForumPosts_ApplicationUserId",
                table: "ForumPosts");

            migrationBuilder.DropColumn(
                name: "ApplicationUserId",
                table: "ForumPosts");
        }
    }
}
