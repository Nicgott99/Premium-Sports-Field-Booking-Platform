import http from 'http';

console.log('🧪 Testing API connection...');

const testEndpoints = [
  '/api/health',
  '/api',
  '/api/fields'
];

const testEndpoint = (path) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          path,
          status: res.statusCode,
          data: JSON.parse(data)
        });
      });
    });

    req.on('error', (e) => {
      reject({
        path,
        error: e.message
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject({
        path,
        error: 'Request timeout'
      });
    });

    req.end();
  });
};

// Test all endpoints
const runTests = async () => {
  for (const endpoint of testEndpoints) {
    try {
      const result = await testEndpoint(endpoint);
      console.log(`✅ ${result.path} - Status: ${result.status}`);
      console.log(`   Response: ${JSON.stringify(result.data, null, 2)}`);
    } catch (error) {
      console.log(`❌ ${error.path} - Error: ${error.error}`);
    }
    console.log('---');
  }
};

runTests();