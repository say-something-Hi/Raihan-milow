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
    score += Math.min(150, Math.floor(netWorth / 10000));      // Net worth bonus
    score += 25 * (userData.loan.history.repaid || 0);         // Loan repayment history
    if (userData.loan.amount > 0) score -= 50;                 // Active loan penalty
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
    accent: '#0081A7',  // Darker Blue
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

    const
