import { EnhancedMoodTrackerAPI } from './frontend/src/services/enhancedMoodTrackerAPI.ts';

async function testQuotesFunctionality() {
    console.log('🧪 Testing Enhanced Mood Tracker Quotes Functionality...\n');
    
    const testMoods = ['happy', 'sad', 'anxious', 'angry', 'excited', 'stressed', 'calm'];
    
    for (const mood of testMoods) {
        console.log(`📝 Testing quotes for mood: ${mood.toUpperCase()}`);
        
        try {
            const quotes = await EnhancedMoodTrackerAPI.getMotivationalQuotes(mood, 2);
            
            console.log(`✅ Success! Got ${quotes.length} quotes:`);
            quotes.forEach((quote, index) => {
                console.log(`   ${index + 1}. "${quote.text}" - ${quote.author}`);
            });
            console.log('');
            
            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (error) {
            console.log(`❌ Error testing ${mood}: ${error.message}`);
        }
    }
    
    console.log('🎯 Testing API vs Fallback...');
    
    // Test API functionality
    try {
        console.log('📡 Testing direct API call...');
        const response = await fetch('https://zenquotes.io/api/random');
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ ZenQuotes API working: "${data[0].q}" - ${data[0].a}`);
        }
    } catch (error) {
        console.log(`❌ API error: ${error.message}`);
    }
    
    console.log('\n🎉 Quote functionality test complete!');
}

// For Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testQuotesFunctionality };
}

// For browser testing
if (typeof window !== 'undefined') {
    window.testQuotesFunctionality = testQuotesFunctionality;
}