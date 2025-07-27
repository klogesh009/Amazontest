/*
 * Frontend for the Online Store Proof of Concept
 *
 * This script defines a small React application without JSX. React
 * and ReactDOM are provided via UMD builds loaded from unpkg. The
 * application fetches product data from the server, allows users to
 * add items to a cart, displays the cart contents and total, and
 * submits an order to the backend. The UI is intentionally kept
 * simple to demonstrate core functionality without external
 * dependencies or build tooling.
 */

(() => {
  const { useState, useEffect } = React;

  /**
   * The main App component encapsulates the entire shopping experience.
   */
  function App() {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState({});
    const [message, setMessage] = useState('');

    // Fetch product list on initial render
    useEffect(() => {
      fetch('/api/products')
        .then(res => res.json())
        .then(data => setProducts(data))
        .catch(err => {
          console.error('Failed to load products:', err);
        });
    }, []);

    /**
     * Adds a product to the cart. If the product is already present
     * its quantity is incremented. A short message is displayed to
     * acknowledge the action.
     * @param {Object} product
     */
    function addToCart(product) {
      setCart(prevCart => {
        const nextCart = { ...prevCart };
        if (nextCart[product.id]) {
          nextCart[product.id].quantity += 1;
        } else {
          nextCart[product.id] = { product, quantity: 1 };
        }
        return nextCart;
      });
      setMessage(`Added ${product.name} to cart.`);
      // Clear the message after a short delay
      setTimeout(() => setMessage(''), 2000);
    }

    /**
     * Decrements the quantity of a product in the cart. If the
     * quantity drops to zero the item is removed completely.
     * @param {number} productId
     */
    function removeFromCart(productId) {
      setCart(prevCart => {
        const nextCart = { ...prevCart };
        if (nextCart[productId]) {
          nextCart[productId].quantity -= 1;
          if (nextCart[productId].quantity <= 0) {
            delete nextCart[productId];
          }
        }
        return nextCart;
      });
    }

    /**
     * Computes the current total price of all items in the cart.
     * @returns {number}
     */
    function computeTotal() {
      return Object.values(cart).reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    }

    /**
     * Submits the current cart to the server as a new order. If the
     * cart is empty, a message is displayed. Upon success the cart
     * state is cleared and a confirmation message shown.
     */
    function checkout() {
      if (Object.keys(cart).length === 0) {
        setMessage('Your cart is empty.');
        return;
      }
      const payload = {
        items: Object.values(cart).map(item => ({ id: item.product.id, quantity: item.quantity }))
      };
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(res => res.json())
        .then(data => {
          setMessage(data.message);
          setCart({});
        })
        .catch(err => {
          console.error('Error placing order:', err);
          setMessage('Failed to place order.');
        });
    }

    // Build the JSX‑like structure using React.createElement. Since
    // JSX isn't available here we call React.createElement manually.
    return React.createElement(
      'div',
      { className: 'app-container' },
      // Heading
      React.createElement('h1', null, 'Online Store'),
      // Notification message
      message
        ? React.createElement('div', { className: 'notification' }, message)
        : null,
      // Product list
      React.createElement(
        'div',
        { className: 'products' },
        products.map(product =>
          React.createElement(
            'div',
            { key: product.id, className: 'product-card' },
            React.createElement('img', { src: product.image, alt: product.name }),
            React.createElement('h2', null, product.name),
            React.createElement('p', null, product.description),
            React.createElement('p', null, '$' + product.price.toFixed(2)),
            React.createElement(
              'button',
              { onClick: () => addToCart(product) },
              'Add to Cart'
            )
          )
        )
      ),
      // Cart summary
      React.createElement(
        'div',
        { className: 'cart' },
        React.createElement('h2', null, 'Your Cart'),
        Object.keys(cart).length === 0
          ? React.createElement('p', null, 'Cart is empty.')
          : React.createElement(
              'ul',
              null,
              Object.values(cart).map(item =>
                React.createElement(
                  'li',
                  { key: item.product.id },
                  `${item.product.name} x ${item.quantity} ($${(item.product.price * item.quantity).toFixed(2)})`,
                  React.createElement(
                    'button',
                    { onClick: () => removeFromCart(item.product.id) },
                    'Remove'
                  )
                )
              )
            ),
        React.createElement('p', { className: 'total' }, 'Total: $' + computeTotal().toFixed(2)),
        React.createElement(
          'button',
          { onClick: checkout, className: 'checkout-button' },
          'Checkout'
        )
      )
    );
  }

  // Mount the App into the root element
  ReactDOM.render(React.createElement(App), document.getElementById('root'));
})();