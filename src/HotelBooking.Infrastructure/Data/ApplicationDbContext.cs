namespace HotelBooking.Infrastructure.Data;

using Microsoft.EntityFrameworkCore;
using HotelBooking.Domain.Entities;
using HotelBooking.Domain.Common;
using System.Linq.Expressions;

/// <summary>
/// Application database context
/// </summary>
public class ApplicationDbContext : DbContext
{
    /// <summary>
    /// Initializes a new instance of the ApplicationDbContext
    /// </summary>
    /// <param name="options">Database context options</param>
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    /// <summary>
    /// Hotels DbSet
    /// </summary>
    public DbSet<Hotel> Hotels { get; set; }

    /// <summary>
    /// Rooms DbSet
    /// </summary>
    public DbSet<Room> Rooms { get; set; }

    /// <summary>
    /// Users DbSet
    /// </summary>
    public DbSet<User> Users { get; set; }

    /// <summary>
    /// Bookings DbSet
    /// </summary>
    public DbSet<Booking> Bookings { get; set; }

    /// <summary>
    /// Payments DbSet
    /// </summary>
    public DbSet<Payment> Payments { get; set; }

    /// <summary>
    /// Configures the model using Fluent API
    /// </summary>
    /// <param name="modelBuilder">Model builder</param>
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply soft delete query filter to all entities
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
            {
                modelBuilder.Entity(entityType.ClrType)
                    .HasQueryFilter(GetSoftDeleteFilter(entityType.ClrType));
            }
        }

        ConfigureHotel(modelBuilder);
        ConfigureRoom(modelBuilder);
        ConfigureUser(modelBuilder);
        ConfigureBooking(modelBuilder);
        ConfigurePayment(modelBuilder);
    }

    /// <summary>
    /// Configures the Hotel entity
    /// </summary>
    private static void ConfigureHotel(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Hotel>(entity =>
        {
            entity.HasKey(h => h.Id);

            entity.Property(h => h.Name)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(h => h.Location)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(h => h.Description)
                .HasMaxLength(2000);

            entity.Property(h => h.Rating)
                .HasPrecision(3, 2);

            entity.Property(h => h.Amenities)
                .HasMaxLength(1000);

            // Index for performance
            entity.HasIndex(h => h.Location);
            entity.HasIndex(h => h.Rating);
        });
    }

    /// <summary>
    /// Configures the Room entity
    /// </summary>
    private static void ConfigureRoom(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Room>(entity =>
        {
            entity.HasKey(r => r.Id);

            entity.Property(r => r.RoomType)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(r => r.PricePerNight)
                .IsRequired()
                .HasPrecision(18, 2);

            entity.Property(r => r.Capacity)
                .IsRequired();

            // Relationship with Hotel
            entity.HasOne(r => r.Hotel)
                .WithMany(h => h.Rooms)
                .HasForeignKey(r => r.HotelId)
                .OnDelete(DeleteBehavior.Restrict);

            // Indexes for performance
            entity.HasIndex(r => r.HotelId);
            entity.HasIndex(r => r.IsAvailable);
            entity.HasIndex(r => r.RoomType);
        });
    }

    /// <summary>
    /// Configures the User entity
    /// </summary>
    private static void ConfigureUser(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);

            entity.Property(u => u.Email)
                .IsRequired()
                .HasMaxLength(256);

            entity.Property(u => u.PasswordHash)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(u => u.FullName)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(u => u.PhoneNumber)
                .HasMaxLength(20);

            entity.Property(u => u.Role)
                .IsRequired()
                .HasMaxLength(50);

            // Unique constraint on Email
            entity.HasIndex(u => u.Email)
                .IsUnique();

            entity.HasIndex(u => u.Role);
        });
    }

    /// <summary>
    /// Configures the Booking entity
    /// </summary>
    private static void ConfigureBooking(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Booking>(entity =>
        {
            entity.HasKey(b => b.Id);

            entity.Property(b => b.CheckIn)
                .IsRequired();

            entity.Property(b => b.CheckOut)
                .IsRequired();

            entity.Property(b => b.TotalPrice)
                .IsRequired()
                .HasPrecision(18, 2);

            entity.Property(b => b.Status)
                .IsRequired()
                .HasMaxLength(50);

            // Relationship with User
            entity.HasOne(b => b.User)
                .WithMany(u => u.Bookings)
                .HasForeignKey(b => b.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Relationship with Room
            entity.HasOne(b => b.Room)
                .WithMany(r => r.Bookings)
                .HasForeignKey(b => b.RoomId)
                .OnDelete(DeleteBehavior.Restrict);

            // Indexes for performance
            entity.HasIndex(b => b.UserId);
            entity.HasIndex(b => b.RoomId);
            entity.HasIndex(b => b.CheckIn);
            entity.HasIndex(b => b.CheckOut);
            entity.HasIndex(b => b.Status);
            entity.HasIndex(b => new { b.RoomId, b.CheckIn, b.CheckOut });
        });
    }

    /// <summary>
    /// Configures the Payment entity
    /// </summary>
    private static void ConfigurePayment(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(p => p.Id);

            entity.Property(p => p.Amount)
                .IsRequired()
                .HasPrecision(18, 2);

            entity.Property(p => p.PaymentMethod)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(p => p.Status)
                .IsRequired()
                .HasMaxLength(50);

            // Relationship with Booking (one-to-one)
            entity.HasOne(p => p.Booking)
                .WithOne(b => b.Payment)
                .HasForeignKey<Payment>(p => p.BookingId)
                .OnDelete(DeleteBehavior.Restrict);

            // Indexes for performance
            entity.HasIndex(p => p.BookingId)
                .IsUnique();
            entity.HasIndex(p => p.Status);
            entity.HasIndex(p => p.PaymentDate);
        });
    }

    /// <summary>
    /// Creates a soft delete filter expression
    /// </summary>
    private static LambdaExpression GetSoftDeleteFilter(Type entityType)
    {
        var parameter = Expression.Parameter(entityType, "e");
        var property = Expression.Property(parameter, nameof(BaseEntity.IsDeleted));
        var condition = Expression.Equal(property, Expression.Constant(false));
        return Expression.Lambda(condition, parameter);
    }

    /// <summary>
    /// Saves changes and automatically updates timestamps
    /// </summary>
    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var entries = ChangeTracker.Entries<BaseEntity>();

        foreach (var entry in entries)
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    break;

                case EntityState.Modified:
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    break;

                case EntityState.Deleted:
                    entry.State = EntityState.Modified;
                    entry.Entity.IsDeleted = true;
                    entry.Entity.DeletedAt = DateTime.UtcNow;
                    break;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
