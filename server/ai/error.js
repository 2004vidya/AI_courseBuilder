class AIError extends Error {
    constructor(code,message,provider) {
        super(message);
        this.name = "AIError";
        this.code = code;
        this.provider = provider;
    }
}

module.exports = { AIError };
