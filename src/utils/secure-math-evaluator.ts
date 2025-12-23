/**
 * Secure Mathematical Expression Evaluator
 * Prevents CWE-94: Unsanitized input is run as code
 */

export class SecureMathEvaluator {
  // Whitelist of allowed mathematical functions
  private static readonly ALLOWED_FUNCTIONS = {
    // Basic math functions
    abs: Math.abs,
    sqrt: Math.sqrt,
    cbrt: Math.cbrt,
    pow: Math.pow,
    exp: Math.exp,
    log: Math.log,
    log10: Math.log10,
    log2: Math.log2,
    
    // Trigonometric functions
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    asin: Math.asin,
    acos: Math.acos,
    atan: Math.atan,
    sinh: Math.sinh,
    cosh: Math.cosh,
    tanh: Math.tanh,
    
    // Other functions
    ceil: Math.ceil,
    floor: Math.floor,
    round: Math.round,
    min: Math.min,
    max: Math.max,
    
    // Constants
    PI: Math.PI,
    E: Math.E,
    LN2: Math.LN2,
    LN10: Math.LN10,
    LOG2E: Math.LOG2E,
    LOG10E: Math.LOG10E,
    SQRT1_2: Math.SQRT1_2,
    SQRT2: Math.SQRT2
  };

  /**
   * Safely evaluate a mathematical expression
   * @param expression The mathematical expression to evaluate
   * @returns The result of the evaluation
   */
  static evaluate(expression: string): number {
    // Step 1: Basic validation
    if (!expression || typeof expression !== 'string') {
      throw new Error('Expression must be a non-empty string');
    }

    // Step 2: Remove whitespace
    const trimmed = expression.trim();
    
    // Step 3: Check for dangerous patterns
    const dangerousPatterns = [
      /[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/, // Function calls (except allowed ones)
      /=>/, // Arrow functions
      /{/, // Object literals
      /\[/, // Array access (could be dangerous)
      /;/, // Statement separators
      /eval\s*\(/,
      /Function\s*\(/,
      /new\s+\w+/,
      /import\s+/,
      /require\s*\(/,
      /process\./,
      /global\./,
      /window\./,
      /document\./,
      /console\./,
      /__/, // Dunder methods/properties
      /prototype\./
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(trimmed)) {
        throw new Error('Expression contains potentially dangerous content');
      }
    }

    // Step 4: Replace allowed function names with their Math equivalents
    let processedExpression = trimmed;
    
    // Replace function calls with Math.function calls
    for (const [funcName] of Object.entries(this.ALLOWED_FUNCTIONS)) {
      if (typeof this.ALLOWED_FUNCTIONS[funcName as keyof typeof this.ALLOWED_FUNCTIONS] === 'function') {
        const regex = new RegExp(`\\b${funcName}\\s*\\(`, 'g');
        processedExpression = processedExpression.replace(regex, `Math.${funcName}(`);
      } else {
        // Replace constants
        const regex = new RegExp(`\\b${funcName}\\b`, 'g');
        processedExpression = processedExpression.replace(regex, `Math.${funcName}`);
      }
    }

    // Step 5: Final validation - only allow specific characters
    const allowedChars = /^[0-9+\-*/().\s,Math]+$/;
    if (!allowedChars.test(processedExpression)) {
      throw new Error('Expression contains invalid characters');
    }

    // Step 6: Evaluate in a restricted context
    try {
      // Create a sandboxed evaluation
      const func = new Function('Math', `return ${processedExpression}`);
      return func(Math);
    } catch (error) {
      throw new Error(`Failed to evaluate expression: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate if an expression contains only allowed mathematical content
   * @param expression The expression to validate
   * @returns True if safe, false otherwise
   */
  static isValidExpression(expression: string): boolean {
    try {
      this.evaluate(expression);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sanitize an expression by removing potentially dangerous content
   * @param expression The expression to sanitize
   * @returns The sanitized expression
   */
  static sanitize(expression: string): string {
    // Remove any non-mathematical characters
    return expression.replace(/[^0-9+\-*/().\s,a-zA-Z_]/g, '');
  }
}
