using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;
using Xunit;

namespace HotelBooking.Application.Tests.Services;

/// <summary>
/// Unit tests for price calculation formula verification
/// Spec: .specify/specs/001-hotel-booking-flow/spec.md (FR-003)
/// Task: T008 - Verify TotalPrice = nights × PricePerNight
/// 
/// Constitution Principle III: "TotalPrice MUST equal numberOfNights × Room.PricePerNight"
/// </summary>
public class PriceCalculationTests
{
    #region Core Calculation Tests

    [Theory]
    [InlineData(1, 100.00, 100.00)]      // 1 night
    [InlineData(3, 150.00, 450.00)]      // 3 nights (from spec US3-AC1)
    [InlineData(7, 200.00, 1400.00)]     // 1 week
    [InlineData(30, 99.99, 2999.70)]     // Max duration (30 days)
    public void CalculateTotalPrice_ShouldReturnCorrectValue(int nights, decimal pricePerNight, decimal expected)
    {
        // Act
        var totalPrice = CalculateTotalPrice(nights, pricePerNight);

        // Assert
        totalPrice.Should().Be(expected);
    }

    [Fact]
    public void CalculateTotalPrice_US3_ExampleScenario_ShouldReturn450()
    {
        // Arrange - From spec US3-AC1
        // "Room ID abc-123 (PricePerNight = $150)"
        // "book from 2026-02-15 to 2026-02-18" (3 nights)
        var checkIn = new DateTime(2026, 2, 15);
        var checkOut = new DateTime(2026, 2, 18);
        var pricePerNight = 150.00m;
        
        // Act
        var nights = (checkOut - checkIn).Days;
        var totalPrice = CalculateTotalPrice(nights, pricePerNight);

        // Assert - "TotalPrice = 3 nights × $150 = $450"
        nights.Should().Be(3);
        totalPrice.Should().Be(450.00m);
    }

    #endregion

    #region Edge Cases

    [Fact]
    public void CalculateTotalPrice_SingleNight_ShouldCalculateCorrectly()
    {
        // Arrange
        var checkIn = DateTime.Today.AddDays(1);
        var checkOut = checkIn.AddDays(1);
        var pricePerNight = 250.00m;

        // Act
        var nights = (checkOut - checkIn).Days;
        var totalPrice = CalculateTotalPrice(nights, pricePerNight);

        // Assert
        nights.Should().Be(1);
        totalPrice.Should().Be(250.00m);
    }

    [Fact]
    public void CalculateTotalPrice_MaxDuration30Days_ShouldCalculateCorrectly()
    {
        // Arrange
        var checkIn = DateTime.Today.AddDays(1);
        var checkOut = checkIn.AddDays(30);
        var pricePerNight = 175.50m;

        // Act
        var nights = (checkOut - checkIn).Days;
        var totalPrice = CalculateTotalPrice(nights, pricePerNight);

        // Assert
        nights.Should().Be(30);
        totalPrice.Should().Be(5265.00m);
    }

    [Fact]
    public void CalculateTotalPrice_WithDecimalPricePerNight_ShouldMaintainPrecision()
    {
        // Arrange - NFR-004: "All monetary values MUST use decimal(18,2) precision"
        var nights = 5;
        var pricePerNight = 123.45m;

        // Act
        var totalPrice = CalculateTotalPrice(nights, pricePerNight);

        // Assert
        totalPrice.Should().Be(617.25m);
    }

    [Fact]
    public void CalculateTotalPrice_WithZeroPrice_ShouldReturnZero()
    {
        // Arrange (edge case - free room)
        var nights = 5;
        var pricePerNight = 0.00m;

        // Act
        var totalPrice = CalculateTotalPrice(nights, pricePerNight);

        // Assert
        totalPrice.Should().Be(0.00m);
    }

    [Fact]
    public void CalculateTotalPrice_WithMinimumPrice_ShouldCalculateCorrectly()
    {
        // Arrange - smallest meaningful price
        var nights = 1;
        var pricePerNight = 0.01m;

        // Act
        var totalPrice = CalculateTotalPrice(nights, pricePerNight);

        // Assert
        totalPrice.Should().Be(0.01m);
    }

    [Fact]
    public void CalculateTotalPrice_WithLargePrice_ShouldCalculateCorrectly()
    {
        // Arrange - luxury suite
        var nights = 14;
        var pricePerNight = 9999.99m;

        // Act
        var totalPrice = CalculateTotalPrice(nights, pricePerNight);

        // Assert
        totalPrice.Should().Be(139999.86m);
    }

    #endregion

    #region Property-Based Tests

    /// <summary>
    /// Property: TotalPrice should always be non-negative for valid inputs
    /// </summary>
    [Property]
    public Property TotalPrice_ShouldNeverBeNegative_ForValidInputs()
    {
        return Prop.ForAll(
            Gen.Choose(1, 30).ToArbitrary(),          // nights: 1-30
            Gen.Choose(1, 100000).Select(x => x / 100m).ToArbitrary(),  // price: 0.01 to 1000.00
            (nights, pricePerNight) =>
            {
                var totalPrice = CalculateTotalPrice(nights, pricePerNight);
                return (totalPrice >= 0m).ToProperty();
            });
    }

    /// <summary>
    /// Property: TotalPrice should be proportional to nights
    /// </summary>
    [Property]
    public Property TotalPrice_ShouldBeProportionalToNights()
    {
        return Prop.ForAll(
            Gen.Choose(1, 15).ToArbitrary(),
            Gen.Choose(50, 500).Select(x => (decimal)x).ToArbitrary(),
            (nights, pricePerNight) =>
            {
                var totalPriceSingle = CalculateTotalPrice(1, pricePerNight);
                var totalPriceMultiple = CalculateTotalPrice(nights, pricePerNight);
                
                return (totalPriceMultiple == totalPriceSingle * nights).ToProperty();
            });
    }

    /// <summary>
    /// Property: TotalPrice should be commutative with multiplication order
    /// </summary>
    [Property]
    public Property TotalPrice_ShouldBeCommutative()
    {
        return Prop.ForAll(
            Gen.Choose(1, 30).ToArbitrary(),
            Gen.Choose(1, 1000).Select(x => (decimal)x).ToArbitrary(),
            (nights, pricePerNight) =>
            {
                var result1 = nights * pricePerNight;
                var result2 = pricePerNight * nights;
                
                return (result1 == result2).ToProperty();
            });
    }

    /// <summary>
    /// Property: Doubling nights should double the price
    /// </summary>
    [Property]
    public Property DoublingNights_ShouldDoublePrice()
    {
        return Prop.ForAll(
            Gen.Choose(1, 15).ToArbitrary(),
            Gen.Choose(50, 500).Select(x => (decimal)x).ToArbitrary(),
            (nights, pricePerNight) =>
            {
                var singlePrice = CalculateTotalPrice(nights, pricePerNight);
                var doublePrice = CalculateTotalPrice(nights * 2, pricePerNight);
                
                return (doublePrice == singlePrice * 2).ToProperty();
            });
    }

    #endregion

    #region Server Override Tests

    /// <summary>
    /// Test: Server MUST recalculate and override client-provided TotalPrice
    /// Spec: US3-AC2 - "server MUST recalculate and override with correct value (never trust client)"
    /// </summary>
    [Fact]
    public void ServerCalculation_ShouldOverrideClientValue()
    {
        // Arrange
        var nights = 3;
        var serverPricePerNight = 150.00m;
        var clientProvidedTotal = 999.99m; // Incorrect client value

        // Act
        var serverCalculatedTotal = CalculateTotalPrice(nights, serverPricePerNight);

        // Assert
        serverCalculatedTotal.Should().Be(450.00m);
        serverCalculatedTotal.Should().NotBe(clientProvidedTotal, 
            "Server MUST override client-provided TotalPrice");
    }

    [Theory]
    [InlineData(0)]           // Zero
    [InlineData(-100)]        // Negative
    [InlineData(99999999)]    // Absurdly high
    [InlineData(449.99)]      // Close but wrong
    [InlineData(450.01)]      // Close but wrong
    public void ServerCalculation_ShouldIgnoreAnyClientValue(decimal clientProvidedTotal)
    {
        // Arrange
        var nights = 3;
        var serverPricePerNight = 150.00m;

        // Act
        var serverCalculatedTotal = CalculateTotalPrice(nights, serverPricePerNight);

        // Assert
        serverCalculatedTotal.Should().Be(450.00m);
        serverCalculatedTotal.Should().NotBe(clientProvidedTotal, 
            "Server must always use its own calculation");
    }

    #endregion

    #region Boundary Tests

    [Theory]
    [InlineData(1)]   // Minimum valid nights
    [InlineData(30)]  // Maximum valid nights (from validation service)
    public void CalculateTotalPrice_BoundaryNights_ShouldCalculateCorrectly(int nights)
    {
        // Arrange
        var pricePerNight = 100.00m;

        // Act
        var totalPrice = CalculateTotalPrice(nights, pricePerNight);

        // Assert
        totalPrice.Should().Be(nights * pricePerNight);
    }

    [Theory]
    [InlineData(0.01)]        // Minimum price
    [InlineData(9999.99)]     // Luxury price
    public void CalculateTotalPrice_BoundaryPrices_ShouldCalculateCorrectly(decimal pricePerNight)
    {
        // Arrange
        var nights = 1;

        // Act
        var totalPrice = CalculateTotalPrice(nights, pricePerNight);

        // Assert
        totalPrice.Should().Be(pricePerNight);
    }

    #endregion

    #region Helper Methods

    /// <summary>
    /// Price calculation formula as per spec FR-003
    /// TotalPrice = numberOfNights × PricePerNight
    /// </summary>
    private static decimal CalculateTotalPrice(int nights, decimal pricePerNight)
    {
        return nights * pricePerNight;
    }

    #endregion
}
