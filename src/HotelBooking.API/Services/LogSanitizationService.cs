using System.Text.RegularExpressions;

namespace HotelBooking.API.Services;

/// <summary>
/// Service for sanitizing sensitive data in logs
/// Prevents passwords, tokens, and PII from being logged
/// </summary>
public class LogSanitizationService
{
    private static readonly Regex PasswordPattern = new(@"(password|pwd|passwd)[\s]*[:=][\s]*[""']?([^""'\s,}]+)", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex TokenPattern = new(@"(token|bearer|authorization)[\s]*[:=][\s]*[""']?([A-Za-z0-9\-._~+/]+=*)", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex EmailPattern = new(@"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", RegexOptions.Compiled);
    private static readonly Regex PhonePattern = new(@"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b", RegexOptions.Compiled);
    private static readonly Regex CreditCardPattern = new(@"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b", RegexOptions.Compiled);
    private static readonly Regex SsnPattern = new(@"\b\d{3}-\d{2}-\d{4}\b", RegexOptions.Compiled);

    /// <summary>
    /// Sanitize log message by removing sensitive data
    /// </summary>
    public string SanitizeLogMessage(string message)
    {
        if (string.IsNullOrEmpty(message))
            return message;

        var sanitized = message;

        // Remove passwords
        sanitized = PasswordPattern.Replace(sanitized, "$1: [REDACTED]");

        // Remove tokens
        sanitized = TokenPattern.Replace(sanitized, "$1: [REDACTED]");

        // Mask email addresses (keep domain for debugging)
        sanitized = EmailPattern.Replace(sanitized, m => MaskEmail(m.Value));

        // Mask phone numbers
        sanitized = PhonePattern.Replace(sanitized, "[PHONE-REDACTED]");

        // Remove credit card numbers
        sanitized = CreditCardPattern.Replace(sanitized, "[CARD-REDACTED]");

        // Remove SSN
        sanitized = SsnPattern.Replace(sanitized, "[SSN-REDACTED]");

        return sanitized;
    }

    /// <summary>
    /// Sanitize object for logging (removes sensitive properties)
    /// </summary>
    public object SanitizeObject(object obj)
    {
        if (obj == null)
            return null!;

        var type = obj.GetType();
        var properties = type.GetProperties();

        var sanitized = new Dictionary<string, object?>();

        foreach (var prop in properties)
        {
            var propName = prop.Name.ToLower();
            var value = prop.GetValue(obj);

            // Skip sensitive properties
            if (IsSensitiveProperty(propName))
            {
                sanitized[prop.Name] = "[REDACTED]";
                continue;
            }

            // Sanitize string values
            if (value is string strValue)
            {
                sanitized[prop.Name] = SanitizeLogMessage(strValue);
            }
            else
            {
                sanitized[prop.Name] = value;
            }
        }

        return sanitized;
    }

    /// <summary>
    /// Check if property name indicates sensitive data
    /// </summary>
    private bool IsSensitiveProperty(string propertyName)
    {
        var sensitiveKeywords = new[]
        {
            "password", "pwd", "passwd", "secret", "token", "key",
            "authorization", "auth", "credential", "ssn", "socialsecurity",
            "creditcard", "cardnumber", "cvv", "pin", "privatekey"
        };

        return sensitiveKeywords.Any(keyword => propertyName.Contains(keyword));
    }

    /// <summary>
    /// Mask email address (show first char and domain)
    /// Example: john.doe@example.com -> j***@example.com
    /// </summary>
    private string MaskEmail(string email)
    {
        var parts = email.Split('@');
        if (parts.Length != 2)
            return "[EMAIL-REDACTED]";

        var localPart = parts[0];
        var domain = parts[1];

        if (localPart.Length <= 1)
            return $"*@{domain}";

        return $"{localPart[0]}***@{domain}";
    }

    /// <summary>
    /// Sanitize exception message for logging
    /// </summary>
    public string SanitizeException(Exception ex)
    {
        var message = ex.Message;
        var sanitized = SanitizeLogMessage(message);

        // Don't include stack trace in production logs (handled by environment check)
        return sanitized;
    }

    /// <summary>
    /// Create safe log context for structured logging
    /// </summary>
    public Dictionary<string, object> CreateSafeLogContext(params (string key, object value)[] properties)
    {
        var context = new Dictionary<string, object>();

        foreach (var (key, value) in properties)
        {
            if (IsSensitiveProperty(key.ToLower()))
            {
                context[key] = "[REDACTED]";
            }
            else if (value is string strValue)
            {
                context[key] = SanitizeLogMessage(strValue);
            }
            else
            {
                context[key] = value;
            }
        }

        return context;
    }
}
