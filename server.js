/*
 * Simple Online Store Server
 *
 * This Node.js server uses only built‑in modules to avoid external
 * dependencies. It serves a single page React application along with
 * a couple of JSON endpoints for products and orders. The goal is to
 * demonstrate a proof‑of‑concept online shopping experience without
 * relying on NPM packages. Products are stored in memory and orders
 * accumulate in an array for the duration of the server process.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// In‑memory catalogue of products. In a real application this would be
// stored in a database. Each product includes a price and a placeholder
// image. Feel free to modify this list to suit your needs.
const products = [
  {
    id: 1,
    name: 'Smartphone',
    description: 'Latest smartphone with high performance.',
    price: 699.99,
    image: 'https://via.placeholder.com/400?text=Smartphone'
  },
  {
    id: 2,
    name: 'Headphones',
    description: 'Noise cancelling headphones.',
    price: 199.99,
    image: 'https://via.placeholder.com/400?text=Headphones'
  },
  {
    id: 3,
    name: 'Laptop',
    description: 'Powerful laptop for professionals.',
    price: 1299.99,
    image: 'https://via.placeholder.com/400?text=Laptop'
  }
];

// In‑memory store for orders. Each order will be assigned a simple
// incrementing ID. For a real application this data would be persisted.
let orders = [];

/**
 * Determine the MIME type based on file extension. This helper is
 * intentionally simple and covers only the types used in this project.
 * @param {string} filePath
 * @returns {string}
 */
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html':
      return 'text/html';
    case '.js':
      return 'application/javascript';
    case '.css':
      return 'text/css';
    case '.json':
      return 'application/json';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Serve a static file from the public directory. If the file is not
 * found the caller is responsible for returning an appropriate 404.
 * @param {string} filePath relative path within the public directory
 * @param {http.ServerResponse} res
 */
function serveStatic(filePath, res) {
  const fullPath = path.join(__dirname, 'public', filePath);
  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    } else {
      const mime = getMimeType(fullPath);
      res.writeHead(200, { 'Content-Type': mime });
      res.end(data);
    }
  });
}

/**
 * Handle incoming HTTP requests. This function implements a very
 * lightweight routing system without any external frameworks. The
 * endpoints provided are:
 *   GET /              -> index.html
 *   GET /static/*      -> files under public/static
 *   GET /api/products  -> returns JSON array of products
 *   POST /api/orders   -> create a new order
 * Everything else returns a 404.
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
function requestHandler(req, res) {
  const url = req.url.split('?')[0];
  if (req.method === 'GET') {
    // Serve static assets under /static/
    if (url.startsWith('/static/')) {
      const relativePath = url.replace(/^\//, '');
      serveStatic(relativePath, res);
      return;
    }
    // API endpoint for products
    if (url === '/api/products') {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      });
      res.end(JSON.stringify(products));
      return;
    }
    // For any other GET request that isn’t an API or static file,
    // deliver the SPA entry point. This includes `/` and unknown
    // client‑side routes.
    serveStatic('index.html', res);
    return;
  }

  if (req.method === 'POST' && url === '/api/orders') {
    // Handle order creation. Read the body and parse JSON
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const orderData = JSON.parse(body || '{}');
        const id = orders.length + 1;
        const newOrder = {
          id,
          items: orderData.items || [],
          createdAt: new Date().toISOString()
        };
        orders.push(newOrder);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({ message: 'Order placed successfully', orderId: id })
        );
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Fallback: 404 Not Found
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
}

// Create and start the HTTP server on the specified port. The port can be
// configured via the PORT environment variable or defaults to 3000.
const port = process.env.PORT || 3000;
const server = http.createServer(requestHandler);
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});