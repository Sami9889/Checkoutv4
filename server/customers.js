import express from 'express';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
const router = express.Router();

const CUSTOMERS_DB = path.resolve('./server/customers.json');

// Initialize customers database
function initCustomersDB() {
  if (!fs.existsSync(CUSTOMERS_DB)) {
    fs.writeFileSync(CUSTOMERS_DB, JSON.stringify([], null, 2));
  }
}

function readCustomers() {
  initCustomersDB();
  return JSON.parse(fs.readFileSync(CUSTOMERS_DB, 'utf8'));
}

function saveCustomers(data) {
  fs.writeFileSync(CUSTOMERS_DB, JSON.stringify(data, null, 2));
}

// Record customer after payment
export async function recordCustomer(paymentData) {
  const customers = readCustomers();
  
  const customer = {
    id: `CUST-${Date.now()}`,
    paypalEmail: paymentData.email,
    fullName: paymentData.fullName || 'Unknown',
    dateOfBirth: paymentData.dateOfBirth || null,
    plan: paymentData.plan,
    amount: paymentData.amount,
    currency: paymentData.currency || 'AUD',
    license: paymentData.license,
    orderId: paymentData.orderId,
    status: 'active',
    createdAt: new Date().toISOString(),
    githubIssueCreated: false,
    githubIssueUrl: null
  };
  
  customers.push(customer);
  saveCustomers(customers);
  
  return customer;
}

// Create GitHub issue with customer info
export async function createGitHubIssue(customer) {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_OWNER = process.env.GITHUB_OWNER || 'Sami9889';
  const GITHUB_REPO = process.env.GITHUB_REPO || 'Checkoutv4';
  
  if (!GITHUB_TOKEN) {
    console.warn('⚠️ GITHUB_TOKEN not set - skipping issue creation');
    return null;
  }

  const issueBody = `
## 📦 New Customer Registration

**Customer ID**: ${customer.id}

### Payment Information
- **Plan**: ${customer.plan}
- **Amount**: $${customer.amount} ${customer.currency}
- **Order ID**: ${customer.orderId}
- **License Key**: ${customer.license}

### Customer Details
- **Email**: ${customer.paypalEmail}
- **Full Name**: ${customer.fullName}
- **Payment Date**: ${new Date(customer.createdAt).toLocaleString()}

### License Status
- **Status**: Active ✅
- **Issued**: ${customer.createdAt}

---

*Automatically created by PayLinkBridge payment system*
`;

  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          title: `🎉 New License - ${customer.plan.toUpperCase()} - ${customer.fullName}`,
          body: issueBody,
          labels: ['customer', 'license-issued'],
          assignees: []
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('GitHub API error:', response.status, error);
      return null;
    }

    const issue = await response.json();
    
    // Update customer with GitHub issue info
    const customers = readCustomers();
    const custIdx = customers.findIndex(c => c.id === customer.id);
    if (custIdx >= 0) {
      customers[custIdx].githubIssueCreated = true;
      customers[custIdx].githubIssueUrl = issue.html_url;
      saveCustomers(customers);
    }

    console.log(`✅ GitHub issue created: ${issue.html_url}`);
    return issue;
  } catch (error) {
    console.error('❌ Failed to create GitHub issue:', error.message);
    return null;
  }
}

// GET customer list (admin only)
router.get('/server/customers', (req, res) => {
  const pass = req.query.pass;
  if (!pass || pass !== process.env.ADMIN_PASS) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const customers = readCustomers();
  res.json({ total: customers.length, customers });
});

// GET single customer
router.get('/server/customers/:id', (req, res) => {
  const pass = req.query.pass;
  if (!pass || pass !== process.env.ADMIN_PASS) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const customers = readCustomers();
  const customer = customers.find(c => c.id === req.params.id);
  
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  
  res.json(customer);
});

export default router;
