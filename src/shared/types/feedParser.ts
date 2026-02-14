export class ParserError extends Error {
  statusCode?: number
  constructor(message: string, statusCode?: number) {
    super(message)
    this.name = "ParserError"
    this.statusCode = statusCode
  }
}
