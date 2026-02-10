const http = require('http');

const server = http.createServer((clientReq, clientRes) => {
  const opts = {
    hostname: '127.0.0.1',
    port: 8001,
    path: clientReq.url,
    method: clientReq.method,
    headers: clientReq.headers,
  };

  const proxyReq = http.request(opts, (proxyRes) => {
    clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(clientRes, { end: true });
  });

  proxyReq.on('error', () => {
    clientRes.writeHead(502, { 'Content-Type': 'application/json' });
    clientRes.end(JSON.stringify({ error: 'Backend unavailable' }));
  });

  clientReq.pipe(proxyReq, { end: true });
});

server.listen(3000, '0.0.0.0', () => {
  console.log('Proxy server running on port 3000 -> 8001');
});
