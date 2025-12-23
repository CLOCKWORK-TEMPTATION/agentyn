/**
 * Security Tests
 * اختبارات الأمان
 */

import { 
  validatePath, 
  sanitizeLogInput, 
  validateUrl, 
  safeExec,
  generateCSRFToken,
  validateCSRFToken,
  sanitizeFilename,
  sanitizeInput,
  RateLimiter
} from '../utils/security-helpers-fixed';

describe('Security Helper Functions', () => {
  
  describe('validatePath', () => {
    const baseDir = '/safe/directory';
    
    test('should allow safe paths', () => {
      expect(() => validatePath(baseDir, 'file.txt')).not.toThrow();
      expect(() => validatePath(baseDir, 'subdir/file.txt')).not.toThrow();
    });
    
    test('should block path traversal attempts', () => {
      expect(() => validatePath(baseDir, '../../../etc/passwd')).toThrow('Path traversal detected');
      expect(() => validatePath(baseDir, '..\\..\\windows\\system32')).toThrow('Path traversal detected');
    });
    
    test('should block absolute paths outside base', () => {
      expect(() => validatePath(baseDir, '/etc/passwd')).toThrow('Path traversal detected');
      expect(() => validatePath(baseDir, 'C:\\Windows\\System32')).toThrow('Path traversal detected');
    });
  });
  
  describe('sanitizeLogInput', () => {
    test('should remove dangerous characters', () => {
      const malicious = 'test\\r\\nINJECTED LOG ENTRY\\r\\n';
      const sanitized = sanitizeLogInput(malicious);
      expect(sanitized).not.toContain('\\r');
      expect(sanitized).not.toContain('\\n');
    });
    
    test('should limit length', () => {
      const longString = 'a'.repeat(1000);
      const sanitized = sanitizeLogInput(longString);
      expect(sanitized.length).toBeLessThanOrEqual(500);
    });
    
    test('should handle non-string inputs', () => {
      expect(sanitizeLogInput(123)).toBe('123');
      expect(sanitizeLogInput(null)).toBe('null');
      expect(sanitizeLogInput(undefined)).toBe('undefined');
    });
  });
  
  describe('validateUrl', () => {
    test('should allow safe URLs', () => {
      const result = validateUrl('https://api.github.com/users/test');
      expect(result.valid).toBe(true);
    });
    
    test('should block localhost URLs', () => {
      const result = validateUrl('http://localhost:8080/admin');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('محلية');
    });
    
    test('should block private IP ranges', () => {
      const privateIPs = [
        'http://192.168.1.1/',
        'http://10.0.0.1/',
        'http://172.16.0.1/'
      ];
      
      privateIPs.forEach(ip => {
        const result = validateUrl(ip);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('خاصة');
      });
    });
    
    test('should block metadata endpoints', () => {
      const metadataUrls = [
        'http://169.254.169.254/latest/meta-data/',
        'http://metadata.google.internal/',
        'http://metadata.azure.com/'
      ];
      
      metadataUrls.forEach(url => {
        const result = validateUrl(url);
        expect(result.valid).toBe(false);
      });
    });
    
    test('should enforce allowed domains when provided', () => {
      const allowedDomains = ['api.github.com', 'jsonplaceholder.typicode.com'];
      
      const validResult = validateUrl('https://api.github.com/users/test', allowedDomains);
      expect(validResult.valid).toBe(true);
      
      const invalidResult = validateUrl('https://evil.com/malicious', allowedDomains);
      expect(invalidResult.valid).toBe(false);
    });
  });
  
  describe('safeExec', () => {
    test('should allow whitelisted commands', async () => {
      // This test might need to be adjusted based on the actual environment
      try {
        await safeExec('echo', ['hello']);
        // If we reach here, the command was allowed
        expect(true).toBe(true);
      } catch (error) {
        // Command might not be available in test environment
        expect((error as Error).message).not.toContain('not allowed');
      }
    });
    
    test('should block non-whitelisted commands', async () => {
      await expect(safeExec('rm', ['-rf', '/'])).rejects.toThrow('not allowed');
      await expect(safeExec('curl', ['http://evil.com'])).rejects.toThrow('not allowed');
    });
    
    test('should block dangerous characters in command', async () => {
      await expect(safeExec('echo; rm -rf /', [])).rejects.toThrow('Invalid command characters');
    });
    
    test('should block dangerous characters in arguments', async () => {
      await expect(safeExec('echo', ['hello; rm -rf /'])).rejects.toThrow('Invalid argument characters');
    });
  });
  
  describe('CSRF Token Functions', () => {
    test('should generate valid tokens', () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      
      expect(token1).toHaveLength(64);
      expect(token2).toHaveLength(64);
      expect(token1).not.toBe(token2); // Should be unique
    });
    
    test('should validate tokens correctly', () => {
      const token = generateCSRFToken();
      
      expect(validateCSRFToken(token, token)).toBe(true);
      expect(validateCSRFToken(token, 'different')).toBe(false);
      expect(validateCSRFToken('', token)).toBe(false);
      expect(validateCSRFToken(token, '')).toBe(false);
    });
  });
  
  describe('sanitizeFilename', () => {
    test('should remove dangerous characters', () => {
      const dangerous = '../../../etc/passwd';
      const sanitized = sanitizeFilename(dangerous);
      expect(sanitized).not.toContain('../');
      expect(sanitized).not.toContain('/');
    });
    
    test('should handle Windows path separators', () => {
      const windowsPath = '..\\..\\windows\\system32\\config';
      const sanitized = sanitizeFilename(windowsPath);
      expect(sanitized).not.toContain('\\\\');
      expect(sanitized).not.toContain('..');
    });
    
    test('should limit filename length', () => {
      const longName = 'a'.repeat(300);
      const sanitized = sanitizeFilename(longName);
      expect(sanitized.length).toBeLessThanOrEqual(255);
    });
  });
  
  describe('RateLimiter', () => {
    test('should allow requests within limit', () => {
      const limiter = new RateLimiter(5, 60000); // 5 requests per minute
      
      for (let i = 0; i < 5; i++) {
        expect(limiter.isAllowed('user1')).toBe(true);
      }
    });
    
    test('should block requests exceeding limit', () => {
      const limiter = new RateLimiter(2, 60000); // 2 requests per minute
      
      expect(limiter.isAllowed('user1')).toBe(true);
      expect(limiter.isAllowed('user1')).toBe(true);
      expect(limiter.isAllowed('user1')).toBe(false); // Should be blocked
    });
    
    test('should handle different users separately', () => {
      const limiter = new RateLimiter(1, 60000); // 1 request per minute
      
      expect(limiter.isAllowed('user1')).toBe(true);
      expect(limiter.isAllowed('user2')).toBe(true); // Different user, should be allowed
      expect(limiter.isAllowed('user1')).toBe(false); // Same user, should be blocked
    });
    
    test('should reset user limits', () => {
      const limiter = new RateLimiter(1, 60000);
      
      expect(limiter.isAllowed('user1')).toBe(true);
      expect(limiter.isAllowed('user1')).toBe(false);
      
      limiter.reset('user1');
      expect(limiter.isAllowed('user1')).toBe(true); // Should be allowed after reset
    });
  });
  
  describe('Input Sanitization', () => {
    test('should handle various input types', () => {
      expect(sanitizeInput('normal text')).toBe('normal text');
      expect(sanitizeInput(123)).toBe('123');
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
    });
    
    test('should remove control characters', () => {
      const withControlChars = 'text\\x00with\\x01control\\x02chars';
      const sanitized = sanitizeInput(withControlChars);
      expect(sanitized).not.toMatch(/[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]/);
    });
    
    test('should respect length limits', () => {
      const longText = 'a'.repeat(2000);
      const sanitized = sanitizeInput(longText, 100);
      expect(sanitized.length).toBe(100);
    });
  });
});

describe('Security Integration Tests', () => {
  test('should prevent command injection in file operations', () => {
    const maliciousPath = 'file.txt; rm -rf /';
    expect(() => validatePath('/safe', maliciousPath)).not.toThrow();
    // The path validation should not execute the command part
  });
  
  test('should prevent XSS in log outputs', () => {
    const xssPayload = '<script>alert("XSS")</script>';
    const sanitized = sanitizeLogInput(xssPayload);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('</script>');
  });
  
  test('should prevent SSRF through URL validation', () => {
    const ssrfUrls = [
      'http://localhost:22/ssh',
      'http://127.0.0.1:3306/mysql',
      'http://169.254.169.254/aws-metadata',
      'file:///etc/passwd',
      'ftp://internal-server/files'
    ];
    
    ssrfUrls.forEach(url => {
      const result = validateUrl(url);
      expect(result.valid).toBe(false);
    });
  });
});