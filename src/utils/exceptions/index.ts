export class APIException extends Error {
    public status: number;
    public errors: { [key: string]: any };
  
    constructor(status: number, errors: { [key: string]: any }) {
      super("API Exception");
      this.status = status;
      this.errors = errors;
    }
  }
  