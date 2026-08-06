using System;
using Microsoft.EntityFrameworkCore.Migrations;
using NetTopologySuite.Geometries;

#nullable disable

namespace Aura.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEmergencyUnitVehicleTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EmergencyUnits",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CallSign = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PlateNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CurrentLocation = table.Column<Point>(type: "geometry(Point, 4326)", nullable: false),
                    SpeedKmh = table.Column<double>(type: "double precision", nullable: false),
                    HeadingDegrees = table.Column<double>(type: "double precision", nullable: false),
                    AssignedEventId = table.Column<Guid>(type: "uuid", nullable: true),
                    LastGpsUpdateAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmergencyUnits", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EmergencyUnits_CurrentLocation",
                table: "EmergencyUnits",
                column: "CurrentLocation")
                .Annotation("Npgsql:IndexMethod", "gist");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EmergencyUnits");
        }
    }
}
