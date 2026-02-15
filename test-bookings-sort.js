const axios = require('axios');

const API_BASE = 'https://backend.qarar-sat.com/api/v1/dashboard';
const TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiODFlOTcyMzgyYmI3NjU4MmI3OGNmOWU5ZDZjMjQzNjAzNzlmNjQ3YjM1ODZjOGVhNWNkMTE0MTFjNGVlZDc1MDc5ZGU2YjYzY2Y3MzNiMTAiLCJpYXQiOjE3MzcwMDg3MTcuNzgxMzAxLCJuYmYiOjE3MzcwMDg3MTcuNzgxMzA1LCJleHAiOjE3Njg1NDQ3MTcuNzc4NjI5LCJzdWIiOiIzIiwic2NvcGVzIjpbXX0.Z7RtLcFQvYK2pZ2nLHLb1fBWLgFBvDMbKl_vLdqQBmR9ZXpPRGjL13KWfPKf9lYvNrshvJmEE_DcY66d7VwcCLNShjPKCXYr_M2LGK6f9TXZMgjvmLh_mVo9qg4P7gDpYZIjFqCHzQP4vKLg3SL0jxVG8JnFPYB_L9JTZX9VKMY3IWvHKMmAl9rLm0jl8g5V7b3mYdM2ZvLIqwq7AwQQZ5jDpFq-_2Pl3wIxqPF3-q2Qr7XK0qN3fCbzqBGXvq0S_nnZ9f7LPF-qA8UTKQB-Pd5lK5O3l-RgXH7V-W9xRZPqCJTBLlkYrVLqf3Q_3mFrXfPDlCvgZJ9Q4dPqX-_7YCPchC2GYAJ6KpFqV4lQ6f6q3R7qTXl5q7TBCfXkPqJvM9A0lYVqpFkL8jQ5fCqL7P8R2lXg0P_4qBjFqC-R5mLbQqDp3J8Xr1lKqZqF7Y_M0rQqT5LpG-Hb8qR1lKpLqX9Z5qYqC0lP6qF3qR7lBpXq-K5lLqT2qF8qR4lCqH6qP3qV1lD7qM9qT5lA0qK2qF4qR8lB3qN7qT1lE6qL5qX9qF0lY4qP2qR6lC8qM3qT7lD1qK9qF5qV2lB0qN6qX3qR1lH4qP8qF6qT9lA7qL0qR4qV5lE2qK3qM8qF1lY9qN5qX0qR2';

async function testBookings() {
  try {
    console.log('Testing Bookings API...\n');

    const response = await axios.get(`${API_BASE}/bookings`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      params: { page: 1, per_page: 30 }
    });

    if (response.data && response.data.status === 'success') {
      const data = response.data.data;
      const bookings = Array.isArray(data) ? data : (data.items || data.data || []);

      console.log('Total bookings returned:', bookings.length, '\n');

      // Group by type
      const doctors = bookings.filter(function(b) { return b.provider && b.provider.type === 'Doctor'; });
      const clinics = bookings.filter(function(b) { return b.provider && b.provider.type === 'Clinic'; });
      const hospitals = bookings.filter(function(b) { return b.provider && b.provider.type === 'Hospital'; });

      console.log('Doctor bookings:', doctors.length);
      console.log('Clinic bookings:', clinics.length);
      console.log('Hospital bookings:', hospitals.length, '\n');

      // Show latest bookings
      console.log('All bookings (as received from API):');
      console.log('=====================================');

      bookings.slice(0, 15).forEach(function(b, i) {
        var providerType = b.provider ? b.provider.type : 'N/A';
        var dateField = b.data_at || b.date_at || b.booking_date || 'N/A';
        console.log((i+1) + '. ID: ' + b.id + ' | Type: ' + providerType + ' | Date: ' + dateField + ' | Created: ' + (b.created_at || 'N/A') + ' | Status: ' + b.status);
      });

      // Check date field names
      console.log('\n--- Checking booking date fields ---');
      if (bookings.length > 0) {
        var sample = bookings[0];
        var dateFields = Object.keys(sample).filter(function(k) {
          return k.includes('date') || k.includes('data') || k.includes('_at');
        });
        console.log('Date-related fields:', dateFields);
      }

      // Sort by ID descending and show
      console.log('\n--- After sorting by ID (newest first) ---');
      var sorted = bookings.slice().sort(function(a, b) { return b.id - a.id; });
      sorted.slice(0, 5).forEach(function(b, i) {
        var providerType = b.provider ? b.provider.type : 'N/A';
        console.log((i+1) + '. ID: ' + b.id + ' | Type: ' + providerType + ' | Date: ' + (b.data_at || 'N/A'));
      });

    } else {
      console.log('API Error:', response.data ? response.data.message : 'No response');
    }
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testBookings();
