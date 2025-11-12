/**
 * PayLinkBridge Checkout Widget
 * Embed this on any website to add checkout functionality
 * 
 * Usage:
 * <script src="https://your-domain.com/checkout-widget.js"></script>
 * <div id="paylink-checkout"></div>
 */

(function() {
  // Configuration
  const CHECKOUT_URL = window.PAYLINK_CHECKOUT_URL || 'https://localhost:4000';
  const WIDGET_ID = 'paylink-checkout';
  
  // Plans configuration
  const PLANS = {
    starter: { price: 10.00, name: 'Starter', features: ['Basic features', 'Email support'] },
    basic: { price: 25.00, name: 'Basic', features: ['All Starter features', 'Priority support', 'Advanced analytics'] },
    pro: { price: 99.00, name: 'Pro', features: ['All Basic features', 'Premium support', 'Custom integration', 'Webhooks'] }
  };
  
  // Create widget styles
  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #paylink-widget {
        max-width: 500px;
        margin: 20px auto;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      }
      
      .paylink-plans {
        display: grid;
        gap: 20px;
        margin: 20px 0;
      }
      
      .paylink-plan {
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        padding: 20px;
        cursor: pointer;
        transition: all 0.3s ease;
        background: white;
      }
      
      .paylink-plan:hover {
        border-color: #0070ba;
        box-shadow: 0 4px 12px rgba(0,112,186,0.15);
      }
      
      .paylink-plan.selected {
        border-color: #0070ba;
        background: #f0f9ff;
      }
      
      .paylink-plan-name {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 8px;
        color: #003087;
      }
      
      .paylink-plan-price {
        font-size: 28px;
        font-weight: 700;
        color: #0070ba;
        margin-bottom: 12px;
      }
      
      .paylink-plan-features {
        font-size: 13px;
        color: #666;
        margin: 12px 0;
      }
      
      .paylink-plan-features li {
        margin: 4px 0;
      }
      
      .paylink-form {
        background: #f8f8f8;
        padding: 20px;
        border-radius: 8px;
        margin: 20px 0;
      }
      
      .paylink-form input {
        width: 100%;
        padding: 10px;
        margin: 10px 0;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
      }
      
      .paylink-form input:focus {
        outline: none;
        border-color: #0070ba;
        box-shadow: 0 0 0 3px rgba(0,112,186,0.1);
      }
      
      .paylink-checkout-btn {
        width: 100%;
        padding: 12px;
        background: #0070ba;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        margin-top: 10px;
      }
      
      .paylink-checkout-btn:hover {
        background: #003087;
      }
      
      .paylink-checkout-btn:disabled {
        background: #ccc;
        cursor: not-allowed;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Create widget HTML
  function createWidget() {
    const container = document.getElementById(WIDGET_ID);
    if (!container) return;
    
    let plansHTML = '<div class="paylink-plans">';
    for (const [key, plan] of Object.entries(PLANS)) {
      const features = plan.features.map(f => `<li>${f}</li>`).join('');
      plansHTML += `
        <div class="paylink-plan" data-plan="${key}">
          <div class="paylink-plan-name">${plan.name}</div>
          <div class="paylink-plan-price">$${plan.price.toFixed(2)}</div>
          <ul class="paylink-plan-features">${features}</ul>
        </div>
      `;
    }
    plansHTML += '</div>';
    
    const html = `
      <div id="paylink-widget">
        <h2 style="text-align:center; color:#003087; margin-bottom:30px;">Select Your Plan</h2>
        ${plansHTML}
        <div class="paylink-form">
          <input type="email" id="paylink-email" placeholder="Enter your email" required />
          <button class="paylink-checkout-btn" onclick="payLinkCheckout()">
            Proceed to Checkout
          </button>
        </div>
      </div>
    `;
    
    container.innerHTML = html;
    
    // Add event listeners
    document.querySelectorAll('.paylink-plan').forEach(el => {
      el.addEventListener('click', function() {
        document.querySelectorAll('.paylink-plan').forEach(e => e.classList.remove('selected'));
        this.classList.add('selected');
        window.selectedPlan = this.dataset.plan;
      });
    });
    
    // Select first plan by default
    document.querySelector('.paylink-plan').click();
  }
  
  // Checkout function
  window.payLinkCheckout = async function() {
    const email = document.getElementById('paylink-email').value;
    const plan = window.selectedPlan || 'basic';
    
    if (!email) {
      alert('Please enter your email');
      return;
    }
    
    // Redirect to checkout
    const params = new URLSearchParams({
      plan: plan,
      email: email,
      source: 'embedded'
    });
    
    window.location.href = `${CHECKOUT_URL}?${params.toString()}`;
  };
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      injectStyles();
      createWidget();
    });
  } else {
    injectStyles();
    createWidget();
  }
})();
