export class GameError extends Error {
  readonly status: 400 | 409 | 500;

  constructor(message: string, status: 400 | 409 | 500) {
    super(message);
    this.name = 'GameError';
    this.status = status;
  }
}
