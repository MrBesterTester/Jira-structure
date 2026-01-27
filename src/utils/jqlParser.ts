/**
 * JQL Parser - Parses JQL-like query strings into an AST
 * 
 * Supports:
 * - Operators: =, !=, >, <, >=, <=, ~ (contains), IN, NOT IN
 * - Boolean: AND, OR, NOT (AND has higher precedence than OR)
 * - Parentheses for grouping
 * - Quoted strings and unquoted identifiers
 * - Field names: type, status, priority, assignee, sprint, labels, etc.
 */

// ============================================================================
// TOKEN TYPES
// ============================================================================

export enum TokenType {
  // Literals
  IDENTIFIER = 'IDENTIFIER',
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  
  // Comparison operators
  EQUALS = 'EQUALS',           // =
  NOT_EQUALS = 'NOT_EQUALS',   // !=
  GREATER = 'GREATER',         // >
  LESS = 'LESS',               // <
  GREATER_EQ = 'GREATER_EQ',   // >=
  LESS_EQ = 'LESS_EQ',         // <=
  CONTAINS = 'CONTAINS',       // ~
  
  // Boolean operators
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
  
  // Set operators
  IN = 'IN',
  NOT_IN = 'NOT_IN',
  
  // Punctuation
  LPAREN = 'LPAREN',           // (
  RPAREN = 'RPAREN',           // )
  COMMA = 'COMMA',             // ,
  
  // Special
  EOF = 'EOF',
}

export interface Token {
  type: TokenType;
  value: string;
  position: number;
  length: number;
}

// ============================================================================
// AST NODE TYPES
// ============================================================================

export type ASTNode = 
  | BinaryExpression
  | UnaryExpression
  | ComparisonExpression
  | InExpression
  | Identifier
  | Literal;

export interface BinaryExpression {
  type: 'BinaryExpression';
  operator: 'AND' | 'OR';
  left: ASTNode;
  right: ASTNode;
}

export interface UnaryExpression {
  type: 'UnaryExpression';
  operator: 'NOT';
  operand: ASTNode;
}

export interface ComparisonExpression {
  type: 'ComparisonExpression';
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | '~';
  field: string;
  value: Literal;
}

export interface InExpression {
  type: 'InExpression';
  field: string;
  values: Literal[];
  negated: boolean;
}

export interface Identifier {
  type: 'Identifier';
  name: string;
}

export interface Literal {
  type: 'Literal';
  value: string | number;
  valueType: 'string' | 'number';
}

// ============================================================================
// PARSE ERROR
// ============================================================================

export class JQLParseError extends Error {
  position: number;
  length: number;
  
  constructor(message: string, position: number, length: number = 1) {
    super(message);
    this.name = 'JQLParseError';
    this.position = position;
    this.length = length;
  }
}

// ============================================================================
// PARSE RESULT
// ============================================================================

export interface ParseResult {
  success: boolean;
  ast: ASTNode | null;
  error: JQLParseError | null;
  tokens: Token[];
}

// ============================================================================
// LEXER
// ============================================================================

const KEYWORDS: Record<string, TokenType> = {
  'AND': TokenType.AND,
  'OR': TokenType.OR,
  'NOT': TokenType.NOT,
  'IN': TokenType.IN,
};

class Lexer {
  private input: string;
  private position: number = 0;
  private tokens: Token[] = [];

  constructor(input: string) {
    this.input = input;
  }

  tokenize(): Token[] {
    while (this.position < this.input.length) {
      this.skipWhitespace();
      if (this.position >= this.input.length) break;

      const char = this.input[this.position];

      // Two-character operators
      if (this.match('!=')) {
        this.tokens.push(this.createToken(TokenType.NOT_EQUALS, '!='));
        continue;
      }
      if (this.match('>=')) {
        this.tokens.push(this.createToken(TokenType.GREATER_EQ, '>='));
        continue;
      }
      if (this.match('<=')) {
        this.tokens.push(this.createToken(TokenType.LESS_EQ, '<='));
        continue;
      }

      // Single-character operators
      if (char === '=') {
        this.tokens.push(this.createToken(TokenType.EQUALS, '='));
        this.position++;
        continue;
      }
      if (char === '>') {
        this.tokens.push(this.createToken(TokenType.GREATER, '>'));
        this.position++;
        continue;
      }
      if (char === '<') {
        this.tokens.push(this.createToken(TokenType.LESS, '<'));
        this.position++;
        continue;
      }
      if (char === '~') {
        this.tokens.push(this.createToken(TokenType.CONTAINS, '~'));
        this.position++;
        continue;
      }
      if (char === '(') {
        this.tokens.push(this.createToken(TokenType.LPAREN, '('));
        this.position++;
        continue;
      }
      if (char === ')') {
        this.tokens.push(this.createToken(TokenType.RPAREN, ')'));
        this.position++;
        continue;
      }
      if (char === ',') {
        this.tokens.push(this.createToken(TokenType.COMMA, ','));
        this.position++;
        continue;
      }

      // Quoted strings
      if (char === '"' || char === "'") {
        this.tokens.push(this.readString(char));
        continue;
      }

      // Numbers
      if (this.isDigit(char) || (char === '-' && this.isDigit(this.peek(1)))) {
        this.tokens.push(this.readNumber());
        continue;
      }

      // Identifiers and keywords
      if (this.isIdentifierStart(char)) {
        this.tokens.push(this.readIdentifier());
        continue;
      }

      throw new JQLParseError(`Unexpected character: ${char}`, this.position);
    }

    this.tokens.push({
      type: TokenType.EOF,
      value: '',
      position: this.position,
      length: 0,
    });

    return this.tokens;
  }

  private skipWhitespace(): void {
    while (this.position < this.input.length && /\s/.test(this.input[this.position])) {
      this.position++;
    }
  }

  private match(expected: string): boolean {
    if (this.input.substring(this.position, this.position + expected.length) === expected) {
      return true;
    }
    return false;
  }

  private peek(offset: number = 0): string {
    return this.input[this.position + offset] || '';
  }

  private createToken(type: TokenType, value: string): Token {
    const token = {
      type,
      value,
      position: this.position,
      length: value.length,
    };
    return token;
  }

  private isDigit(char: string): boolean {
    return /[0-9]/.test(char);
  }

  private isIdentifierStart(char: string): boolean {
    return /[a-zA-Z_]/.test(char);
  }

  private isIdentifierPart(char: string): boolean {
    return /[a-zA-Z0-9_]/.test(char);
  }

  private readString(quote: string): Token {
    const startPosition = this.position;
    this.position++; // Skip opening quote
    
    let value = '';
    while (this.position < this.input.length) {
      const char = this.input[this.position];
      if (char === quote) {
        this.position++; // Skip closing quote
        return {
          type: TokenType.STRING,
          value,
          position: startPosition,
          length: this.position - startPosition,
        };
      }
      if (char === '\\' && this.position + 1 < this.input.length) {
        // Handle escape sequences
        this.position++;
        const nextChar = this.input[this.position];
        if (nextChar === 'n') value += '\n';
        else if (nextChar === 't') value += '\t';
        else if (nextChar === '\\') value += '\\';
        else if (nextChar === quote) value += quote;
        else value += nextChar;
      } else {
        value += char;
      }
      this.position++;
    }
    
    throw new JQLParseError(`Unterminated string starting at position ${startPosition}`, startPosition);
  }

  private readNumber(): Token {
    const startPosition = this.position;
    let value = '';
    
    if (this.input[this.position] === '-') {
      value += '-';
      this.position++;
    }
    
    while (this.position < this.input.length && this.isDigit(this.input[this.position])) {
      value += this.input[this.position];
      this.position++;
    }
    
    // Handle decimal numbers
    if (this.input[this.position] === '.' && this.isDigit(this.peek(1))) {
      value += '.';
      this.position++;
      while (this.position < this.input.length && this.isDigit(this.input[this.position])) {
        value += this.input[this.position];
        this.position++;
      }
    }
    
    return {
      type: TokenType.NUMBER,
      value,
      position: startPosition,
      length: this.position - startPosition,
    };
  }

  private readIdentifier(): Token {
    const startPosition = this.position;
    let value = '';
    
    while (this.position < this.input.length && this.isIdentifierPart(this.input[this.position])) {
      value += this.input[this.position];
      this.position++;
    }
    
    const upperValue = value.toUpperCase();
    
    // Check for NOT IN (two keywords)
    if (upperValue === 'NOT') {
      this.skipWhitespace();
      const nextWordStart = this.position;
      let nextWord = '';
      while (this.position < this.input.length && this.isIdentifierPart(this.input[this.position])) {
        nextWord += this.input[this.position];
        this.position++;
      }
      if (nextWord.toUpperCase() === 'IN') {
        return {
          type: TokenType.NOT_IN,
          value: 'NOT IN',
          position: startPosition,
          length: this.position - startPosition,
        };
      } else {
        // Revert position if not "IN"
        this.position = nextWordStart;
      }
    }
    
    // Check for other keywords
    const keywordType = KEYWORDS[upperValue];
    if (keywordType) {
      return {
        type: keywordType,
        value: upperValue,
        position: startPosition,
        length: value.length,
      };
    }
    
    return {
      type: TokenType.IDENTIFIER,
      value,
      position: startPosition,
      length: value.length,
    };
  }
}

// ============================================================================
// PARSER
// ============================================================================

class Parser {
  private tokens: Token[] = [];
  private position: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): ASTNode {
    if (this.current().type === TokenType.EOF) {
      throw new JQLParseError('Empty query', 0);
    }
    
    const result = this.parseOrExpression();
    
    if (this.current().type !== TokenType.EOF) {
      throw new JQLParseError(
        `Unexpected token: ${this.current().value}`,
        this.current().position,
        this.current().length
      );
    }
    
    return result;
  }

  private current(): Token {
    return this.tokens[this.position] || { type: TokenType.EOF, value: '', position: 0, length: 0 };
  }

  private peek(offset: number = 1): Token {
    return this.tokens[this.position + offset] || { type: TokenType.EOF, value: '', position: 0, length: 0 };
  }

  private advance(): Token {
    const token = this.current();
    this.position++;
    return token;
  }

  private expect(type: TokenType, message?: string): Token {
    const token = this.current();
    if (token.type !== type) {
      throw new JQLParseError(
        message || `Expected ${type} but got ${token.type}`,
        token.position,
        token.length
      );
    }
    return this.advance();
  }

  // OR has lower precedence than AND
  private parseOrExpression(): ASTNode {
    let left = this.parseAndExpression();

    while (this.current().type === TokenType.OR) {
      this.advance(); // consume OR
      const right = this.parseAndExpression();
      left = {
        type: 'BinaryExpression',
        operator: 'OR',
        left,
        right,
      };
    }

    return left;
  }

  // AND has higher precedence than OR
  private parseAndExpression(): ASTNode {
    let left = this.parseUnaryExpression();

    while (this.current().type === TokenType.AND) {
      this.advance(); // consume AND
      const right = this.parseUnaryExpression();
      left = {
        type: 'BinaryExpression',
        operator: 'AND',
        left,
        right,
      };
    }

    return left;
  }

  private parseUnaryExpression(): ASTNode {
    if (this.current().type === TokenType.NOT) {
      this.advance(); // consume NOT
      const operand = this.parseUnaryExpression();
      return {
        type: 'UnaryExpression',
        operator: 'NOT',
        operand,
      };
    }

    return this.parsePrimaryExpression();
  }

  private parsePrimaryExpression(): ASTNode {
    // Handle parentheses
    if (this.current().type === TokenType.LPAREN) {
      this.advance(); // consume (
      const expr = this.parseOrExpression();
      this.expect(TokenType.RPAREN, 'Expected closing parenthesis');
      return expr;
    }

    // Must be a comparison or IN expression
    return this.parseComparison();
  }

  private parseComparison(): ASTNode {
    const fieldToken = this.current();
    
    if (fieldToken.type !== TokenType.IDENTIFIER) {
      throw new JQLParseError(
        `Expected field name but got ${fieldToken.type}`,
        fieldToken.position,
        fieldToken.length
      );
    }
    
    const field = this.advance().value;
    const operator = this.current();

    // Handle IN and NOT IN
    if (operator.type === TokenType.IN || operator.type === TokenType.NOT_IN) {
      const negated = operator.type === TokenType.NOT_IN;
      this.advance(); // consume IN/NOT IN
      this.expect(TokenType.LPAREN, 'Expected ( after IN');
      
      const values: Literal[] = [];
      
      // Parse first value
      values.push(this.parseValue());
      
      // Parse remaining values
      while (this.current().type === TokenType.COMMA) {
        this.advance(); // consume comma
        values.push(this.parseValue());
      }
      
      this.expect(TokenType.RPAREN, 'Expected ) after IN values');
      
      return {
        type: 'InExpression',
        field,
        values,
        negated,
      };
    }

    // Handle comparison operators
    let comparisonOp: ComparisonExpression['operator'];
    
    switch (operator.type) {
      case TokenType.EQUALS:
        comparisonOp = '=';
        break;
      case TokenType.NOT_EQUALS:
        comparisonOp = '!=';
        break;
      case TokenType.GREATER:
        comparisonOp = '>';
        break;
      case TokenType.LESS:
        comparisonOp = '<';
        break;
      case TokenType.GREATER_EQ:
        comparisonOp = '>=';
        break;
      case TokenType.LESS_EQ:
        comparisonOp = '<=';
        break;
      case TokenType.CONTAINS:
        comparisonOp = '~';
        break;
      default:
        throw new JQLParseError(
          `Expected comparison operator but got ${operator.value || operator.type}`,
          operator.position,
          operator.length
        );
    }

    this.advance(); // consume operator
    const value = this.parseValue();

    return {
      type: 'ComparisonExpression',
      operator: comparisonOp,
      field,
      value,
    };
  }

  private parseValue(): Literal {
    const token = this.current();
    
    if (token.type === TokenType.STRING) {
      this.advance();
      return {
        type: 'Literal',
        value: token.value,
        valueType: 'string',
      };
    }
    
    if (token.type === TokenType.NUMBER) {
      this.advance();
      return {
        type: 'Literal',
        value: parseFloat(token.value),
        valueType: 'number',
      };
    }
    
    if (token.type === TokenType.IDENTIFIER) {
      this.advance();
      return {
        type: 'Literal',
        value: token.value,
        valueType: 'string',
      };
    }
    
    throw new JQLParseError(
      `Expected value but got ${token.value || token.type}`,
      token.position,
      token.length
    );
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Parse a JQL query string into an AST
 */
export function parseJQL(query: string): ParseResult {
  const trimmedQuery = query.trim();
  
  if (!trimmedQuery) {
    return {
      success: true,
      ast: null,
      error: null,
      tokens: [],
    };
  }

  try {
    const lexer = new Lexer(trimmedQuery);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    
    return {
      success: true,
      ast,
      error: null,
      tokens,
    };
  } catch (error) {
    if (error instanceof JQLParseError) {
      return {
        success: false,
        ast: null,
        error,
        tokens: [],
      };
    }
    throw error;
  }
}

/**
 * Get all valid field names for JQL queries
 */
export function getJQLFieldNames(): string[] {
  return [
    'type',
    'status',
    'priority',
    'assignee',
    'reporter',
    'sprint',
    'labels',
    'storyPoints',
    'version',
    'component',
    'dueDate',
    'startDate',
    'createdAt',
    'updatedAt',
    'key',
    'title',
    'description',
    'parentId',
  ];
}

/**
 * Get all valid operators
 */
export function getJQLOperators(): string[] {
  return ['=', '!=', '>', '<', '>=', '<=', '~', 'IN', 'NOT IN'];
}

/**
 * Get all valid boolean operators
 */
export function getJQLBooleanOperators(): string[] {
  return ['AND', 'OR', 'NOT'];
}
