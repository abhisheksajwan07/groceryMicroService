import rateLimit from "express-rate-limit";

// Global rate limiter
export const defaultLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: "Too many request from this IP,please try again later",
    standardHeaders: true,
    legacyHeaders: false,
});

// Limit add to cart operations to 20 per minute to prevent bot scraping/hoarding
export const addToCartLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20,
    message: "Too many add to cart requests, please slow down",
    standardHeaders: true,
    legacyHeaders: false,
});
