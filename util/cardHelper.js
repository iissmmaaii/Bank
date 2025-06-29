// utils/cardHelper.js
const sequelize = require('../util/database');
const Card = require('../models/card'); 

const isValidLuhn = (digits) => {
    let sum = 0;
    let shouldDouble = false;
    
    for (let i = digits.length - 1; i >= 0; i--) {
        let digit = parseInt(digits[i]);
        
        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        
        sum += digit;
        shouldDouble = !shouldDouble;
    }
    
    return (sum % 10) === 0;
};

const generateCardNumber = async () => {
    let cardNumber;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 100;

    while (!isUnique && attempts < maxAttempts) {
        attempts++;
        
        const temp = Array.from({length: 16}, () => Math.floor(Math.random() * 10));
        
        if (isValidLuhn(temp)) {
            cardNumber = temp.join('');
            
            try {
                const existingCard = await Card.findOne({ 
                    where: { cardNumber } 
                });
                
                if (!existingCard) {
                    isUnique = true;
                }
            } catch (err) {
                console.error('Error checking card uniqueness:', err);
                throw err;
            }
        }
    }

    if (!isUnique) {
        throw new Error('Failed to generate unique card number');
    }

    return cardNumber;
};

module.exports = {
  generateCardNumber
};