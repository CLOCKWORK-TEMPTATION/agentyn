/**
 * Secure Mathematical Expression Parser
 * Prevents CWE-94: Unsanitized input is run as code
 * Implements a recursive descent parser without using Function() or eval()
 */

export class SecureMathParser {
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
    max: Math.max
  };

  private static readonly CONSTANTS = {
    PI: Math.PI,
    E: Math.E,
    LN2: Math.LN2,
    LN10: Math.LN10,
    LOG2E: Math.LOG2E,
    LOG10E: Math.LOG10E,
    SQRT1_2: Math.SQRT1_2,
    SQRT2: Math.SQRT2
  };

  private input: string;
  private position: number = 0;

  /**
   * Parse and evaluate a mathematical expression
   */
  static evaluate(expression: string): number {
    const parser = new SecureMathParser(expression);
    return parser.parse();
  }

  constructor(input: string) {
    this.input = input.trim();
  }

  private parse(): number {
    const result = this.parseExpression();
    this.skipWhitespace();
    
    if (this.position < this.input.length) {
      throw new Error('Unexpected characters at end of expression');
    }
    
    return result;
  }

  // Grammar:
  // expression ::= term (( '+' | '-' ) term)*
  private parseExpression(): number {
    let result = this.parseTerm();
    
    while (true) {
      this.skipWhitespace();
      
      if (this.peek() === '+') {
        this.advance();
        result += this.parseTerm();
      } else if (this.peek() === '-') {
        this.advance();
        result -= this.parseTerm();
      } else {
        break;
      }
    }
    
    return result;
  }

  // term ::= factor (( '*' | '/' ) factor)*
  private parseTerm(): number {
    let result = this.parseFactor();
    
    while (true) {
      this.skipWhitespace();
      
      if (this.peek() === '*') {
        this.advance();
        result *= this.parseFactor();
      } else if (this.peek() === '/') {
        this.advance();
        const divisor = this.parseFactor();
        if (divisor === 0) {
          throw new Error('Division by zero');
        }
        result /= divisor;
      } else {
        break;
      }
    }
    
    return result;
  }

  // factor ::= number | '(' expression ')' | function '(' expression ')' | constant
  private parseFactor(): number {
    this.skipWhitespace();
    
    const char = this.peek();
    
    // Parenthesized expression
    if (char === '(') {
      this.advance();
      const result = this.parseExpression();
      this.skipWhitespace();
      
      if (this.peek() !== ')') {
        throw new Error('Expected closing parenthesis');
      }
      this.advance();
      return result;
    }
    
    // Unary operators
    if (char === '+') {
      this.advance();
      return this.parseFactor();
    }
    
    if (char === '-') {
      this.advance();
      return -this.parseFactor();
    }
    
    // Function calls
    if (this.isAlpha(char)) {
      const name = this.parseIdentifier();
      
      // Check if it's a constant
      if (name in SecureMathParser.CONSTANTS) {
        return SecureMathParser.CONSTANTS[name as keyof typeof SecureMathParser.CONSTANTS];
      }
      
      // Check if it's a function
      if (name in SecureMathParser.ALLOWED_FUNCTIONS) {
        this.skipWhitespace();
        
        if (this.peek() !== '(') {
          throw new Error(`Expected '(' after function ${name}`);
        }
        
        this.advance();
        
        // Parse function arguments
        const args: number[] = [];
        this.skipWhitespace();
        
        if (this.peek() !== ')') {
          args.push(this.parseExpression());
          
          while (true) {
            this.skipWhitespace();
            
            if (this.peek() === ',') {
              this.advance();
              args.push(this.parseExpression());
            } else {
              break;
            }
          }
        }
        
        this.skipWhitespace();
        
        if (this.peek() !== ')') {
          throw new Error('Expected closing parenthesis');
        }
        
        this.advance();
        
        // Call the function
        const func = SecureMathParser.ALLOWED_FUNCTIONS[name as keyof typeof SecureMathParser.ALLOWED_FUNCTIONS];
        return func.apply(null, args);
      }
      
      throw new Error(`Unknown identifier: ${name}`);
    }
    
    // Number literal
    return this.parseNumber();
  }

  private parseNumber(): number {
    this.skipWhitespace();
    let start = this.position;
    
    // Parse integer part
    while (this.position < this.input.length && this.isDigit(this.peek())) {
      this.advance();
    }
    
    // Parse fractional part
    if (this.peek() === '.') {
      this.advance();
      
      while (this.position < this.input.length && this.isDigit(this.peek())) {
        this.advance();
      }
    }
    
    // Parse exponent part
    if (this.peek() === 'e' || this.peek() === 'E') {
      this.advance();
      
      if (this.peek() === '+' || this.peek() === '-') {
        this.advance();
      }
      
      while (this.position < this.input.length && this.isDigit(this.peek())) {
        this.advance();
      }
    }
    
    const numberStr = this.input.substring(start, this.position);
    
    if (numberStr === '') {
      throw new Error('Expected number');
    }
    
    const result = parseFloat(numberStr);
    
    if (isNaN(result)) {
      throw new Error(`Invalid number: ${numberStr}`);
    }
    
    return result;
  }

  private parseIdentifier(): string {
    let start = this.position;
    
    while (this.position < this.input.length && this.isAlphaNumeric(this.peek())) {
      this.advance();
    }
    
    return this.input.substring(start, this.position);
  }

  private skipWhitespace(): void {
    while (this.position < this.input.length && this.isWhitespace(this.peek())) {
      this.advance();
    }
  }

  private peek(): string {
    return this.position < this.input.length ? this.input[this.position] : '';
  }

  private advance(): void {
    this.position++;
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isAlpha(char: string): boolean {
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }

  private isWhitespace(char: string): boolean {
    return char === ' ' || char === '\t' || char === '\n' || char === '\r';
  }

  /**
   * Validate if an expression contains only allowed mathematical content
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
   */
  static sanitize(expression: string): string {
    // Remove any non-mathematical characters
    return expression.replace(/[^0-9+\-*/().\s,a-zA-Z_]/g, '');
  }
}
