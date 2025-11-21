const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');

// 25 Themes Collection with Deep Colors - All primary colors changed to deep pinky
const THEMES = {
    // Deep Water Themes
    DEEP_AQUA: {
        name: "Deep Aqua",
        background: ['#0a192f', '#112240', '#1d3a5c'],
        accents: {
            primary: '#e91e63', // Changed to deep pinky
            secondary: '#00b4d8',
            tertiary: '#0077b6',
            quaternary: '#90e0ef'
        },
        text: {
            primary: '#e6f1ff',
            secondary: '#a8b2d1',
            accent: '#e91e63', // Changed to deep pinky
            muted: '#495670'
        },
        glow: {
            primary: 'rgba(233, 30, 99, 0.4)', // Changed to deep pinky
            secondary: 'rgba(0, 180, 216, 0.3)',
            tertiary: 'rgba(0, 119, 182, 0.3)'
        },
        cards: 'rgba(17, 34, 64, 0.9)',
        cardBorder: 'rgba(233, 30, 99, 0.2)' // Changed to deep pinky
    },
    ABYSSAL: {
        name: "Abyssal Deep",
        background: ['#000814', '#001d3d', '#003566'],
        accents: {
            primary: '#e91e63', // Changed to deep pinky
            secondary: '#ffc300',
            tertiary: '#ffaa00',
            quaternary: '#ff9500'
        },
        text: {
            primary: '#f8f9fa',
            secondary: '#e9ecef',
            accent: '#e91e63', // Changed to deep pinky
            muted: '#adb5bd'
        },
        glow: {
            primary: 'rgba(233, 30, 99, 0.4)', // Changed to deep pinky
            secondary: 'rgba(255, 195, 0, 0.3)',
            tertiary: 'rgba(255, 170, 0, 0.3)'
        },
        cards: 'rgba(0, 29, 61, 0.9)',
        cardBorder: 'rgba(233, 30, 99, 0.2)' // Changed to deep pinky
    },
    OCEAN_MIDNIGHT: {
        name: "Ocean Midnight",
        background: ['#03045e', '#023e8a', '#0077b6'],
        accents: {
            primary: '#e91e63', // Changed to deep pinky
            secondary: '#90e0ef',
            tertiary: '#caf0f8',
            quaternary: '#48cae4'
        },
        text: {
            primary: '#ffffff',
            secondary: '#caf0f8',
            accent: '#e91e63', // Changed to deep pinky
            muted: '#90e0ef'
        },
        glow: {
            primary: 'rgba(233, 30, 99, 0.4)', // Changed to deep pinky
            secondary: 'rgba(144, 224, 239, 0.3)',
            tertiary: 'rgba(202, 240, 248, 0.3)'
        },
        cards: 'rgba(2, 62, 138, 0.9)',
        cardBorder: 'rgba(233, 30, 99, 0.2)' // Changed to deep pinky
    },
    MARINE_BLUE: {
        name: "Marine Blue",
        background: ['#1a237e', '#283593', '#303f9f'],
        accents: {
            primary: '#e91e63', // Changed to deep pinky
            secondary: '#3d5afe',
            tertiary: '#304ffe',
            quaternary: '#7c4dff'
        },
        text: {
            primary: '#e8eaf6',
            secondary: '#c5cae9',
            accent: '#e91e63', // Changed to deep pinky
            muted: '#9fa8da'
        },
        glow: {
            primary: 'rgba(233, 30, 99, 0.4)', // Changed to deep pinky
            secondary: 'rgba(61, 90, 254, 0.3)',
            tertiary: 'rgba(48, 79, 254, 0.3)'
        },
        cards: 'rgba(40, 53, 147, 0.9)',
        cardBorder: 'rgba(233, 30, 99, 0.2)' // Changed to deep pinky
    },
    DEEP_SEA: {
        name: "Deep Sea",
        background: ['#004d40', '#00695c', '#00796b'],
        accents: {
            primary: '#e91e63', // Changed to deep pinky
            secondary: '#4db6ac',
            tertiary: '#80cbc4',
            quaternary: '#b2dfdb'
        },
        text: {
            primary: '#e0f2f1',
            secondary: '#b2dfdb',
            accent: '#e91e63', // Changed to deep pinky
            muted: '#80cbc4'
        },
        glow: {
            primary: 'rgba(233, 30, 99, 0.4)', // Changed to deep pinky
            secondary: 'rgba(77, 182, 172, 0.3)',
            tertiary: 'rgba(128, 203, 196, 0.3)'
        },
        cards: 'rgba(0, 105, 92, 0.9)',
        cardBorder: 'rgba(233, 30, 99, 0.2)' // Changed to deep pinky
    },

    // Nature Themes
    FOREST_DEEP: {
        name: "Deep Forest",
        background: ['#1b4332', '#2d6a4f', '#40916c'],
        accents: {
            primary: '#e91e63', // Changed to deep pinky
            secondary: '#74c69d',
            tertiary: '#95d5b2',
            quaternary: '#b7e4c7'
        },
        text: {
            primary: '#d8f3dc',
            secondary: '#b7e4c7',
            accent: '#e91e63', // Changed to deep pinky
            muted: '#95d5b2'
        },
        glow: {
            primary: 'rgba(233, 30, 99, 0.4)', // Changed to deep pinky
            secondary: 'rgba(116, 198, 157, 0.3)',
            tertiary: 'rgba(149, 213, 178, 0.3)'
        },
        cards: 'rgba(45, 106, 79, 0.9)',
        cardBorder: 'rgba(233, 30, 99, 0.2)' // Changed to deep pinky
    },
    VOLCANIC: {
        name: "Volcanic Fire",
        background: ['#370617', '#6a040f', '#9d0208'],
        accents: {
            primary: '#e91e63', // Changed to deep pinky
            secondary: '#e85d04',
            tertiary: '#f48c06',
            quaternary: '#faa307'
        },
        text: {
            primary: '#fff1e6',
            secondary: '#ffd7ba',
            accent: '#e91e63', // Changed to deep pinky
            muted: '#f48c06'
        },
        glow: {
            primary: 'rgba(233, 30, 99, 0.4)', // Changed to deep pinky
            secondary: 'rgba(232, 93, 4, 0.3)',
            tertiary: 'rgba(244, 140, 6, 0.3)'
        },
        cards: 'rgba(106, 4, 15, 0.9)',
        cardBorder: 'rgba(233, 30, 99, 0.2)' // Changed to deep pinky
    },
    SUNSET: {
        name: "Golden Sunset",
        background: ['#ff6b35', '#f8961e', '#f9c74f'],
        accents: {
            primary: '#e91e63', // Changed to deep pinky
            secondary: '#f3722c',
            tertiary: '#f8961e',
            quaternary: '#f9844a'
        },
        text: {
            primary: '#fffcf2',
            secondary: '#fff1e6',
            accent: '#e91e63', // Changed to deep pinky
            muted: '#f9c74f'
        },
        glow: {
            primary: 'rgba(233, 30, 99, 0.4)', // Changed to deep pinky
            secondary: 'rgba(243, 114, 44, 0.3)',
            tertiary: 'rgba(248, 150, 30, 0.3)'
        },
        cards: 'rgba(248, 150, 30, 0.8)',
        cardBorder: 'rgba(233, 30, 99, 0.2)' // Changed to deep pinky
    },
    AURORA: {
        name: "Northern Aurora",
        background: ['#0b3d91', '#1e6f5c', '#289672'],
        accents: {
            primary: '#e91e63', // Changed to deep pinky
            secondary: '#40c463',
            tertiary: '#6fcf97',
            quaternary: '#b7efc5'
        },
        text: {
            primary: '#e8f5e8',
            secondary: '#c8e6c9',
            accent: '#e91e63', // Changed to deep pinky
            muted: '#6fcf97'
        },
        glow: {
            primary: 'rgba(233, 30, 99, 0.4)', // Changed to deep pinky
            secondary: 'rgba(64, 196, 99, 0.3)',
            tertiary: 'rgba(111, 207, 151, 0.3)'
        },
        cards: 'rgba(30, 111, 92, 0.9)',
        cardBorder: 'rgba(233, 30, 99, 0.2)' // Changed to deep pinky
    },

    // Royal & Luxury Themes
    ROYAL_PURPLE: {
        name: "Royal Purple",
        background: ['#240046', '#3c096c', '#5a189a'],
        accents: {
            primary: '#e91e63', // Changed to deep pinky
            secondary: '#9d4edd',
            tertiary: '#c77dff',
            quaternary: '#e0aaff'
        },
        text: {
            primary: '#f8f7ff',
            secondary: '#e0aaff',
            accent: '#e91e63', // Changed to deep pinky
            muted: '#c77dff'
        },
        glow: {
            primary: 'rgba(233, 30, 99, 0.4)', // Changed to deep pinky
            secondary: 'rgba(157, 78, 221, 0.3)',
            tertiary: 'rgba(199, 125, 255, 0.3)'
        },
        cards: 'rgba(60, 9, 108, 0.9)',
        cardBorder: 'rgba(233, 30, 99, 0.2)' // Changed to deep pinky
    },
    GOLDEN: {
        name: "Golden Luxury",
        background: ['#b8860b', '#daa520', '#ffd700'],
        accents: {
            primary: '#e91e63', // Changed to deep pinky
            secondary: '#fff9c4',
            tertiary: '#fffde7',
            quaternary: '#f9fbe7'
        },
        text: {
            primary: '#3e2723',
            secondary: '#5d4037',
            accent: '#e91e63', // Changed to deep pinky
            muted: '#8d6e63'
        },
        glow: {
            primary: 'rgba(233, 30, 99, 0.4)', // Changed to deep pinky
            secondary: 'rgba(255, 249, 196, 0.3)',
            tertiary: 'rgba(255, 253, 231, 0.3)'
        },
        cards: 'rgba(218, 165, 32, 0.8)',
        cardBorder: 'rgba(233, 30, 99, 0.2)' // Changed to deep pinky
    },
    DIAMOND: {
        name: "Diamond White",
        background: ['#b0bec5', '#cfd8dc', '#eceff1'],
        accents: {
            primary: '#e91e63', // Changed to deep pinky
            secondary: '#455a64',
            tertiary: '#546e7a',
            quaternary: '#78909c'
        },
        text: {
            primary: '#263238',
            secondary: '#37474f',
            accent: '#e91e63', // Changed to deep pinky
            muted: '#78909c'
        },
        glow: {
            primary: 'rgba(233, 30, 99, 0.4)', // Changed to deep pinky
            secondary: 'rgba(69, 90, 100, 0.3)',
            tertiary: 'rgba(84, 110, 122, 0.3)'
        },
        cards: 'rgba(207, 216, 220, 0.9)',
        cardBorder: 'rgba(233, 30, 99, 0.2)' // Changed to deep pinky
    },

    // Modern & Tech Themes
    CYBERPUNK: {
        name: "Cyberpunk",
        background: ['#1a1a2e', '#16213e', '#0f3460'],
        accents: {
            primary: '#e91e63', // Changed to deep pinky
            secondary: '#f05945',
            tertiary: '#ff7b54',
            quaternary: '#ffb26b'
        },
        text: {
            primary: '#f1f1f1',
            secondary: '#d1d1d1',
            accent: '#e91e63', // Changed to deep pinky
            muted: '#ff7b54'
        },
        glow: {
            primary: 'rgba(233, 30, 99, 0.4)', // Changed to deep pinky
            secondary: 'rgba(240, 89, 69, 0.3)',
            tertiary: 'rgba(255, 123, 84, 0.3)'
        },
        cards: 'rgba(22, 33, 62, 0.9)',
        cardBorder: 'rgba(233, 30, 99, 0.2)' // Changed to deep pinky
    },
    NEON: {
        name: "Neon Dreams",
        background: ['#10002b', '#240046', '#3c096c'],
        accents: {
            primary: '#e91e63', // Changed to deep pinky
            secondary: '#c77dff',
            tertiary: '#e0aaff',
            quaternary: '#ff6bff'
        },
        text: {
            primary: '#ffffff',
            secondary: '#e0aaff',
            accent: '#e91e63', // Changed to deep pinky
            muted: '#c77dff'
        },
        glow: {
            primary: 'rgba(233, 30, 99, 0.4)', // Changed to deep pinky
            secondary: 'rgba(199, 125, 255, 0.3)',
            tertiary: 'rgba(224, 170, 255, 0.3)'
        },
        cards: 'rgba(36, 0, 70, 0.9)',
        cardBorder: 'rgba(233, 30, 99, 0.2)' // Changed to deep pinky
    },
    MATRIX: {
        name: "The Matrix",
        background: ['#003b00', '#006400', '#008000'],
        accents: {
            primary: '#e91e63', // Changed to deep pinky
            secondary: '#32cd32',
            tertiary: '#7cfc00',
            quaternary: '#adff2f'
        },
        text: {
            primary: '#e91e63', // Changed to deep pinky
            secondary: '#32cd32',
            accent: '#e91e63', // Changed to deep pinky
            muted: '#7cfc00'
        },
        glow: {
            primary: 'rgba(233, 30, 99, 0.4)', // Changed to deep pinky
            secondary: 'rgba(50, 205, 50, 0.3)',
            tertiary: 'rgba(124, 252, 0, 0.3)'
        },
        cards: 'rgba(0, 100, 0, 0.9)',
        cardBorder: 'rgba(233, 30, 99, 0.2)' // Changed to deep pinky
    },

    // Pastel Themes
    PASTEL_DREAM: {
        name: "Pastel Dream",
        background: ['#ffafcc', '#ffc8dd', '#ffd6ff'],
        accents: {
            primary: '#e91e63', // Changed to deep pinky
            secondary: '#ffc8dd',
            tertiary: '#ffafcc',
            quaternary: '#bde0fe'
        },
        text: {
            primary: '#6d6875',
            secondary: '#8d8992',
            accent: '#e91e63', // Changed to deep pinky
            muted: '#b8b2be'
        },
        glow: {
            primary: 'rgba(233, 30, 99, 0.4)', // Changed to deep pinky
            secondary: 'rgba(255, 200, 221, 0.3)',
            tertiary: 'rgba(255, 175, 204, 0.3)'
        },
        cards: 'rgba(255, 200, 221, 0.8)',
        cardBorder: 'rgba(233, 30, 99, 0.2)' // Changed to deep pinky
    },
    COTTON_CANDY: {
        name: "Cotton Candy",
        background: ['#ff9ff3', '#feca57', '#ff6b6b'],
        accents: {
            primary: '#e91e63', // Changed to deep pinky
            secondary: '#1dd1a1',
            tertiary: '#00d2d3',
            quaternary: '#54a0ff'
        },
        text: {
            primary: '#576574',
            secondary: '#8395a7',
            accent: '#e91e63', // Changed to deep pinky
            muted: '#c8d6e5'
        },
        glow: {
            primary: 'rgba(233, 30, 99, 0.4)', // Changed to deep pinky
            secondary: 'rgba(29, 209, 161, 0.3)',
            tertiary: 'rgba(0, 210, 211, 0.3)'
        },
        cards: 'rgba(255, 255, 255, 0.8)',
        cardBorder: 'rgba(233, 30, 99, 0.2)' // Changed to deep pinky
    },

    // Seasonal Themes
    WINTER: {
        name: "Winter Frost",
        background: ['#caf0f8', '#ade8f4', '#90e0ef'],
        accents: {
            primary: '#e91e63', // Changed to deep pinky
            secondary: '#0096c7',
            tertiary: '#00b4d8',
            quaternary: '#48cae4'
        },
        text: {
            primary: '#03045e',
            secondary: '#023e8a',
            accent: '#e91e63', // Changed to deep pinky
            muted: '#0096c7'
        },
        glow: {
            primary: 'rgba(233, 30, 99, 0.4)', // Changed to deep pinky
            secondary: 'rgba(0, 150, 199, 0.3)',
            tertiary: 'rgba(0, 180, 216, 0.3)'
        },
        cards: 'rgba(255, 255, 255, 0.9)',
        cardBorder: 'rgba(233, 30, 99, 0.2)' // Changed to deep pinky
    },
    AUTUMN: {
        name: "Autumn Leaves",
        background: ['#dda15e', '#bc6c25', '#8d5a2a'],
        accents: {
            primary: '#e91e63', // Changed to deep pinky
            secondary: '#283618',
            tertiary: '#bc6c25',
            quaternary: '#dda15e'
        },
        text: {
            primary: '#fefae0',
            secondary: '#faedcd',
            accent: '#e91e63', // Changed to deep pinky
            muted: '#dda15e'
        },
        glow: {
            primary: 'rgba(233, 30, 99, 0.4)', // Changed to deep pinky
            secondary: 'rgba(40, 54, 24, 0.3)',
            tertiary: 'rgba(188, 108, 37, 0.3)'
        },
        cards: 'rgba(188, 108, 37, 0.8)',
        cardBorder: 'rgba(233, 30, 99, 0.2)' // Changed to deep pinky
    },
    SPRING: {
        name: "Spring Blossom",
        background: ['#ffafcc', '#a2d2ff', '#bde0fe'],
        accents: {
            primary: '#e91e63', // Changed to deep pinky
            secondary: '#ffc8dd',
            tertiary: '#ffafcc',
            quaternary: '#bde0fe'
        },
        text: {
            primary: '#6d6875',
            secondary: '#8d8992',
            accent: '#e91e63', // Changed to deep pinky
            muted: '#b8b2be'
        },
        glow: {
            primary: 'rgba(233, 30, 99, 0.4)', // Changed to deep pinky
            secondary: 'rgba(255, 200, 221, 0.3)',
            tertiary: 'rgba(255, 175, 204, 0.3)'
        },
        cards: 'rgba(255, 255, 255, 0.8)',
        cardBorder: 'rgba(233, 30, 99, 0.2)' // Changed to deep pinky
    },

    // Special Themes
    GALAXY: {
        name: "Galaxy Night",
        background: ['#0d0221', '#0f084b', '#26408b'],
        accents: {
            primary: '#e91e63', // Changed to deep pinky
            secondary: '#c2e7d9',
            tertiary: '#f6e6d6',
            quaternary: '#f8c8c6'
        },
        text: {
            primary: '#ffffff',
            secondary: '#e0e0e0',
            accent: '#e91e63', // Changed to deep pinky
            muted: '#c2e7d9'
        },
        glow: {
            primary: 'rgba(233, 30, 99, 0.4)', // Changed to deep pinky
            secondary: 'rgba(194, 231, 217, 0.3)',
            tertiary: 'rgba(246, 230, 214, 0.3)'
        },
        cards: 'rgba(15, 8, 75, 0.9)',
        cardBorder: 'rgba(233, 30, 99, 0.2)' // Changed to deep pinky
    },
    MIDNIGHT: {
        name: "Midnight City",
        background: ['#2d3047', '#419d78', '#e0a458'],
        accents: {
            primary: '#e91e63', // Changed to deep pinky
            secondary: '#06d6a0',
            tertiary: '#118ab2',
            quaternary: '#ef476f'
        },
        text: {
            primary: '#ffffff',
            secondary: '#e0e0e0',
            accent: '#e91e63', // Changed to deep pinky
            muted: '#06d6a0'
        },
        glow: {
            primary: 'rgba(233, 30, 99, 0.4)', // Changed to deep pinky
            secondary: 'rgba(6, 214, 160, 0.3)',
            tertiary: 'rgba(17, 138, 178, 0.3)'
        },
        cards: 'rgba(45, 48, 71, 0.9)',
        cardBorder: 'rgba(233, 30, 99, 0.2)' // Changed to deep pinky
    },
    CANDY: {
        name: "Candy Land",
        background: ['#ff6b6b', '#ff9e6d', '#ffb88c'],
        accents: {
            primary: '#e91e63', // Changed to deep pinky
            secondary: '#45b7d1',
            tertiary: '#96ceb4',
            quaternary: '#feca57'
        },
        text: {
            primary: '#ffffff',
            secondary: '#ffeaa7',
            accent: '#e91e63', // Changed to deep pinky
            muted: '#45b7d1'
        },
        glow: {
            primary: 'rgba(233, 30, 99, 0.4)', // Changed to deep pinky
            secondary: 'rgba(69, 183, 209, 0.3)',
            tertiary: 'rgba(150, 206, 180, 0.3)'
        },
        cards: 'rgba(255, 255, 255, 0.8)',
        cardBorder: 'rgba(233, 30, 99, 0.2)' // Changed to deep pinky
    },
    LAVA: {
        name: "Lava Flow",
        background: ['#2d0000', '#5c0000', '#8b0000'],
        accents: {
            primary: '#e91e63', // Changed to deep pinky
            secondary: '#ff4500',
            tertiary: '#ff6347',
            quaternary: '#ff7f50'
        },
        text: {
            primary: '#fffaf0',
            secondary: '#ffe4c4',
            accent: '#e91e63', // Changed to deep pinky
            muted: '#ff6347'
        },
        glow: {
            primary: 'rgba(233, 30, 99, 0.4)', // Changed to deep pinky
            secondary: 'rgba(255, 69, 0, 0.3)',
            tertiary: 'rgba(255, 99, 71, 0.3)'
        },
        cards: 'rgba(92, 0, 0, 0.9)',
        cardBorder: 'rgba(233, 30, 99, 0.2)' // Changed to deep pinky
    },
    JUNGLE: {
        name: "Deep Jungle",
        background: ['#1a3c27', '#2d5a3d', '#3e7b52'],
        accents: {
            primary: '#e91e63', // Changed to deep pinky
            secondary: '#66bb6a',
            tertiary: '#81c784',
            quaternary: '#a5d6a7'
        },
        text: {
            primary: '#e8f5e9',
            secondary: '#c8e6c9',
            accent: '#e91e63', // Changed to deep pinky
            muted: '#81c784'
        },
        glow: {
            primary: 'rgba(233, 30, 99, 0.4)', // Changed to deep pinky
            secondary: 'rgba(102, 187, 106, 0.3)',
            tertiary: 'rgba(129, 199, 132, 0.3)'
        },
        cards: 'rgba(45, 90, 61, 0.9)',
        cardBorder: 'rgba(233, 30, 99, 0.2)' // Changed to deep pinky
    }
};

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function drawGlowingRect(ctx, x, y, width, height, radius, fill, glowColor) {
    if (glowColor) {
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 25;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }
    
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();

    if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
    }
    
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
}

function drawProgressBar(ctx, x, y, width, height, progress, accentColor) {
    const radius = height / 2;
    
    // Background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
    
    // Progress
    const progressWidth = (width - 4) * Math.min(progress, 1);
    if (progressWidth > radius) {
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.moveTo(x + 2 + radius, y + 2);
        ctx.lineTo(x + 2 + progressWidth, y + 2);
        ctx.lineTo(x + 2 + progressWidth, y + height - 2);
        ctx.lineTo(x + 2 + radius, y + height - 2);
        ctx.quadraticCurveTo(x + 2, y + height - 2, x + 2, y + height - 2 - radius);
        ctx.lineTo(x + 2, y + 2 + radius);
        ctx.quadraticCurveTo(x + 2, y + 2, x + 2 + radius, y + 2);
        ctx.closePath();
        ctx.fill();
    }
}

function drawStatBadge(ctx, x, y, width, height, icon, label, value, theme) {
    const padding = 12;
    const iconSize = 20;
    const cornerRadius = 12;
    
    // Draw background card
    drawGlowingRect(ctx, x, y, width, height, cornerRadius, theme.cards, theme.glow.primary);
    
    // Draw border
    ctx.strokeStyle = theme.cardBorder;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw icon
    if (icon) {
        ctx.drawImage(icon, x + padding, y + (height - iconSize) / 2, iconSize, iconSize);
    }
    
    // Draw label
    ctx.fillStyle = theme.text.secondary;
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(label, x + padding + iconSize + 8, y + (height / 2) - 4);
    
    // Draw value
    ctx.fillStyle = theme.text.accent;
    ctx.font = 'bold 14px Arial';
    ctx.fillText(value, x + padding + iconSize + 8, y + (height / 2) + 12);
}

async function generateGitHubStatsCard(userData, themeName = 'DEEP_AQUA', includeRank = true, includeProgress = true) {
    const theme = THEMES[themeName] || THEMES.DEEP_AQUA;
    const canvas = createCanvas(800, 420);
    const ctx = canvas.getContext('2d');
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 800, 420);
    theme.background.forEach((color, index) => {
        gradient.addColorStop(index / (theme.background.length - 1), color);
    });
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 420);
    
    // Load icons
    const [starIcon, commitIcon, prIcon, issueIcon] = await Promise.all([
        loadImage(path.join(__dirname, 'icons', 'star.png')).catch(() => null),
        loadImage(path.join(__dirname, 'icons', 'commit.png')).catch(() => null),
        loadImage(path.join(__dirname, 'icons', 'pr.png')).catch(() => null),
        loadImage(path.join(__dirname, 'icons', 'issue.png')).catch(() => null)
    ]);
    
    // Draw title
    ctx.fillStyle = theme.text.primary;
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${userData.name}'s GitHub Stats`, 400, 40);
    
    // Draw subtitle
    ctx.fillStyle = theme.text.secondary;
    ctx.font = '16px Arial';
    ctx.fillText(`@${userData.username}`, 400, 70);
    
    // Draw stats badges
    const statBadges = [
        { icon: starIcon, label: 'Total Stars', value: formatNumber(userData.totalStars), x: 80, y: 120 },
        { icon: commitIcon, label: 'Total Commits', value: formatNumber(userData.totalCommits), x: 420, y: 120 },
        { icon: prIcon, label: 'Pull Requests', value: formatNumber(userData.totalPRs), x: 80, y: 200 },
        { icon: issueIcon, label: 'Issues', value: formatNumber(userData.totalIssues), x: 420, y: 200 }
    ];
    
    statBadges.forEach(badge => {
        drawStatBadge(ctx, badge.x, badge.y, 300, 60, badge.icon, badge.label, badge.value, theme);
    });
    
    // Draw rank if included
    if (includeRank && userData.rank) {
        ctx.fillStyle = theme.text.primary;
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Rank: ${userData.rank}`, 400, 290);
    }
    
    // Draw progress bar if included
    if (includeProgress && userData.contributionPercentage) {
        ctx.fillStyle = theme.text.primary;
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Contribution Progress', 400, 330);
        
        drawProgressBar(ctx, 200, 345, 400, 12, userData.contributionPercentage, theme.accents.primary);
    }
    
    // Draw footer
    ctx.fillStyle = theme.text.muted;
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Generated on ${new Date().toLocaleDateString()}`, 400, 390);
    
    return canvas.toBuffer('image/png');
}

async function saveGitHubStatsCard(userData, filename, themeName = 'DEEP_AQUA', options = {}) {
    const { includeRank = true, includeProgress = true } = options;
    const buffer = await generateGitHubStatsCard(userData, themeName, includeRank, includeProgress);
    await fs.writeFile(filename, buffer);
    return buffer;
}

module.exports = {
    THEMES,
    generateGitHubStatsCard,
    saveGitHubStatsCard,
    formatNumber
};
