export interface ValidationResult {
  isValid: boolean;
  message: string;
  level?: 'error' | 'warning' | 'info';
}

export interface PasswordStrengthResult {
  score: number; // 0-4
  level: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  suggestions: string[];
  requirements: {
    length: boolean;
    lowercase: boolean;
    uppercase: boolean;
    numbers: boolean;
    symbols: boolean;
  };
}

export class FormValidator {
  // Email validation
  static validateEmail(email: string): ValidationResult {
    if (!email) {
      return { isValid: false, message: 'Email is required', level: 'error' };
    }

    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!emailRegex.test(email)) {
      return { isValid: false, message: 'Please enter a valid email address', level: 'error' };
    }

    // Check for common typos
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    const domain = email.split('@')[1]?.toLowerCase();
    const similarDomain = this.findSimilarDomain(domain, commonDomains);

    if (similarDomain && similarDomain !== domain) {
      return {
        isValid: true,
        message: `Did you mean ${email.split('@')[0]}@${similarDomain}?`,
        level: 'warning'
      };
    }

    return { isValid: true, message: '', level: 'info' };
  }

  // Password validation with strength scoring
  static validatePassword(password: string): ValidationResult & { strength?: PasswordStrengthResult } {
    if (!password) {
      return { isValid: false, message: 'Password is required', level: 'error' };
    }

    const strength = this.calculatePasswordStrength(password);

    if (password.length < 8) {
      return {
        isValid: false,
        message: 'Password must be at least 8 characters long',
        level: 'error',
        strength
      };
    }

    if (strength.score < 2) {
      return {
        isValid: false,
        message: 'Password is too weak',
        level: 'error',
        strength
      };
    }

    return {
      isValid: true,
      message: `Password strength: ${strength.level}`,
      level: strength.score >= 3 ? 'info' : 'warning',
      strength
    };
  }

  // Password strength calculation
  static calculatePasswordStrength(password: string): PasswordStrengthResult {
    const requirements = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[^A-Za-z0-9]/.test(password)
    };

    let score = 0;
    const suggestions: string[] = [];

    // Length scoring
    if (password.length >= 8) score += 1;
    else suggestions.push('Use at least 8 characters');

    if (password.length >= 12) score += 1;
    else if (password.length >= 8) suggestions.push('Consider using 12+ characters for better security');

    // Character type scoring
    if (requirements.lowercase) score += 0.5;
    else suggestions.push('Include lowercase letters');

    if (requirements.uppercase) score += 0.5;
    else suggestions.push('Include uppercase letters');

    if (requirements.numbers) score += 0.5;
    else suggestions.push('Include numbers');

    if (requirements.symbols) score += 1;
    else suggestions.push('Include special characters (!@#$%^&*)');

    // Bonus points
    if (password.length >= 16) score += 0.5;
    if (!/(.)\1{2,}/.test(password)) score += 0.5; // No repeated characters
    if (!/^[a-zA-Z]+$/.test(password)) score += 0.5; // Not just letters

    // Penalties
    const commonPasswords = ['password', '123456', 'qwerty', 'abc123', 'password123'];
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      score -= 2;
      suggestions.push('Avoid common passwords');
    }

    // Normalize score to 0-4
    score = Math.max(0, Math.min(4, Math.round(score)));

    const levels: Array<PasswordStrengthResult['level']> = ['weak', 'fair', 'good', 'strong', 'very-strong'];

    return {
      score,
      level: levels[score],
      suggestions: suggestions.slice(0, 3), // Limit to top 3 suggestions
      requirements
    };
  }

  // Required field validation
  static validateRequired(value: string, fieldName: string): ValidationResult {
    if (!value || value.trim().length === 0) {
      return { isValid: false, message: `${fieldName} is required`, level: 'error' };
    }
    return { isValid: true, message: '', level: 'info' };
  }

  // Phone number validation
  static validatePhoneNumber(phone: string): ValidationResult {
    if (!phone) {
      return { isValid: false, message: 'Phone number is required', level: 'error' };
    }

    // Remove all non-digit characters for validation
    const cleanPhone = phone.replace(/\D/g, '');

    if (cleanPhone.length < 10) {
      return { isValid: false, message: 'Phone number must be at least 10 digits', level: 'error' };
    }

    if (cleanPhone.length > 15) {
      return { isValid: false, message: 'Phone number is too long', level: 'error' };
    }

    return { isValid: true, message: '', level: 'info' };
  }

  // URL validation
  static validateURL(url: string): ValidationResult {
    if (!url) {
      return { isValid: false, message: 'URL is required', level: 'error' };
    }

    try {
      new URL(url);
      return { isValid: true, message: '', level: 'info' };
    } catch {
      return { isValid: false, message: 'Please enter a valid URL', level: 'error' };
    }
  }

  // Helper method to find similar domain
  private static findSimilarDomain(domain: string, commonDomains: string[]): string | null {
    if (!domain) return null;

    for (const commonDomain of commonDomains) {
      if (this.levenshteinDistance(domain, commonDomain) <= 2 && domain !== commonDomain) {
        return commonDomain;
      }
    }
    return null;
  }

  // Levenshtein distance for typo detection
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    const n = str2.length;
    const m = str1.length;

    if (n === 0) return m;
    if (m === 0) return n;

    for (let i = 0; i <= n; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= m; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[n][m];
  }
}

// Custom validation rules
export const ValidationRules = {
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: false
  },
  email: {
    maxLength: 254,
    allowPlusAddressing: true
  }
};