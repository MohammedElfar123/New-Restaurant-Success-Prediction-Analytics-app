const axios = require('axios');

const API_BASE = 'https://backend.qarar-sat.com/api/v1/dashboard';
const TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiODFlOTcyMzgyYmI3NjU4MmI3OGNmOWU5ZDZjMjQzNjAzNzlmNjQ3YjM1ODZjOGVhNWNkMTE0MTFjNGVlZDc1MDc5ZGU2YjYzY2Y3MzNiMTAiLCJpYXQiOjE3MzcwMDg3MTcuNzgxMzAxLCJuYmYiOjE3MzcwMDg3MTcuNzgxMzA1LCJleHAiOjE3Njg1NDQ3MTcuNzc4NjI5LCJzdWIiOiIzIiwic2NvcGVzIjpbXX0.Z7RtLcFQvYK2pZ2nLHLb1fBWLgFBvDMbKl_vLdqQBmR9ZXpPRGjL13KWfPKf9lYvNrshvJmEE_DcY66d7VwcCLNShjPKCXYr_M2LGK6f9TXZMgjvmLh_mVo9qg4P7gDpYZIjFqCHzQP4vKLg3SL0jxVG8JnFPYB_L9JTZX9VKMY3IWvHKMmAl9rLm0jl8g5V7b3mYdM2ZvLIqwq7AwQQZ5jDpFq-_2Pl3wIxqPF3-q2Qr7XK0qN3fCbzqBGXvq0S_nnZ9f7LPF-qA8UTKQB-Pd5lK5O3l-RgXH7V-W9xRZPqCJTBLlkYrVLqf3Q_3mFrXfPDlCvgZJ9Q4dPqX-_7YCPchC2GYAJ6KpFqV4lQ6f6q3R7qTXl5q7TBCfXkPqJvM9A0lYVqpFkL8jQ5fCqL7P8R2lXg0P_4qBjFqC-R5mLbQqDp3J8Xr1lKqZqF7Y_M0rQqT5LpG-Hb8qR1lKpLqX9Z5qYqC0lP6qF3qR7lBpXq-K5lLqT2qF8qR4lCqH6qP3qV1lD7qM9qT5lA0qK2qF4qR8lB3qN7qT1lE6qL5qX9qF0lY4qP2qR6lC8qM3qT7lD1qK9qF5qV2lB0qN6qX3qR1lH4qP8qF6qT9lA7qL0qR4qV5lE2qK3qM8qF1lY9qN5qX0qR2';

async function testBookings() {
  try {
    console.log('===========================================');
    console.log('TESTING BOOKINGS API - DETAILED ANALYSIS');
    console.log('===========================================\n');

    const response = await axios.get(`${API_BASE}/bookings`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      params: { page: 1, per_page: 50 }
    });

    if (response.data && response.data.status === 'success') {
      const data = response.data.data;
      const bookings = Array.isArray(data) ? data : (data.items || data.data || []);

      console.log('Total bookings from API:', bookings.length);
      console.log('\n--- RAW API DATA (First 10 bookings as received) ---\n');

      bookings.slice(0, 10).forEach((b, i) => {
        console.log(`[${i+1}] ID: ${b.id}`);
        console.log(`    Type: ${b.provider?.type || 'N/A'}`);
        console.log(`    data_at: ${b.data_at || 'null'}`);
        console.log(`    time: "${b.time || 'null'}"`);
        console.log(`    created_at: ${b.created_at || 'null'}`);
        console.log('');
      });

      // Group by type
      const doctors = bookings.filter(b => b.provider?.type === 'Doctor');
      const clinics = bookings.filter(b => b.provider?.type === 'Clinic');
      const hospitals = bookings.filter(b => b.provider?.type === 'Hospital');

      console.log('\n--- COUNTS BY TYPE ---');
      console.log('Doctor bookings:', doctors.length);
      console.log('Clinic bookings:', clinics.length);
      console.log('Hospital bookings:', hospitals.length);

      // Sort doctors by data_at descending (newest first)
      console.log('\n--- DOCTOR BOOKINGS AFTER SORTING (Newest First) ---\n');
      const sortedDoctors = doctors.slice().sort((a, b) => {
        const dateA = new Date(a.data_at || a.date || a.created_at || 0);
        const dateB = new Date(b.data_at || b.date || b.created_at || 0);
        return dateB - dateA;
      });

      sortedDoctors.slice(0, 5).forEach((b, i) => {
        console.log(`[${i+1}] ID: ${b.id} | Date: ${b.data_at} | Time: "${b.time}" | Customer: ${b.customer?.name || 'N/A'}`);
      });

      // Check time field analysis
      console.log('\n--- TIME FIELD ANALYSIS ---\n');
      const timeValues = {};
      bookings.forEach(b => {
        const t = b.time || 'null/empty';
        timeValues[t] = (timeValues[t] || 0) + 1;
      });
      console.log('Unique time values found:');
      Object.entries(timeValues).sort((a,b) => b[1] - a[1]).forEach(([time, count]) => {
        console.log(`  "${time}": ${count} bookings`);
      });

      // Check if data_at has time component
      console.log('\n--- DATA_AT TIMESTAMP ANALYSIS ---\n');
      const sampleWithTime = bookings.find(b => b.data_at && b.data_at.includes('T'));
      if (sampleWithTime) {
        console.log('data_at includes timestamp (T separator found)');
        console.log('Example:', sampleWithTime.data_at);
      } else {
        console.log('data_at appears to be date-only (no T separator)');
        console.log('Example:', bookings[0]?.data_at);
      }

      console.log('\n===========================================');
      console.log('VERIFICATION COMPLETE');
      console.log('===========================================');

    } else {
      console.log('API Error:', response.data?.message || 'Unknown error');
    }
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testBookings();
