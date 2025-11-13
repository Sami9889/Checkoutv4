/**
 * PayLinkBridge Embed - Add Checkout to Any Website
 * 
 * Usage:
 * <script src="https://checkout.example.com/embed.js"></script>
 * <div id="paylink-checkout"></div>
 * 
 * Or with custom container:
 * <script>
 *   window.PaylinkCheckout = { container: '#my-checkout' };
 * </script>
 * <script src="https://checkout.example.com/embed.js"></script>
 * <div id="my-checkout"></div>
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    container: window.PaylinkCheckout?.container || '#paylink-checkout',
    domain: window.PaylinkCheckout?.domain || (typeof process !== 'undefined' ? process.env.PAYLINK_SELF_URL : '') || 'https://checkout.example.com',
    apiUrl: window.PaylinkCheckout?.apiUrl || (typeof process !== 'undefined' ? process.env.PAYLINK_SELF_URL : '') || 'https://checkout.example.com',
    plans: {
      starter: { price: 10.00, name: 'Starter' },
      basic: { price: 25.00, name: 'Basic' },
      pro: { price: 99.00, name: 'Pro' }
    }
  };

  // Create checkout HTML
  function createCheckoutHTML() {
    return `
      <div class="paylink-checkout-wrapper">
        <style>
          .paylink-checkout-wrapper {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            max-width: 500px;
            margin: 0 auto;
            padding: 20px;
          }
          
          .paylink-checkout-title {
            color: #0070ba;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
          }
          
          .paylink-checkout-form {
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          
          .paylink-form-group {
            margin-bottom: 15px;
          }
          
          .paylink-form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: #333;
            font-size: 14px;
          }
          
          .paylink-form-group select,
          .paylink-form-group input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            box-sizing: border-box;
          }
          
          .paylink-form-group input:focus,
          .paylink-form-group select:focus {
            outline: none;
            border-color: #0070ba;
            box-shadow: 0 0 0 3px rgba(0,112,186,0.1);
          }
          
          .paylink-plan-info {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 4px;
            margin-top: 10px;
            font-size: 13px;
            color: #666;
          }
          
          .paylink-amount {
            color: #0070ba;
            font-weight: bold;
            font-size: 18px;
          }
          
          .paylink-button {
            background: #0070ba;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            margin-top: 20px;
            transition: background 0.3s;
          }
          
          .paylink-button:hover {
            background: #003087;
          }
          
          .paylink-button:disabled {
            background: #ccc;
            cursor: not-allowed;
          }
          
          .paylink-status {
            margin-top: 15px;
            padding: 12px;
            border-radius: 4px;
            font-size: 14px;
            display: none;
          }
          
          .paylink-status.error {
            background: #ffebee;
            color: #c62828;
            border-left: 4px solid #d32f2f;
            display: block;
          }
          
          .paylink-status.success {
            background: #e8f5e9;
            color: #2e7d32;
            border-left: 4px solid #388e3c;
            display: block;
          }
          
          .paylink-status.loading {
            background: #e3f2fd;
            color: #1565c0;
            border-left: 4px solid #1976d2;
            display: block;
          }
        </style>
        
        <div class="paylink-checkout-title">💳 Secure Checkout</div>
        
        <form class="paylink-checkout-form" id="paylink-form">
          <div class="paylink-form-group">
            <label for="paylink-plan">Select Plan</label>
            <select id="paylink-plan" name="plan" required>
              <option value="starter">Starter Plan - $10.00</option>
              <option value="basic" selected>Basic Plan - $25.00</option>
              <option value="pro">Pro Plan - $99.00</option>
            </select>
          </div>
          
          <div class="paylink-form-group">
            <label for="paylink-email">Email Address</label>
            <input type="email" id="paylink-email" name="email" placeholder="your@email.com" required />
          </div>
          
          <div class="paylink-form-group">
            <label>Total Amount</label>
            <div class="paylink-plan-info">
              Plan: <strong id="paylink-plan-name">Basic Plan</strong>
              <br />
              Amount: <span class="paylink-amount" id="paylink-amount">$25.00</span> AUD
            </div>
          </div>
          
          <button type="submit" class="paylink-button" id="paylink-button">Pay with PayPal</button>
          
          <div class="paylink-status" id="paylink-status"></div>
        </form>
      </div>
    `;
  }

  // Initialize checkout
  function init() {
    const container = document.querySelector(CONFIG.container);
    if (!container) {
      console.error('PayLinkBridge: Container not found:', CONFIG.container);
      return;
    }

    // Insert HTML
    container.innerHTML = createCheckoutHTML();

    // Get elements
    const form = document.getElementById('paylink-form');
    const planSelect = document.getElementById('paylink-plan');
    const emailInput = document.getElementById('paylink-email');
    const planNameEl = document.getElementById('paylink-plan-name');
    const amountEl = document.getElementById('paylink-amount');
    const statusEl = document.getElementById('paylink-status');
    const button = document.getElementById('paylink-button');

    // Update amount when plan changes
    planSelect.addEventListener('change', () => {
      const plan = planSelect.value;
      const planData = CONFIG.plans[plan];
      if (planData) {
        planNameEl.textContent = planData.name + ' Plan';
        amountEl.textContent = '$' + planData.price.toFixed(2);
      }
    });

    // Handle form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const plan = planSelect.value;
      const email = emailInput.value;
      const amount = CONFIG.plans[plan].price;

      if (!email) {
        showStatus('Please enter your email address', 'error');
        return;
      }

      try {
        // Show loading
        statusEl.textContent = 'Creating order...';
        statusEl.className = 'paylink-status loading';
        button.disabled = true;

        // Create order
        const response = await fetch(`${CONFIG.apiUrl}/server/create-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: amount.toString(),
            currency: 'AUD',
            plan: plan,
            email: email
          })
        });

        const order = await response.json();

        if (!response.ok || !order.id) {
          throw new Error(order.error || 'Failed to create order');
        }

        // Store order info for later
        window.paylinkOrderId = order.id;
        window.paylinkPlan = plan;
        window.paylinkEmail = email;

        // Load PayPal SDK and show button
        loadPayPalSDK(order.id, plan, email);

      } catch (error) {
        console.error('Order creation error:', error);
        showStatus('Error: ' + error.message, 'error');
        button.disabled = false;
      }
    });

    function showStatus(message, type) {
      statusEl.textContent = message;
      statusEl.className = 'paylink-status ' + type;
    }
  }

  // Load PayPal SDK dynamically
  function loadPayPalSDK(orderId, plan, email) {
    if (window.paypal) {
      renderPayPalButton(orderId, plan, email);
      return;
    }

    // Create and load PayPal script
    const script = document.createElement('script');
    script.src = 'https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID&currency=AUD';
    script.onload = () => {
      if (window.paypal) {
        renderPayPalButton(orderId, plan, email);
      }
    };
    script.onerror = () => {
      const statusEl = document.getElementById('paylink-status');
      statusEl.textContent = 'Failed to load PayPal. Please refresh and try again.';
      statusEl.className = 'paylink-status error';
    };
    document.head.appendChild(script);
  }

  // Render PayPal button
  function renderPayPalButton(orderId, plan, email) {
    const container = document.querySelector('#paylink-form');
    const statusEl = document.getElementById('paylink-status');

    // Create container for button
    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'paypal-button-container';
    buttonContainer.style.marginTop = '20px';
    container.appendChild(buttonContainer);

    if (window.paypal && window.paypal.Buttons) {
      window.paypal.Buttons({
        createOrder: () => {
          return orderId;
        },
        onApprove: async (data) => {
          try {
            statusEl.textContent = 'Completing payment...';
            statusEl.className = 'paylink-status loading';

            const response = await fetch(`${CONFIG.apiUrl}/server/capture-order`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: data.orderID,
                payerEmail: email,
                plan: plan
              })
            });

            const result = await response.json();

            if (result.success) {
              statusEl.innerHTML = `
                <strong>✅ Payment Successful!</strong><br/>
                License: <code>${result.license}</code><br/>
                Check your email for next steps.
              `;
              statusEl.className = 'paylink-status success';
            } else {
              throw new Error(result.error || 'Payment failed');
            }
          } catch (error) {
            console.error('Capture error:', error);
            statusEl.textContent = 'Error: ' + error.message;
            statusEl.className = 'paylink-status error';
          }
        },
        onError: (err) => {
          console.error('PayPal error:', err);
          statusEl.textContent = 'Payment error: ' + err.message;
          statusEl.className = 'paylink-status error';
        },
        onCancel: () => {
          statusEl.textContent = 'Payment cancelled';
          statusEl.className = 'paylink-status error';
        }
      }).render(buttonContainer);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
