console.log("Testing projects display...");

// Check if we're in browser
if (typeof window !== 'undefined') {
    // Check localStorage
    const token = localStorage.getItem('access_token');
    console.log('Auth token exists:', !!token);
    
    // Check if we can access the API
    if (token) {
        fetch('http://localhost:8000/api/v1/analytics/api/projects/', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            console.log('API Response Status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('API Response Type:', typeof data);
            console.log('API Response Structure:', Object.keys(data));
            if (data.results) {
                console.log('Projects Array Length:', data.results.length);
                console.log('First Project:', data.results[0]?.name);
            } else if (Array.isArray(data)) {
                console.log('Direct Array Length:', data.length);
                console.log('First Project:', data[0]?.name);
            }
        })
        .catch(error => {
            console.error('API Error:', error);
        });
    }
}