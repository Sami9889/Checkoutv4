// Configuration
const CONFIG = {
  github_owner: 'YOUR_GITHUB_USER',
  github_repo: 'YOUR_GITHUB_REPO'
};

// Plan pricing
const PLANS = {
  pro: { price: 99.00, name: 'Professional' },
  basic: { price: 25.00, name: 'Basic' },
  starter: { price: 10.00, name: 'Starter' }
};

// Update amount display
document.getElementById('plan').addEventListener('change', (e) => {
  const plan = e.target.value;
  const price = PLANS[plan]?.price || 25.00;
  document.getElementById('amount-display').textContent = `$${price.toFixed(2)}`;
});

// Initialize PayPal button
if (window.paypal) {
  paypal.Buttons({
    createOrder: async (data, actions) => {
      const plan = document.getElementById('plan').value;
      const email = document.getElementById('email').value;
      const amount = PLANS[plan]?.price || 25.00;
      
      if (!email) {
        alert('Please enter your email');
        return;
      }
      
      try {
        showStatus('Creating order...', 'info');
        const response = await fetch('/server/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, currency: 'AUD', plan, email })
        });
        const order = await response.json();
        if (order.id) return order.id;
        throw new Error(order.error || 'Failed to create order');
      } catch (error) {
        console.error('Order creation error:', error);
        showStatus('Order creation failed: ' + error.message, 'error');
      }
    },
    onApprove: async (data, actions) => {
      const plan = document.getElementById('plan').value;
      const email = document.getElementById('email').value;
      
      try {
        showStatus('Processing payment...', 'info');
        const response = await fetch('/server/capture-order', {
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
          showCheckoutResult({
            success: true,
            license: result.license,
            orderId: result.orderId,
            plan: plan,
            email: email,
            timestamp: new Date().toISOString()
          });
          showStatus('', 'success');
        } else {
          showStatus('Payment capture failed: ' + result.error, 'error');
        }
      } catch (error) {
        console.error('Capture error:', error);
        showStatus('Payment capture failed: ' + error.message, 'error');
      }
    },
    onError: (err) => {
      console.error('PayPal error:', err);
      showStatus('Payment error: ' + err.message, 'error');
    },
    onCancel: (data) => {
      showStatus('Payment cancelled by user', 'warning');
    }
  }).render('#paypal-button-container');
}

function showStatus(message, type = 'info') {
  const el = document.getElementById('checkout-status');
  el.textContent = message;
  el.className = 'status-message ' + type;
  el.style.display = message ? 'block' : 'none';
}

function showCheckoutResult(result) {
  document.getElementById('checkout-container').style.display = 'none';
  const resultSection = document.getElementById('result-section');
  resultSection.classList.remove('result-hidden');
  
  document.getElementById('license-display').textContent = result.license;
  
  const details = document.getElementById('transaction-details');
  details.innerHTML = `
    <div style="text-align: left; margin-top: 1rem;">
      <p><strong>Plan:</strong> ${result.plan}</p>
      <p><strong>Email:</strong> ${result.email}</p>
      <p><strong>Order ID:</strong> ${result.orderId}</p>
      <p><strong>Time:</strong> ${new Date(result.timestamp).toLocaleString()}</p>
    </div>
  `;
}

function copyLicense() {
  const license = document.getElementById('license-display').textContent;
  navigator.clipboard.writeText(license).then(() => {
    alert('License copied to clipboard!');
  }).catch(err => {
    console.error('Failed to copy:', err);
  });
}

// GitHub Integration
function openGitHubIssue(type) {
  const templates = {
    feature: {
      title: '[FEATURE REQUEST] New Feature Idea',
      body: 'Please describe your feature request:\n\n## Description\n\n## Why\n\n## Expected Behavior\n'
    },
    support: {
      title: '[SUPPORT] I need help',
      body: 'Please describe the issue:\n\n## Problem\n\n## What I\'ve tried\n\n## Environment\n'
    },
    payment: {
      title: '[PAYMENT ISSUE] Payment Problem',
      body: 'Please describe the payment issue:\n\n## Problem\n\n## Plan\n\n## Email\n\n## Details\n'
    }
  };
  
  const template = templates[type] || templates.support;
  const owner = CONFIG.github_owner;
  const repo = CONFIG.github_repo;
  
  if (owner === 'YOUR_GITHUB_USER' || repo === 'YOUR_GITHUB_REPO') {
    showGitHubStatus('⚠️ GitHub repository not configured. Please contact support.', 'error');
    return;
  }
  
  const url = `https://github.com/${owner}/${repo}/issues/new?title=${encodeURIComponent(template.title)}&body=${encodeURIComponent(template.body)}`;
  window.open(url, '_blank');
}

function showGitHubStatus(message, type = 'info') {
  const el = document.getElementById('github-status');
  el.textContent = message;
  el.className = `github-status ${type}`;
  el.style.display = 'block';
  setTimeout(() => {
    el.style.display = 'none';
  }, 5000);
}

// Smooth scroll for navigation
document.querySelectorAll('.nav-menu a').forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (href.startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
});

// Log page load
console.log('PayLink Checkout loaded successfully');
