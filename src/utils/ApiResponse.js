class ApiResponse{
    constructor(statusCode, message="message", data, success){
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400
    }
}