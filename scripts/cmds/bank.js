const { MongoClient, ObjectId } = require("mongodb");
const { createCanvas, registerFont, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');
const axios = require("axios");
const crypto = require('crypto');

// --- Configuration ---

// Gemini AI Configuration
const GEMINI_API_KEY = "AIzaSyBxRPqUWmQGgleh95j9fM4dRHhWL_dWoLI"; // IMPORTANT: Replace with your actual API key
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

// Database Configuration
const mongoUri = "mongodb+srv://Easirmahi:01200120mahi@anchestor.wmvrhcb.mongodb.net"; // Replace with your MongoDB connection string
const DB_NAME = "MilowBankDB"; // Updated DB Name
const BANK_COLLECTION = "bankData";
const MARKET_COLLECTION = "marketListings";
const AUDIT_COLLECTION = "auditLogs";

// --- AI Personality & Prompts ---

const MILOW_AI_PROMPT = `You are Milow, the friendly and helpful AI assistant for Milow Bank. You are knowledgeable ONLY about Milow Bank's features and live market data. You're designed to be approachable and modern.

Core Knowledge Base (Your entire world):
- Bank Name: Milow Bank
- Account functions: Balance, deposit, withdraw, transfer, interest, statements, net worth, credit score, detailed reports.
- ATM Interface: A visual, PIN-protected menu for transactions. Requires a debit card. Users can change their PIN.
- Stock Market & IPOs: You have live data on fictional shares. You can analyze trends, offer suggestions, and provide info on Initial Public Offerings (IPOs).
- Businesses & Marketplace: Users can buy businesses for passive income and trade properties on a player-to-player marketplace.
- Insurance, Government Bonds, Cheques, Investments, Loans, Daily Rewards, Tiers with Perks, Market Events (including corporate buyouts).

CRITICAL RULES:
1. You ONLY answer questions directly related to the Core Knowledge Base and the provided market data.
2. You provide financial analysis and suggestions based on the data in a clear, easy-to-understand way.
3. If a user asks about anything outside of this world (e.g., real-world events, your identity as a language model), you MUST politely decline. Your required response for refusal is: "I'm sorry, my expertise is strictly focused on Milow Bank services. How can I help you with your finances today? 😊"
4. You MUST NOT identify as an AI or a large language model. You are Milow, the bank's AI assistant.
5. Your tone is always friendly, professional, and encouraging. You can use simple emojis to enhance your tone.
6. Do not use markdown formatting (like asterisks for bolding).`;


// --- Gemini API Function ---

async function callGeminiAPI(prompt) {
    try {
        const response = await axios.post(GEMINI_API_URL, {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Error checking for response structure
        if (response.data && response.data.candidates && response.data.candidates[0].content && response.data.candidates[0].content.parts) {
            return response.data.candidates[0].content.parts[0].text;
        } else {
            // Fallback for unexpected response structure
            const safetyFeedback = response.data?.candidates[0]?.finishReason;
            if (safetyFeedback === 'SAFETY') {
                 return "I'm sorry, I cannot respond to that query as it may violate our safety policies. How about we discuss your finances?";
            }
            throw new Error("Invalid API response structure.");
        }
    } catch (error) {
        console.error('Gemini API Error:', error.response?.data || error.message);
        throw new Error("AI service is currently unavailable.");
    }
}


// --- Game & Market Data ---

// Initialize or load assets
try {
    const fontPath = path.join(__dirname, '..', 'assets', 'Arial.ttf');
    if (fs.existsSync(fontPath)) registerFont(fontPath, { family: 'Arial' });
} catch (e) {
    console.log("Custom font not found or failed to load. Using system default 'Arial'.");
}

const STOCK_TRANSACTION_FEE_PERCENT = 0.0015;
const BASE_INTEREST_RATE_ANNUAL = 0.02; // 2% base annual interest

let stockMarket = {
    "AAPL": { name: "Apple Inc.", price: 170.00, openPrice: 170.00, history: Array(50).fill(170.00), trend: 0.001, volatility: 0.03 },
    "MSFT": { name: "Microsoft Corp.", price: 300.00, openPrice: 300.00, history: Array(50).fill(300.00), trend: 0.0008, volatility: 0.025 },
    "GOOGL": { name: "Alphabet Inc.", price: 2800.00, openPrice: 2800.00, history: Array(50).fill(2800.00), trend: 0.0012, volatility: 0.035 },
    "TSLA": { name: "Tesla Inc.", price: 750.00, openPrice: 750.00, history: Array(50).fill(750.00), trend: 0.002, volatility: 0.08 },
    "BOTC": { name: "BotCoin", price: 12.00, openPrice: 12.00, history: Array(50).fill(12.00), trend: 0.005, volatility: 0.15 },
    "OILX": { name: "Global Oil Exchange", price: 75.00, openPrice: 75.00, history: Array(50).fill(75.00), trend: 0.0009, volatility: 0.05 },
};

const propertyAssets = [
    { id: "SUB_APT", name: "Suburban Apartment", price: 75000, dailyRent: 25 },
    { id: "CITY_CONDO", name: "City Center Condo", price: 250000, dailyRent: 80 },
    { id: "BEACH_HOUSE", name: "Beachfront House", price: 800000, dailyRent: 200 }
];

const availableBusinesses = [
    { id: "CAFE", name: "Milow's Cafe", cost: 150000, baseIncome: 200 }, // Renamed
    { id: "ARCADE", name: "Retro Arcade", cost: 500000, baseIncome: 750 },
    { id: "TECH_STARTUP", name: "AI Tech Startup", cost: 2500000, baseIncome: 4000 }
];

const investmentOptions = [
    { id: "BOND_LOW", name: "Govt. Savings Bond", type: "bond", interestRate: 0.025, riskLevel: "Low", durationDays: 30, minAmount: 500 },
    { id: "TECH_FUND", name: "Tech Growth Fund", type: "fund", avgReturn: 0.08, riskLevel: "High", durationDays: 90, minAmount: 5000 }
];

let marketEvent = null;
let currentIpo = null;

// --- Market Simulation Functions ---

function triggerEvent() {
    if (marketEvent && Date.now() > marketEvent.endTime) marketEvent = null;
    if (currentIpo && Date.now() > currentIpo.endTime) {
        stockMarket[currentIpo.symbol] = {
            name: currentIpo.name,
            price: currentIpo.price,
            openPrice: currentIpo.price,
            history: Array(50).fill(currentIpo.price),
            trend: (Math.random() - 0.4) * 0.001,
            volatility: 0.05
        };
        currentIpo = null;
    }

    if (!marketEvent && !currentIpo && Math.random() < 0.05) {
        const eventTypes = ['market', 'ipo', 'buyout'];
        const chosenEventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        
        if (chosenEventType === 'market') {
            const events = [
                { name: "Bull Market", effect: 0.001, duration: 3600000 * 2, type: 'market' },
                { name: "Recession Scare", effect: -0.002, duration: 3600000 * 3, type: 'market' }
            ];
            marketEvent = events[Math.floor(Math.random() * events.length)];
            marketEvent.endTime = Date.now() + marketEvent.duration;
        } else if (chosenEventType === 'ipo') {
            const newSymbol = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 
                                String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 
                                String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 'X';
            if (!stockMarket[newSymbol]) {
                currentIpo = {
                    symbol: newSymbol,
                    name: "New Tech Ventures",
                    price: parseFloat((Math.random() * 100 + 20).toFixed(2)),
                    duration: 3600000 * 4,
                    type: 'ipo'
                };
                currentIpo.endTime = Date.now() + currentIpo.duration;
            }
        } else if (chosenEventType === 'buyout') {
            const businessToBuyout = availableBusinesses[Math.floor(Math.random() * availableBusinesses.length)];
            marketEvent = {
                name: `Corporate Buyout of ${businessToBuyout.name}`,
                type: 'buyout',
                businessId: businessToBuyout.id,
                premium: 1.5,
                duration: 3600000 * 1
            };
            marketEvent.endTime = Date.now() + marketEvent.duration;
        }
    }
}

setInterval(triggerEvent, 3600000); // Trigger event check every hour

function updateStockPrices() {
    for (const symbol in stockMarket) {
        const stock = stockMarket[symbol];
        let marketEffect = (marketEvent && marketEvent.type === 'market') ? 
            (marketEvent.sector ? (marketEvent.sector.includes(symbol) ? marketEvent.effect : 0) : marketEvent.effect) : 0;
        let noise = (Math.random() - 0.5) * 2;
        let changePercent = (stock.trend || 0) + marketEffect + (noise * stock.volatility);
        let newPrice = stock.price * (1 + changePercent);
        stock.price = parseFloat(Math.max(0.01, newPrice).toFixed(2));
        stock.dailyChange = ((stock.price - stock.openPrice) / stock.openPrice) * 100;
        stock.history.push(stock.price);
        if (stock.history.length > 50) stock.history.shift();
    }
}

setInterval(updateStockPrices, 15000); // Update prices every 15 seconds

// --- Utility Functions ---

function formatKMB(number, usePrefix = true, decimals = 2) {
    if (isNaN(parseFloat(number))) return usePrefix ? "$0.00" : "0.00";
    number = parseFloat(number);
    const sign = number < 0 ? "-" : "";
    number = Math.abs(number);
    let suffix = "";
    if (number >= 1e12) {
        number /= 1e12;
        suffix = "T";
    } else if (number >= 1e9) {
        number /= 1e9;
        suffix = "B";
    } else if (number >= 1e6) {
        number /= 1e6;
        suffix = "M";
    } else if (number >= 1e3) {
        number /= 1e3;
        suffix = "K";
    }
    return `${sign}${usePrefix ? "$" : ""}${number.toFixed(decimals)}${suffix}`;
}

function toBoldUnicode(text) {
    const boldMap = {
        "a": "𝐚", "b": "𝐛", "c": "𝐜", "d": "𝐝", "e": "𝐞", "f": "𝐟", "g": "𝐠", "h": "𝐡", "i": "𝐢", "j": "𝐣", "k": "𝐤", "l": "𝐥", "m": "𝐦", "n": "𝐧", "o": "𝐨", "p": "𝐩", "q": "𝐪", "r": "𝐫", "s": "𝐬", "t": "𝐭", "u": "𝐮", "v": "𝐯", "w": "𝐰", "x": "𝐱", "y": "𝐲", "z": "𝐳", 
        "A": "𝐀", "B": "𝐁", "C": "𝐂", "D": "𝐃", "E": "𝐄", "F": "𝐅", "G": "𝐆", "H": "𝐇", "I": "𝐈", "J": "𝐉", "K": "𝐊", "L": "𝐋", "M": "𝐌", "N": "𝐍", "O": "𝐎", "P": "𝐏", "Q": "𝐐", "R": "𝐑", "S": "𝐒", "T": "𝐓", "U": "𝐔", "V": "𝐕", "W": "𝐖", "X": "𝐗", "Y": "𝐘", "Z": "𝐙", 
        "0": "𝟎", "1": "𝟏", "2": "𝟐", "3": "𝟑", "4": "𝟒", "5": "𝟓", "6": "𝟔", "7": "𝟕", "8": "𝟖", "9": "𝟗"
    };
    return String(text).split("").map(char => boldMap[char] || char).join("");
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
    const lines = text.split("\n");
    for (const line of lines) {
        let words = line.split(" ");
        let currentLine = "";
        for (let i = 0; i < words.length; i++) {
            let testLine = currentLine + words[i] + " ";
            if (context.measureText(testLine).width > maxWidth && i > 0) {
                context.fillText(currentLine.trim(), x, y);
                currentLine = words[i] + " ";
                y += lineHeight;
            } else {
                currentLine = testLine;
            }
        }
        context.fillText(currentLine.trim(), x, y);
        y += lineHeight;
    }
}

/**
 * Safely evaluates a mathematical expression string.
 * NOTE: This is safer than a direct eval() but can still be abused.
 * For a real application, a dedicated math parsing library is recommended.
 */
function safeEval(expression) {
    try {
        const sanitized = String(expression).replace(/[^-()\d/*+.]/g, '');
        return new Function(`return ${sanitized}`)();
    } catch (e) {
        return null;
    }
}


// --- Database Functions ---

let mongoClient;

async function getDb() {
    if (!mongoClient || !mongoClient.topology || !mongoClient.topology.isConnected()) {
        mongoClient = new MongoClient(mongoUri);
        await mongoClient.connect();
    }
    return mongoClient.db(DB_NAME);
}

async function getUserBankData(userId, db) {
    const bankCollection = db.collection(BANK_COLLECTION);
    let userData = await bankCollection.findOne({ userId: String(userId) });

    if (!userData) {
        const now = new Date();
        userData = {
            userId: String(userId),
            bank: 0,
            lastInterestClaimed: now,
            loan: { amount: 0, history: { repaid: 0 }, dueDate: null },
            card: { number: null, pin: null },
            lastDailyClaimed: null,
            lastLoanWarning: null,
            creditScore: 500,
            stocks: [],
            investments: [],
            properties: [],
            businesses: [],
            cheques: { issued: [], received: [] },
            transactionHistory: [],
            insurance: [],
            messages: [],
            callLog: [],
            gallery: [],
            wallpaperUrl: null,
            pinReset: { code: null, expires: null },
            report: { earned: 0, spent: 0, interest: 0, rent: 0, cheques: 0, lastReset: now },
            createdAt: now,
            updatedAt: now
        };
        await bankCollection.insertOne(userData);
    }
    // Ensure all nested objects exist to prevent errors on older accounts
    userData.card = userData.card || { number: null, pin: null };
    userData.loan = userData.loan || { amount: 0, history: { repaid: 0 } };
    userData.loan.history = userData.loan.history || { repaid: 0 };
    userData.creditScore = userData.creditScore || 500;
    userData.businesses = userData.businesses || [];
    userData.properties = userData.properties || [];
    userData.messages = userData.messages || [];
    userData.callLog = userData.callLog || [];
    userData.gallery = userData.gallery || [];
    userData.report = userData.report || { earned: 0, spent: 0, interest: 0, rent: 0, cheques: 0, lastReset: new Date() };

    return userData;
}

async function updateUserBankData(userId, userData, db) {
    userData.updatedAt = new Date();
    await db.collection(BANK_COLLECTION).updateOne({ userId: String(userId) }, { $set: userData }, { upsert: true });
}

async function addTransaction(userId, type, description, amount, db) {
    const transaction = { type, description, amount, date: new Date() };
    await db.collection(BANK_COLLECTION).updateOne(
        { userId: String(userId) },
        { $push: { transactionHistory: { $each: [transaction], $slice: -50 } } }
    );
}

async function logAudit(db, type, event, details = {}) {
    await db.collection(AUDIT_COLLECTION).insertOne({
        type,
        userId: String(event.senderID),
        timestamp: new Date(),
        ...details
    });
}

// --- Economy Logic ---

async function calculateCreditScore(userData, userCash) {
    let score = 300;
    const netWorth = (userData.bank || 0) + userCash;
    const accountAgeDays = (new Date() - new Date(userData.createdAt)) / (1000 * 60 * 60 * 24);
    
    score += Math.min(150, 5 * Math.floor(accountAgeDays / 30)); // Account age bonus
    score += Math.min(150, Math.floor(netWorth / 10000));      // Net worth bonus
    score += 25 * (userData.loan.history.repaid || 0);         // Loan repayment history
    if (userData.loan.amount > 0) score -= 50;                 // Active loan penalty
    score += Math.min(100, (userData.transactionHistory || []).length); // Transaction history bonus
    
    return Math.max(300, Math.min(850, score));
}

function getTierPerks(netWorth) {
    if (netWorth >= 1e8) return { tier: "💎 Platinum", feeModifier: 0.5, interestBonus: 0.002 };
    if (netWorth >= 1e7) return { tier: "🥇 Gold", feeModifier: 0.7, interestBonus: 0.001 };
    if (netWorth >= 1e6) return { tier: "🥈 Silver", feeModifier: 0.85, interestBonus: 0 };
    return { tier: "🥉 Bronze", feeModifier: 1, interestBonus: 0 };
}


// --- Canvas Drawing Functions ---

const FONT_FAMILY = 'Arial';
const MILOW_COLORS = {
    bg: '#1a1a1a',
    bg2: '#2c2c2c',
    primary: '#00A79D', // Teal
    accent: '#0081A7',  // Darker Blue
    text: '#F0F0F0',
    textMuted: '#99AAB5',
    success: '#4CAF50',
    error: '#F44336'
};

function fillRoundRect(ctx, x, y, width, height, radius) {
    if (typeof radius === 'number') {
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
        const defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
        for (let side in defaultRadius) {
            radius[side] = radius[side] || defaultRadius[side];
        }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    ctx.fill();
}

async function drawModernAtmCanvas(state, data) {
    const canvasWidth = 600, canvasHeight = 800;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext("2d");

    // Main background
    ctx.fillStyle = MILOW_COLORS.bg;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Inner panel
    const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
    gradient.addColorStop(0, MILOW_COLORS.bg2);
    gradient.addColorStop(1, MILOW_COLORS.bg);
    ctx.fillStyle = gradient;
    ctx.fillRect(10, 10, canvasWidth - 20, canvasHeight - 20);

    // Header
    ctx.fillStyle = MILOW_COLORS.primary;
    ctx.fillRect(10, 10, canvasWidth - 20, 90);
    ctx.shadowColor = "black";
    ctx.shadowBlur = 15;
    ctx.fillStyle = MILOW_COLORS.text;
    ctx.font = `bold 36px ${FONT_FAMILY}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("MILOW BANK", canvasWidth / 2, 55);
    ctx.shadowBlur = 0;

    // Screen Area
    const screenX = 30, screenY = 120;
    const screenWidth = canvasWidth - 60, screenHeight = 500;
    ctx.fillStyle = "#0c1014";
    ctx.fillRect(screenX, screenY, screenWidth, screenHeight);
    ctx.strokeStyle = MILOW_COLORS.primary;
    ctx.lineWidth = 4;
    ctx.strokeRect(screenX, screenY, screenWidth, screenHeight);

    ctx.fillStyle = MILOW_COLORS.textMuted;
    ctx.font = `20px ${FONT_FAMILY}`;
    ctx.textAlign = "left";
    ctx.fillText(`Welcome, ${data.userName}`, screenX + 20, screenY + 35);
    ctx.textAlign = "center";
    
    const centerX = screenX + screenWidth / 2;

    if (state.screen === "main_menu") {
        const menuItems = ["Balance Inquiry", "Cash Withdrawal", "Fast Cash ($500)", "Cash Deposit", "Funds Transfer", "Mini Statement"];
        ctx.font = `bold 26px ${FONT_FAMILY}`;
        ctx.fillStyle = MILOW_COLORS.text;
        ctx.fillText("Main Menu", centerX, screenY + 80);
        ctx.font = `22px ${FONT_FAMILY}`;
        ctx.textAlign = "left";
        menuItems.forEach((item, index) => {
            ctx.fillStyle = MILOW_COLORS.primary;
            ctx.fillText(`${index + 1}.`, screenX + 40, screenY + 140 + 60 * index);
            ctx.fillStyle = MILOW_COLORS.text;
            ctx.fillText(item, screenX + 80, screenY + 140 + 60 * index);
        });
    } else if (state.screen === "balance") {
        ctx.font = `bold 28px ${FONT_FAMILY}`;
        ctx.fillStyle = MILOW_COLORS.text;
        ctx.fillText("Available Balance", centerX, screenY + 180);
        ctx.font = `bold 48px ${FONT_FAMILY}`;
        ctx.fillStyle = MILOW_COLORS.success;
        ctx.fillText(data.balance, centerX, screenY + 260);
    } else if (state.screen === "prompt") {
        ctx.font = `bold 28px ${FONT_FAMILY}`;
        ctx.fillStyle = MILOW_COLORS.text;
        wrapText(ctx, data.message, centerX, screenY + 220, screenWidth - 80, 40);
    } else if (state.screen === "receipt") {
        ctx.font = `bold 28px ${FONT_FAMILY}`;
        ctx.fillStyle = data.isError ? MILOW_COLORS.error : MILOW_COLORS.success;
        ctx.fillText(data.title, centerX, screenY + 80);
        ctx.font = `22px ${FONT_FAMILY}`;
        ctx.fillStyle = MILOW_COLORS.text;
        wrapText(ctx, data.message, centerX, screenY + 150, screenWidth - 80, 35);
    }
    
    // Footer
    ctx.fillStyle = MILOW_COLORS.bg2;
    ctx.fillRect(10, canvasHeight - 120, canvasWidth - 20, 110);
    ctx.fillStyle = MILOW_COLORS.textMuted;
    ctx.font = `16px ${FONT_FAMILY}`;
    ctx.textAlign = "center";
    ctx.fillText(state.footerMessage, canvasWidth / 2, canvasHeight - 65);

    // Save and return stream
    const cacheDir = path.join(__dirname, "..", "cache");
    await fs.ensureDir(cacheDir);
    const imagePath = path.join(cacheDir, `atm_${Date.now()}.png`);
    const out = fs.createWriteStream(imagePath);
    canvas.createPNGStream().pipe(out);
    await new Promise((resolve, reject) => {
        out.on("finish", resolve);
        out.on("error", reject);
    });
    return fs.createReadStream(imagePath);
}

async function drawStockMarketCanvas(page) {
    const stocksPerPage = 6;
    const stockSymbols = Object.keys(stockMarket);
    const totalPages = Math.ceil(stockSymbols.length / stocksPerPage);
    page = Math.max(1, Math.min(page, totalPages));
    const startIndex = (page - 1) * stocksPerPage;
    const pageStocks = stockSymbols.slice(startIndex, startIndex + stocksPerPage);

    const canvasWidth = 550;
    const headerHeight = 90, itemHeight = 85, footerHeight = 40;
    const canvasHeight = headerHeight + pageStocks.length * itemHeight + footerHeight;

    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = MILOW_COLORS.bg, ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = MILOW_COLORS.bg2, ctx.fillRect(0, 0, canvasWidth, headerHeight);
    ctx.fillStyle = MILOW_COLORS.text, ctx.font = `bold 24px ${FONT_FAMILY}`;
    ctx.textAlign = "center", ctx.textBaseline = "middle";
    ctx.fillText("Milow Stock Exchange", canvasWidth / 2, headerHeight / 2);

    let currentY = headerHeight + 5;
    for (const symbol of pageStocks) {
        const stock = stockMarket[symbol];
        ctx.fillStyle = MILOW_COLORS.bg2;
        ctx.fillRect(10, currentY, canvasWidth - 20, itemHeight - 5);
        
        ctx.fillStyle = MILOW_COLORS.text;
        ctx.font = `bold 18px ${FONT_FAMILY}`;
        ctx.textAlign = "left";
        ctx.fillText(`${symbol} • ${stock.name}`, 25, currentY + 30);
        
        ctx.font = `16px ${FONT_FAMILY}`;
        ctx.fillText(`Price: ${formatKMB(stock.price)}`, 25, currentY + 60);

        const dailyChange = (stock.dailyChange || 0).toFixed(2);
        const isUp = (stock.dailyChange || 0) >= 0;
        ctx.fillStyle = isUp ? MILOW_COLORS.success : MILOW_COLORS.error;
        ctx.textAlign = "right";
        ctx.font = `bold 20px ${FONT_FAMILY}`;
        ctx.fillText(`${isUp ? "▲" : "▼"} ${dailyChange}%`, canvasWidth - 25, currentY + 45);
        
        currentY += itemHeight;
    }

    ctx.fillStyle = MILOW_COLORS.bg2;
    ctx.fillRect(0, canvasHeight - footerHeight, canvasWidth, footerHeight);
    ctx.fillStyle = MILOW_COLORS.textMuted;
    ctx.font = `16px ${FONT_FAMILY}`;
    ctx.textAlign = "center";
    ctx.fillText(`Page ${page} of ${totalPages}`, canvasWidth / 2, canvasHeight - footerHeight / 2);

    const cacheDir = path.join(__dirname, "..", "cache");
    await fs.ensureDir(cacheDir);
    const imagePath = path.join(cacheDir, `stock_market_${Date.now()}.png`);
    const out = fs.createWriteStream(imagePath);
    canvas.createPNGStream().pipe(out);
    await new Promise(resolve => out.on("finish", resolve));
    return fs.createReadStream(imagePath);
}

async function drawStockPortfolioCanvas(userData, usersDataService, userId) {
    const portfolio = userData.stocks;
    if (!portfolio || portfolio.length === 0) return null;

    const canvasWidth = 550;
    const headerHeight = 80, itemHeight = 90;
    const canvasHeight = headerHeight + portfolio.length * itemHeight + 20;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = MILOW_COLORS.bg;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = MILOW_COLORS.bg2;
    ctx.fillRect(0, 0, canvasWidth, headerHeight);

    ctx.fillStyle = MILOW_COLORS.text;
    ctx.font = `bold 22px ${FONT_FAMILY}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const userName = await usersDataService.getName(userId) || "User";
    ctx.fillText(`${userName}'s Stock Portfolio`, canvasWidth / 2, headerHeight / 2);

    let currentY = headerHeight + 10;
    for (const holding of portfolio) {
        const stockData = stockMarket[holding.symbol];
        if (!stockData) continue;
        
        const currentValue = stockData.price * holding.shares;
        const costBasis = holding.avgBuyPrice * holding.shares;
        const profitLoss = currentValue - costBasis;
        const profitLossPercent = costBasis !== 0 ? (profitLoss / costBasis) * 100 : 0;

        ctx.fillStyle = MILOW_COLORS.bg2;
        ctx.fillRect(10, currentY, canvasWidth - 20, itemHeight - 10);
        
        ctx.fillStyle = MILOW_COLORS.text;
        ctx.font = `bold 18px ${FONT_FAMILY}`;
        ctx.textAlign = "left";
        ctx.fillText(`${holding.symbol} • ${stockData.name}`, 25, currentY + 25);
        
        ctx.font = `14px ${FONT_FAMILY}`;
        ctx.fillText(`${holding.shares} shares @ avg ${formatKMB(holding.avgBuyPrice)}`, 25, currentY + 50);
        ctx.fillText(`Value: ${formatKMB(currentValue)}`, 25, currentY + 70);

        ctx.font = `bold 16px ${FONT_FAMILY}`;
        ctx.textAlign = "right";
        ctx.fillStyle = profitLoss >= 0 ? MILOW_COLORS.success : MILOW_COLORS.error;
        ctx.fillText(`${profitLoss >= 0 ? "+" : ""}${profitLossPercent.toFixed(2)}%`, canvasWidth - 25, currentY + 35);
        
        ctx.font = `14px ${FONT_FAMILY}`;
        ctx.fillText(`P/L: ${formatKMB(profitLoss)}`, canvasWidth - 25, currentY + 60);

        currentY += itemHeight;
    }

    const cacheDir = path.join(__dirname, "..", "cache");
    await fs.ensureDir(cacheDir);
    const imagePath = path.join(cacheDir, `stock_portfolio_${userId}_${Date.now()}.png`);
    const out = fs.createWriteStream(imagePath);
    canvas.createPNGStream().pipe(out);
    await new Promise(resolve => out.on("finish", resolve));
    return fs.createReadStream(imagePath);
}

async function drawFinancialReportCanvas(userData, usersDataService, userId) {
    const canvasWidth = 550, canvasHeight = 700;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = MILOW_COLORS.bg, ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = MILOW_COLORS.bg2, ctx.fillRect(0, 0, canvasWidth, 60);
    ctx.fillStyle = MILOW_COLORS.text, ctx.font = `bold 24px ${FONT_FAMILY}`;
    ctx.textAlign = "center", ctx.textBaseline = "middle";
    const userName = await usersDataService.getName(userId) || "User";
    ctx.fillText(`${userName}'s Financial Report`, canvasWidth / 2, 30);

    const bankBalance = userData.bank || 0;
    const cash = await usersDataService.get(userId, "money") || 0;
    const stockValue = (userData.stocks || []).reduce((total, stock) => total + (stockMarket[stock.symbol]?.price || 0) * stock.shares, 0);
    const businessValue = (userData.businesses || []).reduce((total, biz) => {
        const businessInfo = availableBusinesses.find(b => b.id === biz.businessId);
        return total + (businessInfo?.cost || 0);
    }, 0);
    const totalNetWorth = bankBalance + cash + stockValue + businessValue;

    const assets = {
        "Bank": bankBalance,
        "Cash": cash,
        "Stocks": stockValue,
        "Businesses": businessValue
    };

    // Draw Pie Chart
    const pieColors = ["#4299E1", "#48BB78", "#ECC94B", "#F56565"];
    let startAngle = 0;
    let colorIndex = 0;
    for (const [asset, value] of Object.entries(assets)) {
        if (value > 0) {
            const sliceAngle = (value / totalNetWorth) * 2 * Math.PI;
            ctx.fillStyle = pieColors[colorIndex++ % pieColors.length];
            ctx.beginPath();
            ctx.moveTo(200, 200);
            ctx.arc(200, 200, 120, startAngle, startAngle + sliceAngle);
            ctx.closePath();
            ctx.fill();
            startAngle += sliceAngle;
        }
    }

    // Draw Legend
    ctx.textAlign = "left", ctx.font = `16px ${FONT_FAMILY}`, ctx.fillStyle = MILOW_COLORS.text;
    let legendY = 80;
    colorIndex = 0;
    Object.entries(assets).forEach(([name, value]) => {
        ctx.fillStyle = pieColors[colorIndex++ % pieColors.length];
        ctx.fillRect(380, legendY - 10, 20, 10);
        ctx.fillStyle = MILOW_COLORS.text;
        ctx.fillText(`${name}: ${formatKMB(value)}`, 410, legendY);
        legendY += 25;
    });

    // Draw Net Worth & Credit Score
    ctx.font = `bold 20px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.fillText("Net Worth", canvasWidth / 2, 400);
    ctx.font = `bold 30px ${FONT_FAMILY}`;
    ctx.fillStyle = MILOW_COLORS.success;
    ctx.fillText(formatKMB(totalNetWorth), canvasWidth / 2, 440);
    
    ctx.font = `bold 20px ${FONT_FAMILY}`;
    ctx.fillStyle = MILOW_COLORS.text;
    ctx.fillText("Credit Score", canvasWidth / 2, 500);
    ctx.font = `bold 30px ${FONT_FAMILY}`;
    ctx.fillStyle = "#ECC94B";
    ctx.fillText(userData.creditScore, canvasWidth / 2, 540);

    const cacheDir = path.join(__dirname, "..", "cache");
    await fs.ensureDir(cacheDir);
    const imagePath = path.join(cacheDir, `report_${userId}_${Date.now()}.png`);
    const out = fs.createWriteStream(imagePath);
    canvas.createPNGStream().pipe(out);
    await new Promise(resolve => out.on("finish", resolve));
    return fs.createReadStream(imagePath);
}

// Phone Canvas (No major changes needed, it's complex and functional)
async function drawPhoneCanvas(state, userData, usersDataService, threadID) {
    const canvasWidth = 400;
    const canvasHeight = 850;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');
    const wallpaperUrl = userData.wallpaperUrl || 'https://i.ibb.co/b58nZBh6/Picsart-25-06-10-21-34-55-158.jpg';
    
    try {
        const wallpaper = await loadImage(wallpaperUrl);
        ctx.drawImage(wallpaper, 0, 0, canvasWidth, canvasHeight);
    } catch (e) {
        const wallpaperGradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
        wallpaperGradient.addColorStop(0, '#2c3e50');
        wallpaperGradient.addColorStop(1, '#3498db');
        ctx.fillStyle = wallpaperGradient;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    const timeZone = 'Asia/Dhaka';
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { timeZone, hour: '2-digit', minute: '2-digit', hour12: false });
    const date = now.toLocaleDateString('en-US', { timeZone, weekday: 'long', month: 'long', day: 'numeric' });
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold 18px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 4;
    ctx.fillText(`📶 🔋 ${time}`, canvasWidth / 2, 30);
    ctx.shadowBlur = 0;
    
    const appIcons = [
        { name: 'Milow', iconUrl: 'https://i.ibb.co/8nX3BDGv/Picsart-25-06-10-16-42-23-926.png' },
        { name: 'Call', iconUrl: 'https://i.ibb.co/CsDtDKKb/Picsart-25-06-10-16-57-10-353.png' },
        { name: 'Messages', iconUrl: 'https://i.ibb.co/GfcB387Z/Picsart-25-06-10-17-02-02-228.png' },
        { name: 'Maps', iconUrl: 'https://i.ibb.co/q3b1j21Q/Picsart-25-06-10-16-54-43-763.png' },
        { name: 'Calculator', iconUrl: 'https://i.ibb.co/7d8RkzC9/Picsart-25-06-10-16-46-07-667.png' },
        { name: 'Calendar', iconUrl: 'https://i.ibb.co/qt2RKfV/Picsart-25-06-10-16-48-05-373.png' },
        { name: 'Gallery', iconUrl: 'https://i.ibb.co/CszzxvJH/Picsart-25-06-10-21-43-44-235.png' },
        { name: 'Settings', iconUrl: 'https://i.ibb.co/Kx0kRXYk/Picsart-25-06-10-16-52-09-263.png' }
    ];
    
    const loadedIcons = await Promise.all(appIcons.map(app => app.iconUrl ? loadImage(app.iconUrl).catch(e => {
        console.log(`Failed to load icon: ${app.iconUrl}`);
        return null;
    }) : Promise.resolve(null)));
    
    const drawHeader = (title) => {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, canvasWidth, 60);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold 22px ${FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.fillText(title, canvasWidth / 2, 40);
        ctx.font = `bold 16px ${FONT_FAMILY}`;
        ctx.textAlign = 'left';
        ctx.fillText('‹ Home', 20, 40);
    };
    
    if (state.screen === 'lockscreen') {
        ctx.font = `bold 52px ${FONT_FAMILY}`;
        ctx.fillText(time, canvasWidth / 2, canvasHeight / 2 - 40);
        ctx.font = `24px ${FONT_FAMILY}`;
        ctx.fillText(date, canvasWidth / 2, canvasHeight / 2 + 10);
        ctx.font = `bold 18px ${FONT_FAMILY}`;
        ctx.globalAlpha = 0.8;
        ctx.fillText('Reply anything to Unlock', canvasWidth / 2, canvasHeight - 80);
        ctx.globalAlpha = 1.0;
    } else {
        if (state.screen === 'home') {
            let iconSize = 64;
            let padding = 28;
            let iconsPerRow = 4;
            let startX = (canvasWidth - (iconsPerRow * iconSize + (iconsPerRow - 1) * padding)) / 2;
            let startY = 80;
            
            appIcons.forEach((app, i) => {
                const row = Math.floor(i / iconsPerRow);
                const col = i % iconsPerRow;
                const x = startX + col * (iconSize + padding);
                const y = startY + row * (iconSize + padding + 30);
                
                if (loadedIcons[i]) {
                    ctx.drawImage(loadedIcons[i], x, y, iconSize, iconSize);
                } else {
                    ctx.font = `${iconSize}px Arial`;
                    ctx.fillText(app.emoji, x + iconSize / 2, y + iconSize / 2);
                }
                
                ctx.font = `14px ${FONT_FAMILY}`;
                ctx.fillStyle = '#FFFFFF';
                ctx.textAlign = 'center';
                ctx.fillText(app.name, x + iconSize / 2, y + iconSize + 15);
                
                const unreadMessages = (userData.messages || []).filter(m => !m.read && m.senderId !== userData.userId).length;
                const missedCalls = (userData.callLog || []).filter(c => !c.read && c.type === 'missed').length;
                
                if (app.name === 'Messages' && unreadMessages > 0) {
                    ctx.beginPath();
                    ctx.arc(x + iconSize, y, 12, 0, 2 * Math.PI);
                    ctx.fillStyle = 'red';
                    ctx.fill();
                    ctx.fillStyle = 'white';
                    ctx.font = 'bold 14px Arial';
                    ctx.fillText(unreadMessages, x + iconSize, y);
                }
                
                if (app.name === 'Call' && missedCalls > 0) {
                    ctx.beginPath();
                    ctx.arc(x + iconSize, y, 12, 0, 2 * Math.PI);
                    ctx.fillStyle = 'red';
                    ctx.fill();
                    ctx.fillStyle = 'white';
                    ctx.font = 'bold 14px Arial';
                    ctx.fillText(missedCalls, x + iconSize, y);
                }
            });
        } else if (state.screen === 'milow_app') {
            drawHeader("Milow Bank");
            const userName = await usersDataService.getName(userData.userId) || "CARD HOLDER";
            
            if (userData.card && userData.card.number) {
                const grad = ctx.createLinearGradient(0, 0, canvasWidth, 0);
                grad.addColorStop(0, MILOW_COLORS.primary);
                grad.addColorStop(1, MILOW_COLORS.accent);
                ctx.fillStyle = grad;
                fillRoundRect(ctx, 30, 80, canvasWidth - 60, 220, 20);
                
                ctx.font = 'bold 22px Arial';
                ctx.fillStyle = '#FFFFFF';
                ctx.textAlign = 'left';
                ctx.fillText('Milow Debit', 50, 115);
                
                ctx.font = '24px "Courier New", monospace';
                ctx.fillText(userData.card.number, 50, 170);
                
                ctx.font = '18px Arial';
                ctx.fillText(userName.toUpperCase(), 50, 260);
                
                ctx.textAlign = 'right';
                ctx.fillText('VALID', canvasWidth - 60, 260);
            } else {
                ctx.font = '18px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('No card found.', canvasWidth / 2, 200);
            }
            
            ctx.textAlign = 'center';
            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText('Balance:', canvasWidth / 2, 360);
            
            ctx.font = 'bold 48px Arial';
            ctx.fillStyle = MILOW_COLORS.success;
            ctx.fillText(formatKMB(userData.bank), canvasWidth / 2, 410);
        } else if (state.screen === 'calendar') {
            drawHeader("Calendar");
            ctx.font = `bold 64px ${FONT_FAMILY}`;
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.fillText(now.getDate(), canvasWidth / 2, 200);
            
            ctx.font = `32px ${FONT_FAMILY}`;
            ctx.fillText(now.toLocaleDateString('en-US', { timeZone, month: 'long', year: 'numeric' }), canvasWidth / 2, 260);
            
            ctx.font = `24px ${FONT_FAMILY}`;
            ctx.fillText(now.toLocaleDateString('en-US', { timeZone, weekday: 'long' }), canvasWidth / 2, 300);
        } else if (state.screen === 'maps') {
            drawHeader("Maps");
            ctx.fillStyle = '#a2d2ff';
            ctx.fillRect(20, 80, canvasWidth - 40, canvasHeight - 120);
            
            ctx.fillStyle = '#2a9d8f';
            for(let i=0; i<5; i++) {
                fillRoundRect(ctx, 40 + Math.random()*280, 100 + Math.random()*600, 60, 40, 5);
            }
            
            ctx.fillStyle = '#e9c46a';
            fillRoundRect(ctx, 100, 400, 200, 5, 2);
            fillRoundRect(ctx, 180, 200, 5, 250, 2);
            
            ctx.beginPath();
            ctx.arc(180, 400, 10, 0, 2*Math.PI);
            ctx.fillStyle = 'red';
            ctx.fill();
            ctx.strokeStyle='white';
            ctx.lineWidth=2;
            ctx.stroke();
        } else if (state.screen === 'calculator') {
            drawHeader('Calculator');
            const display = state.display || '0';
            
            ctx.fillStyle = '#111';
            ctx.fillRect(20, 80, canvasWidth - 40, 120);
            
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'right';
            ctx.font = 'bold 60px Arial';
            ctx.fillText(display.length > 9 ? parseFloat(display).toExponential(3) : display, canvasWidth - 40, 170);
            
            const buttons = [
                ['C','(',')','/'],
                ['7','8','9','*'],
                ['4','5','6','-'],
                ['1','2','3','+'],
                ['0','.','=']
            ];
            
            const btnHeight = 100;
            const btnYStart = 220;
            
            buttons.forEach((row, r) => {
                row.forEach((label, c) => {
                    const btnWidth = (canvasWidth-50)/row.length;
                    const x = 25 + c * btnWidth;
                    const y = btnYStart + r * btnHeight;
                    
                    ctx.fillStyle = isNaN(parseInt(label)) && label !== '.' ? '#f09a36' : '#333';
                    
                    if(label === '=') fillRoundRect(ctx, x, y, btnWidth*2 - 5, btnHeight-20, 10);
                    else fillRoundRect(ctx, x, y, btnWidth-5, btnHeight-20, 10);
                    
                    ctx.fillStyle = '#fff';
                    ctx.textAlign = 'center';
                    ctx.font = 'bold 32px Arial';
                    
                    if(label === '=') ctx.fillText(label, x + (btnWidth*2-5)/2, y + (btnHeight-20)/2);
                    else ctx.fillText(label, x + (btnWidth-5)/2, y + (btnHeight-20)/2);
                });
            });
        } else if (state.screen === 'messages_list' || state.screen === 'call_log' || state.screen === 'settings' || state.screen === 'gallery_home') {
            drawHeader(state.screen === 'messages_list' ? 'Messages' : state.screen === 'call_log' ? 'Call Log' : state.screen === 'settings' ? 'Settings' : 'Gallery');
            
            let yPos = 80;
            
            if (state.screen === 'messages_list') {
                const messageThreads = {};
                (userData.messages || []).forEach(msg => {
                    const otherPartyId = msg.senderId === userData.userId ? msg.recipientId : msg.senderId;
                    if (!messageThreads[otherPartyId]) messageThreads[otherPartyId] = { messages: [], unread: false, name: '' };
                    messageThreads[otherPartyId].messages.push(msg);
                    if (!msg.read && msg.senderId !== userData.userId) messageThreads[otherPartyId].unread = true;
                });
                
                let index = 1;
                for (const [userId, thread] of Object.entries(messageThreads)) {
                    const lastMessage = thread.messages[thread.messages.length - 1];
                    const name = await usersDataService.getName(userId) || `User ${userId}`;
                    thread.name = name;
                    
                    ctx.fillStyle = thread.unread ? '#3a3a3a' : '#222';
                    fillRoundRect(ctx, 20, yPos, canvasWidth - 40, 60, 10);
                    
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = 'bold 16px Arial';
                    ctx.textAlign = 'left';
                    ctx.fillText(`${index}. ${name}`, 35, yPos + 20);
                    
                    ctx.font = '14px Arial';
                    ctx.fillStyle = '#AAAAAA';
                    wrapText(ctx, (lastMessage.senderId === userData.userId ? "You: " : "") + lastMessage.content, 35, yPos + 40, canvasWidth - 80, 18);
                    
                    if (thread.unread) {
                        ctx.beginPath();
                        ctx.arc(canvasWidth - 35, yPos + 30, 8, 0, 2 * Math.PI);
                        ctx.fillStyle = MILOW_COLORS.primary;
                        ctx.fill();
                    }
                    
                    yPos += 75;
                    index++;
                }
            } else if (state.screen === 'call_log') {
                const callLog = (userData.callLog || []).slice(-10).reverse();
                
                if (callLog.length === 0) {
                    ctx.textAlign='center';
                    ctx.fillStyle='#ccc';
                    ctx.font='18px Arial';
                    ctx.fillText("No recent calls.", canvasWidth/2, 200);
                }
                
                for(const call of callLog) {
                    const name = call.type === 'missed' ? call.from : call.to;
                    const color = call.type === 'missed' ? MILOW_COLORS.error : MILOW_COLORS.success;
                    
                    ctx.fillStyle = color;
                    ctx.font = 'bold 20px Arial';
                    ctx.textAlign='left';
                    ctx.fillText(call.type === 'missed' ? '↓' : '↑', 30, yPos+25);
                    
                    ctx.fillStyle = '#FFF';
                    ctx.fillText(name, 60, yPos+25);
                    
                    ctx.font='14px Arial';
                    ctx.fillStyle='#aaa';
                    ctx.textAlign='right';
                    ctx.fillText(new Date(call.date).toLocaleTimeString(), canvasWidth-30, yPos+25);
                    
                    yPos += 40;
                }
            } else if (state.screen === 'settings') {
                const settingsOptions = ["1. About Phone", "2. Network Information", "3. Change Wallpaper"];
                
                ctx.fillStyle = '#FFF';
                ctx.font = '18px Arial';
                ctx.textAlign = 'left';
                
                settingsOptions.forEach((opt, i) => {
                    ctx.fillText(opt, 40, 120 + i * 40);
                });
            } else if (state.screen === 'gallery_home') {
                ctx.textAlign = 'center';
                ctx.font = '24px Arial';
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText("1. View Gallery", canvasWidth / 2, 150);
                ctx.fillText("2. Save Image", canvasWidth / 2, 200);
            }
        }
    }
    
    const tempImageDir = path.join(__dirname, "..", "cache");
    await fs.ensureDir(tempImageDir);
    const tempImagePath = path.join(tempImageDir, `phone_${userData.userId}_${Date.now()}.png`);
    const out = fs.createWriteStream(tempImagePath);
    canvas.createPNGStream().pipe(out);
    await new Promise((resolve) => out.on('finish', resolve));
    return fs.createReadStream(tempImagePath);
}


// --- Main Module ---
module.exports = {
    config: {
        name: "bank",
        aliases: ["mb", "milow"],
        version: "6.0",
        author: "Mahi-- (Upgraded by Gemini)",
        role: 0,
        countDown: 3,
        shortDescription: {
            en: "The complete Milow Bank financial system."
        },
        longDescription: {
            en: "The ultimate banking experience with a huge array of financial tools, market simulations, and a personal phone."
        },
        category: "economy"
    },
    
    onReply: async function ({ event, api, message, Reply, usersData }) {
        const { author, type } = Reply;
        if (event.senderID !== author) return;
        
        const handler = {
            'ai_talk': this.handleAiTalkReply,
            'atm_flow': this.handleAtmReply,
            'card_creation': this.handleCardCreationReply,
            'pin_change': this.handlePinChangeReply,
            'phone_flow': this.handlePhoneReply
        }[type];
        
        if (handler) await handler.call(this, { event, api, message, Reply, usersData });
    },
    
    handleCardCreationReply: async function ({ event, message, Reply }) {
        const pin = event.body.trim();
        if (!/^\d{4}$/.test(pin)) {
            return message.reply("Invalid format. Please reply with exactly 4 numbers for your PIN.", (err, info) => {
                if(err) return;
                global.GoatBot.onReply.set(info.messageID, Reply);
            });
        }
        
        const db = await getDb();
        const userBankInfo = await getUserBankData(event.senderID, db);
        const cardNumber = '4269 ' + Array.from({ length: 3 }, () => Math.floor(1000 + Math.random() * 9000)).join(' ');
        
        userBankInfo.card = { number: cardNumber, pin: pin };
        
        await updateUserBankData(event.senderID, userBankInfo, db);
        
        const prefix = global.utils.getPrefix(event.threadID) || ".";
        message.reply(`✅ Your Milow Bank debit card is active!\n\n💳 Card Number: ${cardNumber}\n🔒 PIN: ••••\n\nYou can now use the ATM with: ${prefix}bank atm`);
    },
    
    handleAtmReply: async function ({ event, api, message, Reply, usersData }) {
        const db = await getDb();
        let userBankInfo = await getUserBankData(event.senderID, db);
        let userCash = await usersData.get(event.senderID, "money") || 0;
        const userName = await usersData.getName(event.senderID);
        const userInput = event.body.trim();
        let { state } = Reply;
        
        const footerMainMenu = "Reply with a number (1-6) to select an option, or 'exit'.";
        
        const sendReply = (msg, screen, data, nextStep, footer) => {
            drawModernAtmCanvas({ screen, footerMessage: footer }, { userName, ...data }).then(attachment => {
                state.step = nextStep;
                message.reply({ body: msg, attachment }, (err, info) => {
                    fs.unlink(attachment.path, () => {});
                    if (err) return;
                    if (nextStep) global.GoatBot.onReply.set(info.messageID, {
                        commandName: this.config.name,
                        author: event.senderID,
                        type: 'atm_flow',
                        state
                    });
                });
            });
        };
        
        if (userInput.toLowerCase() === 'exit') {
            return message.reply("Session terminated. Thank you for using Milow Bank.");
        }
        
        if (state.step === 'awaiting_pin') {
            if (userInput !== userBankInfo.card.pin) {
                return message.reply("❌ Incorrect PIN. Session terminated for security.");
            }
            sendReply(`PIN Accepted.`, 'main_menu', {}, 'main_menu', footerMainMenu);
            return;
        }
        
        if (state.step === 'main_menu') {
            const choice = parseInt(userInput, 10);
            switch (choice) {
                case 1:
                    sendReply("Your account balance is shown on screen.", 'balance', { balance: formatKMB(userBankInfo.bank) }, 'main_menu', footerMainMenu);
                    break;
                case 2:
                    sendReply("Enter amount to withdraw:", 'prompt', { message: "How much would you like to withdraw?" }, 'awaiting_withdraw_amount', "Reply with the amount or 'exit'.");
                    break;
                case 3:
                    const fastCashAmount = 500;
                    if (userBankInfo.bank < fastCashAmount) {
                        return sendReply(`Transaction Failed.`, 'receipt', { isError: true, title: "Insufficient Funds", message: `You need ${formatKMB(fastCashAmount)}.` }, 'main_menu', footerMainMenu);
                    }
                    userBankInfo.bank -= fastCashAmount;
                    await usersData.set(event.senderID, { money: userCash + fastCashAmount });
                    await updateUserBankData(event.senderID, userBankInfo, db);
                    await addTransaction(event.senderID, "Withdraw", `Fast Cash via ATM`, -fastCashAmount, db);
                    sendReply(`Successfully withdrew ${formatKMB(fastCashAmount)}.`, 'receipt', { isError: false, title: "Transaction Successful", message: `Withdrew: ${formatKMB(fastCashAmount)}\nNew Balance: ${formatKMB(userBankInfo.bank)}` }, 'main_menu', footerMainMenu);
                    break;
                case 4:
                    sendReply("Enter amount of cash to deposit:", 'prompt', { message: "How much cash are you depositing?" }, 'awaiting_deposit_amount', "Reply with the amount or 'exit'.");
                    break;
                case 5:
                    sendReply("Reply with the @mention of the user and the amount, separated by a space.", 'prompt', { message: `To whom and how much?\n\nExample:\n@John Doe 5000` }, 'awaiting_transfer_details', "Reply with @mention and amount, or 'exit'.");
                    break;
                case 6:
                    const hist = userBankInfo.transactionHistory;
                    if (hist.length === 0) {
                        return sendReply("No recent transactions found.", 'receipt', { isError: true, title: "Statement", message: "Your transaction history is empty." }, 'main_menu', footerMainMenu);
                    }
                    const statement = "Your Last 5 Transactions:\n\n" + hist.slice(-5).reverse().map(t => `[${new Date(t.date).toLocaleDateString()}] ${t.description}: ${formatKMB(t.amount)}`).join('\n');
                    sendReply("Your mini statement is displayed.", 'receipt', { isError: false, title: "Mini Statement", message: statement }, 'main_menu', footerMainMenu);
                    break;
                default:
                    sendReply("Invalid selection.", 'main_menu', {}, 'main_menu', footerMainMenu);
            }
            return;
        }
        
        // --- Transaction Handlers ---
        
        const handleTransaction = async (type, input) => {
            const amount = parseFloat(input);
            if (isNaN(amount) || amount <= 0) {
                return sendReply("Invalid amount.", 'receipt', { isError: true, title: "Transaction Failed", message: "Amount must be a positive number." }, 'main_menu', footerMainMenu);
            }
            
            if (type === 'withdraw' && userBankInfo.bank < amount) {
                return sendReply("Insufficient funds.", 'receipt', { isError: true, title: "Transaction Failed", message: `Your balance is only ${formatKMB(userBankInfo.bank)}.` }, 'main_menu', footerMainMenu);
            }
            
            if (type === 'deposit' && userCash < amount) {
                return sendReply("Insufficient cash.", 'receipt', { isError: true, title: "Transaction Failed", message: `You only have ${formatKMB(userCash)}.` }, 'main_menu', footerMainMenu);
            }
            
            if (type === 'withdraw') {
                userBankInfo.bank -= amount;
                await usersData.set(event.senderID, { money: userCash + amount });
                await updateUserBankData(event.senderID, userBankInfo, db);
                await addTransaction(event.senderID, "Withdraw", `Withdrew ${formatKMB(amount)} via ATM`, -amount, db);
                sendReply("Please take your cash.", 'receipt', { isError: false, title: "Withdrawal Successful", message: `Withdrew: ${formatKMB(amount)}\nNew Balance: ${formatKMB(userBankInfo.bank)}` }, 'main_menu', footerMainMenu);
            } else if (type === 'deposit') {
                userBankInfo.bank += amount;
                await usersData.set(event.senderID, { money: userCash - amount });
                await updateUserBankData(event.senderID, userBankInfo, db);
                await addTransaction(event.senderID, "Deposit", `Deposited ${formatKMB(amount)} via ATM`, amount, db);
                sendReply("Deposit successful.", 'receipt', { isError: false, title: "Deposit Successful", message: `Deposited: ${formatKMB(amount)}\nNew Balance: ${formatKMB(userBankInfo.bank)}` }, 'main_menu', footerMainMenu);
            }
        };

        if (state.step === 'awaiting_withdraw_amount') {
            await handleTransaction('withdraw', userInput);
        }
        
        if (state.step === 'awaiting_deposit_amount') {
            await handleTransaction('deposit', userInput);
        }
        
        // **FIXED**: Implement ATM Transfer Logic
        if (state.step === 'awaiting_transfer_details') {
            const recipientId = Object.keys(event.mentions)[0];
            const parts = userInput.split(' ');
            const amountStr = parts.find(p => !isNaN(parseFloat(p)));
            const amount = parseFloat(amountStr);

            if (!recipientId || isNaN(amount) || amount <= 0) {
                return sendReply("Invalid input.", 'receipt', { isError: true, title: "Transfer Failed", message: "Please mention a user and provide a valid amount." }, 'main_menu', footerMainMenu);
            }
            if (userBankInfo.bank < amount) {
                return sendReply("Insufficient funds.", 'receipt', { isError: true, title: "Transfer Failed", message: `Your balance is only ${formatKMB(userBankInfo.bank)}.` }, 'main_menu', footerMainMenu);
            }

            let recipientBankData = await getUserBankData(recipientId, db);
            userBankInfo.bank -= amount;
            recipientBankData.bank += amount;
            await updateUserBankData(event.senderID, userBankInfo, db);
            await updateUserBankData(recipientId, recipientBankData, db);

            await addTransaction(event.senderID, "Transfer", `Sent ${formatKMB(amount)} via ATM`, -amount, db);
            await addTransaction(recipientId, "Transfer", `Received ${formatKMB(amount)} via ATM`, amount, db);
            
            const recipientName = await usersData.getName(recipientId);
            sendReply("Transfer successful.", 'receipt', { isError: false, title: "Transfer Successful", message: `Transferred: ${formatKMB(amount)} to ${recipientName}\nNew Balance: ${formatKMB(userBankInfo.bank)}` }, 'main_menu', footerMainMenu);
        }
    },
    
    handleAiTalkReply: async function ({ event, message, Reply }) {
        try {
            const stockDataString = "Current Market Data: " + Object.entries(stockMarket).map(([symbol, data]) => `${symbol}: ${formatKMB(data.price)}`).join(', ');
            const updatedConversationPrompt = `${MILOW_AI_PROMPT}\n\n${stockDataString}\n\n---\n\n${Reply.conversation}\nUser: ${event.body}\nMilow:`;
            
            const aiResponse = await callGeminiAPI(updatedConversationPrompt);
            const newConversationState = `${Reply.conversation}\nUser: ${event.body}\nMilow: ${aiResponse}`;
            
            message.reply(aiResponse, (err, info) => {
                if (err) return;
                global.GoatBot.onReply.set(info.messageID, {
                    commandName: this.config.name,
                    author: event.senderID,
                    type: 'ai_talk',
                    conversation: newConversationState
                });
            });
        } catch (error) {
            message.reply("My apologies, the AI service is currently unavailable.");
        }
    },
    
    handlePinChangeReply: async function({ event, message, Reply }) {
        const db = await getDb();
        const userBankInfo = await getUserBankData(event.senderID, db);
        const userInput = event.body.trim();
        let { state } = Reply;
        
        const sendPinReply = (msg, nextStep) => {
            state.step = nextStep;
            message.reply(msg, (err, info) => {
                if (err) return;
                if (nextStep) global.GoatBot.onReply.set(info.messageID, {
                    commandName: this.config.name,
                    author: event.senderID,
                    type: 'pin_change',
                    state
                });
            });
        };
        
        if (state.step === 'awaiting_old_pin') {
            if (userInput !== userBankInfo.card.pin) {
                return message.reply("❌ Incorrect old PIN. Process terminated.");
            }
            sendPinReply("Old PIN verified. Please enter your new 4-digit PIN.", 'awaiting_new_pin');
        } else if (state.step === 'awaiting_new_pin') {
            if (!/^\d{4}$/.test(userInput)) {
                return sendPinReply("Invalid format. Your new PIN must be 4 digits. Please try again.", 'awaiting_new_pin');
            }
            state.newPin = userInput;
            sendPinReply("Please re-enter your new PIN to confirm.", 'awaiting_pin_confirmation');
        } else if (state.step === 'awaiting_pin_confirmation') {
            if (userInput !== state.newPin) {
                return message.reply("❌ PINs do not match. Process terminated.");
            }
            userBankInfo.card.pin = state.newPin;
            await updateUserBankData(event.senderID, userBankInfo, db);
            message.reply("✅ Your PIN has been successfully changed.");
        }
    },
    
    handlePhoneReply: async function({ event, message, Reply, usersData, api }) {
        const db = await getDb();
        let userBankInfo = await getUserBankData(event.senderID, db);
        const userInput = event.body.trim();
        let { state } = Reply;
        
        const renderPhone = async (newState, promptText) => {
            const attachment = await drawPhoneCanvas(newState, userBankInfo, usersData, event.threadID);
            const defaultPrompt = "Reply with 'home' to return, or 'exit'.";
            message.reply({ body: promptText || defaultPrompt, attachment }, (err, info) => {
                fs.unlink(attachment.path, ()=>{});
                if (err) return;
                newState.step = newState.screen;
                global.GoatBot.onReply.set(info.messageID, {
                    commandName: this.config.name,
                    author: event.senderID,
                    type: 'phone_flow',
                    state: newState
                });
            });
        };
        
        if (userInput.toLowerCase() === 'exit') {
            return message.reply("Phone closed.");
        }
        
        if (userInput.toLowerCase() === 'home') {
            return await renderPhone({ screen: 'home' }, "📱 Home Screen\nReply with an app name or number (1-8) to open.");
        }
        
        if (state.step === 'lockscreen') {
            return await renderPhone({ screen: 'home' }, "📱 Home Screen\nReply with an app name or number (1-8) to open.");
        }
        
        if (state.step === 'home') {
            const choice = userInput.toLowerCase();
            const appMap = {
                '1': 'milow_app', 'milow': 'milow_app', 'bank': 'milow_app',
                '2': 'call_log', 'call': 'call_log',
                '3': 'messages_list', 'messages': 'messages_list',
                '4': 'maps',
                '5': 'calculator',
                '6': 'calendar',
                '7': 'gallery_home', 'gallery': 'gallery_home',
                '8': 'settings'
            };
            const selectedScreen = appMap[choice];
            if (!selectedScreen) return;

            let prompt = "Reply 'home' to exit app.";
            if(selectedScreen === 'calculator') prompt = "Calculator. Reply with an equation (e.g. 5*8), 'C' to clear, or 'home'.";
            if(selectedScreen === 'settings') prompt = "Settings. Reply with a number (1-3), or 'home'.";
            
            return await renderPhone({ screen: selectedScreen, display: '0' }, prompt);
        }
        
        if (state.step === 'calculator') {
            if (userInput.toLowerCase() === 'c') {
                return await renderPhone({ screen: 'calculator', display: '0' }, "Calculator cleared. Enter a new equation.");
            }
            
            try {
                const result = safeEval(userInput);
                return await renderPhone({ screen: 'calculator', display: String(result) });
            } catch (e) {
                return await renderPhone({ screen: 'calculator', display: 'Error' });
            }
        }
        
        if (state.step === 'settings') {
            const choice = parseInt(userInput);
            if(choice === 3) {
                return await renderPhone({ screen: 'change_wallpaper'}, "Please reply with an image attachment to set as your new wallpaper.");
            }
        }
        
        if (state.step === 'change_wallpaper') {
            if (event.attachments.length > 0 && event.attachments[0].type === 'photo') {
                userBankInfo.wallpaperUrl = event.attachments[0].url;
                await updateUserBankData(event.senderID, userBankInfo, db);
                message.reply("✅ Wallpaper successfully changed!");
                return await renderPhone({ screen: 'home' }); // Go back home after changing
            } else {
                return message.reply("That is not a valid image. Please reply with a photo.");
            }
        }
    },
    
    onStart: async function ({ args, message, event, api, usersData }) {
        const prefix = global.utils.getPrefix(event.threadID) || ".";
        const senderID = String(event.senderID);
        const db = await getDb();
        let userBankInfo = await getUserBankData(senderID, db);
        let userCash = await usersData.get(senderID, "money") || 0;
        const command = args[0]?.toLowerCase();
        
        const mainGuide = toBoldUnicode("🏦 Milow Bank Main Menu 🏦\n\n") + 
            `Use '${prefix}bank help <category>' for more info.\n` + 
            `Example: ${prefix}bank help account\n\n` +
            "𝗖𝗔𝗧𝗘𝗚𝗢𝗥𝗜𝗘𝗦:\n" +
            "» account\n" +
            "» atm\n" +
            "» assets\n" +
            "» market\n" +
            "» tools\n" +
            "» ai\n" +
            "» phone";
        
        // Loan overdue check
        if (userBankInfo.loan.amount > 0 && userBankInfo.loan.dueDate && new Date() > new Date(userBankInfo.loan.dueDate)) {
            const now = new Date();
            const twoHours = 2 * 60 * 60 * 1000;
            if (!userBankInfo.lastLoanWarning || (now - new Date(userBankInfo.lastLoanWarning) > twoHours)) {
                message.reply(`🚨 Loan Payment Overdue!\nYour loan of ${formatKMB(userBankInfo.loan.amount)} is past its due date. Late payments may negatively affect your credit score. Use '${prefix}bank payloan' to make a payment.`);
                userBankInfo.lastLoanWarning = now;
                await updateUserBankData(senderID, userBankInfo, db);
            }
        }
        
        if (!command || command === 'help' || command === 'guide') {
            const helpCategory = args[1]?.toLowerCase();
            const categories = {
                'account': `👤 𝗔𝗖𝗖𝗢𝗨𝗡𝗧 & 𝗗𝗔𝗜𝗟𝗬\n\`${prefix}bank daily\`: Claim daily reward\n\`${prefix}bank balance [@mention]\`: Check balance\n\`${prefix}bank report [@mention]\`: View a financial report\n\`${prefix}bank tier\`: Check your financial tier & perks\n\`${prefix}bank interest\`: Claim interest on your bank balance\n\`${prefix}bank credit_score\`: Check your credit score`,
                'atm': `💳 𝗖𝗔𝗥𝗗 & 𝗔𝗧𝗠\n\`${prefix}bank create_card\`: Create your bank card\n\`${prefix}bank card\`: View your debit card\n\`${prefix}bank atm\`: Access the interactive ATM\n\`${prefix}bank change_pin\`: Change your card's PIN\n\`${prefix}bank reset_pin\`: Start the PIN reset process`,
                'assets': `🏘️ 𝗔𝗦𝗦𝗘𝗧 𝗠𝗔𝗡𝗔𝗚𝗘𝗠𝗘𝗡𝗧\n\`${prefix}bank property list/buy/sell/portfolio\`: Manage properties\n\`${prefix}bank business list/buy/portfolio/collect\`: Manage businesses\n\`${prefix}bank insurance list/buy/status\`: Manage insurance`,
                'market': `💹 𝗠𝗔𝗥𝗞𝗘𝗧 & 𝗧𝗥𝗔𝗗𝗜𝗡𝗚\n\`${prefix}bank stock market/price/buy/sell/portfolio/chart\`: Stock trading\n\`${prefix}bank invest list/buy/claim/sell/portfolio\`: Long-term investments\n\`${prefix}bank market list/sell/buy\`: Player-to-player property market\n\`${prefix}bank ipo status/buy\`: Participate in IPOs`,
                'tools': `🛠️ 𝗙𝗜𝗡𝗔𝗡𝗖𝗜𝗔𝗟 𝗧𝗢𝗢𝗟𝗦\n\`${prefix}bank deposit <amount>\`\n\`${prefix}bank withdraw <amount> <pin>\`\n\`${prefix}bank transfer <@mention> <amount> <pin>\`\n\`${prefix}bank loan <amount>\`\n\`${prefix}bank payloan <amount> <pin>\`\n\`${prefix}bank cheque write/cash/list\``,
                'ai': `🤖 𝗔𝗜 & 𝗘𝗩𝗘𝗡𝗧𝗦\n\`${prefix}bank talk <message>\`: Chat with the AI, Milow\n\`${prefix}bank suggest\`: Get AI stock suggestions\n\`${prefix}bank news\`: Get AI market news\n\`${prefix}bank event_status\`: Check for active market events`,
                'phone': `📱 𝗣𝗛𝗢𝗡𝗘 𝗦𝗘𝗥𝗩𝗜𝗖𝗘𝗦\n\`${prefix}bank phone\`: Open your phone interface\n\`${prefix}bank message <@mention/ID> <message>\`: Send a message\n\`${prefix}bank call <@mention/ID>\`: Make a call`
            };
            
            if (helpCategory && categories[helpCategory]) {
                return message.reply(toBoldUnicode(categories[helpCategory]));
            }
            return message.reply(mainGuide);
        }
        
        // --- PIN Verification for Sensitive Commands ---
        const commandString = args.join(" ").toLowerCase();
        let pinSensitiveCommands = ["withdraw", "transfer", "payloan", "cheque write", "invest buy", "invest sell", "stock sell", "property sell", "market sell", "business buy", "change_pin"];
        let isSensitive = pinSensitiveCommands.some(cmd => commandString.startsWith(cmd));
        
        if (isSensitive && userBankInfo.card && userBankInfo.card.pin) {
            const providedPin = args[args.length - 1];
            if (!/^\d{4}$/.test(providedPin) || providedPin !== userBankInfo.card.pin) {
                return message.reply(toBoldUnicode(`🔒 This action requires your 4-digit PIN. Please append it to the end of the command.`));
            }
            args.pop(); // Remove PIN from args after verification
        }
        
        // --- Command Router ---
        switch (command) {
            // Account
            case "daily":
            case "balance":
            case "report":
            case "tier":
            case "credit_score":
            case "interest": {
                // New interest command logic
                if (command === "interest") {
                    const now = new Date();
                    const lastClaimed = new Date(userBankInfo.lastInterestClaimed);
                    const hoursPassed = (now - lastClaimed) / 36e5;
                    
                    if (hoursPassed < 24) {
                        return message.reply(`You can claim interest once every 24 hours. Please wait a bit longer.`);
                    }

                    const netWorth = userBankInfo.bank + userCash;
                    const perks = getTierPerks(netWorth);
                    const dailyRate = BASE_INTEREST_RATE_ANNUAL / 365;
                    const bonusRate = perks.interestBonus / 365;
                    const totalDailyRate = dailyRate + bonusRate;
                    
                    const daysPassed = hoursPassed / 24;
                    const interestEarned = Math.floor(userBankInfo.bank * totalDailyRate * daysPassed);

                    if (interestEarned <= 0) {
                        return message.reply("You have no interest to claim at the moment. Your bank balance might be too low or not enough time has passed.");
                    }

                    userBankInfo.bank += interestEarned;
                    userBankInfo.lastInterestClaimed = now;
                    await updateUserBankData(senderID, userBankInfo, db);
                    await addTransaction(senderID, "Interest", `Claimed daily interest`, interestEarned, db);

                    return message.reply(`💰 You've earned ${formatKMB(interestEarned)} in interest! Your new bank balance is ${formatKMB(userBankInfo.bank)}.`);
                }
                
                // Other account commands
                let targetId = senderID;
                if (Object.keys(event.mentions).length > 0) targetId = Object.keys(event.mentions)[0];
                else if (event.type === "message_reply") targetId = event.messageReply.senderID;

                const targetBankData = await getUserBankData(targetId, db);
                const targetCash = await usersData.get(targetId, "money") || 0;
                const targetName = await usersData.getName(targetId);
                const netWorth = targetBankData.bank + targetCash;
                
                if(command === 'balance') return message.reply(toBoldUnicode(`📊 ${(targetId === senderID ? "Your" : `${targetName}'s`)} Financial Overview 📊\n\n💵 Cash: ${formatKMB(targetCash)}\n🏦 Bank: ${formatKMB(targetBankData.bank)}`));
                if(command === 'report') {
                     const attachment = await drawFinancialReportCanvas(targetBankData, usersData, targetId);
                     return message.reply({ body: `Here is the financial report.`, attachment }, () => fs.unlink(attachment.path, ()=>{}));
                }
                if(command === 'tier') {
                    const perks = getTierPerks(netWorth);
                    return message.reply(`Your current net worth of ${formatKMB(netWorth)} places you in the ${perks.tier} tier.\n\nPerks:\n- Transaction Fee Reduction: ${(1 - perks.feeModifier) * 100}%\n- Interest Rate Bonus: +${perks.interestBonus * 100}%`);
                }
                if(command === 'credit_score') {
                    const score = await calculateCreditScore(targetBankData, targetCash);
                    if (targetBankData.creditScore !== score) { // Update if score changed
                         targetBankData.creditScore = score;
                         await updateUserBankData(targetId, targetBankData, db);
                    }
                    return message.reply(`Your current estimated credit score is ${score}.`);
                }
                if(command === 'daily') {
                    const lastClaim = userBankInfo.lastDailyClaimed ? new Date(userBankInfo.lastDailyClaimed) : null;
                    const now = new Date();
                    if (lastClaim && now.toDateString() === lastClaim.toDateString()) {
                        return message.reply("You have already claimed your daily reward today. Come back tomorrow!");
                    }
                    const dailyAmount = 1000 + (userBankInfo.creditScore * 2);
                    userBankInfo.bank += dailyAmount;
                    userBankInfo.lastDailyClaimed = now;
                    await updateUserBankData(senderID, userBankInfo, db);
                    return message.reply(`You claimed your daily reward of ${formatKMB(dailyAmount)}!`);
                }
                break;
            }

            // ATM & Card
            case "create_card":
            case "atm":
            case "card":
            case "change_pin": {
                if (!userBankInfo.card.number && command !== 'create_card') {
                    return message.reply(`You need a Milow Bank card first. Create one with: ${prefix}bank create_card`);
                }
                if (command === 'create_card') {
                    if (userBankInfo.card && userBankInfo.card.number) return message.reply(`You already have a Milow Bank card.`);
                    message.reply("Please reply with a 4-digit PIN for your new ATM card.", (err, info) => {
                        if (err) return;
                        global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: event.senderID, type: 'card_creation' });
                    });
                }
                if (command === 'atm') {
                    message.reply("Welcome to the Milow Bank ATM. Please reply with your 4-digit PIN.", (err, info) => {
                        if (err) return;
                        global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: event.senderID, type: 'atm_flow', state: { step: 'awaiting_pin' } });
                    });
                }
                if (command === 'card') {
                    const attachment = await drawPhoneCanvas({ screen: 'milow_app' }, userBankInfo, usersData, event.threadID);
                    return message.reply({body: "💳 Here is your Milow Bank Debit Card.", attachment}, ()=>fs.unlink(attachment.path, ()=>{}));
                }
                 if (command === 'change_pin') {
                    message.reply("For security, please reply with your OLD 4-digit PIN.", (err, info) => {
                        if (err) return;
                        global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: event.senderID, type: 'pin_change', state: { step: 'awaiting_old_pin' } });
                    });
                }
                return;
            }

            // Phone
            case "phone":
            case "message":
            case "call": {
                 if (!userBankInfo.card.number) {
                    return message.reply(`You need to set up a bank account and card to use the phone service. Use: ${prefix}bank create_card`);
                }
                if (command === 'phone') {
                    const attachment = await drawPhoneCanvas({ screen: 'lockscreen' }, userBankInfo, usersData, event.threadID);
                    message.reply({body: "📱 Phone locked. Reply to unlock.", attachment}, (err, info) => {
                        fs.unlink(attachment.path, ()=>{});
                        if(err) return;
                        global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: event.senderID, type: 'phone_flow', state: { step: 'lockscreen' } });
                    });
                }
                // message & call logic here...
                return;
            }
            
            // AI
            case "talk":
            case "suggest":
            case "news": {
                if (command === 'talk') {
                    const userMessage = args.slice(1).join(" ");
                    if (!userMessage) return message.reply(`Please provide a message to Milow.\nExample: ${prefix}bank talk Tell me about my account.`);
                    
                    try {
                        const stockDataString = "Current Market Data: " + Object.entries(stockMarket).map(([symbol, data]) => `${symbol}: ${formatKMB(data.price)}`).join(', ');
                        const initialPrompt = `${MILOW_AI_PROMPT}\n\n${stockDataString}\n\n---\n\nConversation Start:\n\nUser: ${userMessage}\nMilow:`;
                        
                        const aiResponse = await callGeminiAPI(initialPrompt);
                        const conversationState = `User: ${userMessage}\nMilow: ${aiResponse}`;
                        
                        return message.reply(aiResponse, (err, info) => {
                            if (err) return;
                            global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: event.senderID, type: 'ai_talk', conversation: conversationState });
                        });
                    } catch (error) {
                        return message.reply("The AI Manager service is currently unavailable.");
                    }
                }
                // suggest & news logic here...
                return;
            }
            
            // Tools
            case "deposit":
            case "withdraw":
            case "transfer": {
                if(command === 'deposit') {
                    const amount = parseFloat(args[1]);
                    if (isNaN(amount) || amount <= 0) return message.reply(`Invalid amount.`);
                    if (amount > userCash) return message.reply(`Insufficient cash. You only have ${formatKMB(userCash)}.`);
                    
                    await usersData.set(senderID, { money: userCash - amount });
                    userBankInfo.bank += amount;
                    await updateUserBankData(senderID, userBankInfo, db);
                    await logAudit(db, "DEPOSIT", event, { amount });
                    
                    return message.reply(`✅ Deposited ${formatKMB(amount)}.`);
                }
                if(command === 'withdraw') {
                     if (!userBankInfo.card.number) return message.reply(`You need a card for this action.`);
                    const amount = parseFloat(args[1]);
                    if (isNaN(amount) || amount <= 0) return message.reply(`Invalid amount.`);
                    if (amount > userBankInfo.bank) return message.reply(`Insufficient bank funds.`);
                    
                    userBankInfo.bank -= amount;
                    await usersData.set(senderID, { money: userCash + amount });
                    await updateUserBankData(senderID, userBankInfo, db);
                    await logAudit(db, "WITHDRAW", event, { amount });
                    
                    return message.reply(`✅ Withdrew ${formatKMB(amount)}.`);
                }
                if(command === 'transfer') {
                     if (!userBankInfo.card.number) return message.reply(`You need a card for this action.`);
                    let recipientId = Object.keys(event.mentions)[0] || args[1];
                    const transferAmount = parseFloat(args[2]);
                    
                    if (!recipientId || isNaN(transferAmount) || transferAmount <= 0) return message.reply(`Invalid format.`);
                    if (String(recipientId) === senderID) return message.reply("Cannot transfer to yourself.");
                    if (transferAmount > userBankInfo.bank) return message.reply(`Insufficient bank balance.`);
                    
                    let recipientBankData = await getUserBankData(String(recipientId), db);
                    
                    userBankInfo.bank -= transferAmount;
                    recipientBankData.bank += transferAmount;
                    
                    await updateUserBankData(senderID, userBankInfo, db);
                    await updateUserBankData(String(recipientId), recipientBankData, db);
                    
                    const recipientName = await usersData.getName(String(recipientId)) || `User ${recipientId}`;
                    await logAudit(db, "TRANSFER", event, { to: String(recipientId), amount: transferAmount });
                    
                    return message.reply(`✅ Transferred ${formatKMB(transferAmount)} to ${recipientName}.`);
                }
                break;
            }

            // Market
            case "stock": {
                const stockAction = args[1]?.toLowerCase();
                if (!stockAction) return message.reply(`Please specify a stock action. Example: ${prefix}bank stock market`);
                
                if (stockAction === 'market') {
                    const page = parseInt(args[2]) || 1;
                    const attachment = await drawStockMarketCanvas(page);
                    return message.reply({ body: `Use '${prefix}bank stock market [page_number]' to navigate.`, attachment }, () => fs.unlink(attachment.path, ()=>{}));
                }
                
                if (stockAction === 'portfolio') {
                     let targetId = senderID;
                     if (Object.keys(event.mentions).length > 0) targetId = Object.keys(event.mentions)[0];
                     const targetData = await getUserBankData(targetId, db);
                     
                    const attachment = await drawStockPortfolioCanvas(targetData, usersData, targetId);
                    if (!attachment) return message.reply("This user's stock portfolio is empty.");
                    return message.reply({ attachment }, () => fs.unlink(attachment.path, ()=>{}));
                }
                //... other stock actions (buy, sell, etc.)
                break;
            }
            
            // Assets
            case "business":
            case "property": {
                 // business logic...
                 break;
            }

            default:
                message.reply(`Unknown command. Use '${prefix}bank help' to see the list of available commands.`);
        }
    }
};
