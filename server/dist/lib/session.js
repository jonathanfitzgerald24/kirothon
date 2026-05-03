"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionMiddleware = void 0;
const express_session_1 = __importDefault(require("express-session"));
const connect_pg_simple_1 = __importDefault(require("connect-pg-simple"));
const pg_1 = require("pg");
const PgSession = (0, connect_pg_simple_1.default)(express_session_1.default);
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
exports.sessionMiddleware = (0, express_session_1.default)({
    store: new PgSession({
        pool,
        tableName: 'user_sessions',
        createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
    },
});
//# sourceMappingURL=session.js.map