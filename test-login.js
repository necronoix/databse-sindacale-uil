#!/usr/bin/env node

// Test script per verificare login con Tiziana
import axios from 'axios';

async function testLogin() {
  try {
    console.log('🧪 Testing login with Tiziana...');
    
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      username: 'Tiziana',
      password: 'pupo'
    });
    
    console.log('✅ Login successful!');
    console.log('👤 User:', response.data.user.username);
    console.log('🔑 Token:', response.data.token.substring(0, 20) + '...');
    
    // Test API con token
    const statsResponse = await axios.get('http://localhost:3000/api/dashboard/stats', {
      headers: { 'Authorization': `Bearer ${response.data.token}` }
    });
    
    console.log('📊 Dashboard stats retrieved:', statsResponse.data.totalIscritti, 'iscritti');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testLogin();