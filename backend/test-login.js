// Quick test script to check login functionality
const fetch = require('node-fetch');

async function testLogin() {
    try {
        console.log('Testing login endpoint...');
        
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123'
            })
        });
        
        const data = await response.json();
        
        console.log('Response status:', response.status);
        console.log('Response data:', JSON.stringify(data, null, 2));
        
        if (data.success) {
            console.log('✅ Login successful!');
            console.log('Token:', data.data.token.substring(0, 20) + '...');
        } else {
            console.log('❌ Login failed:', data.message || data.error);
        }
        
    } catch (error) {
        console.error('❌ Error testing login:', error.message);
    }
}

testLogin();
