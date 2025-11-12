import fetch from 'node-fetch';

function baseUrl(env){ 
	return env === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'; 
}

async function getAccessToken(){ 
	const client = process.env.PAYPAL_CLIENT_ID; 
	const secret = process.env.PAYPAL_SECRET; 
	const r = await fetch(baseUrl(process.env.PAYPAL_ENV||'sandbox') + '/v1/oauth2/token', { 
		method:'POST', 
		headers:{ 
			'Authorization':'Basic '+Buffer.from(client+':'+secret).toString('base64'), 
			'Content-Type':'application/x-www-form-urlencoded' 
		}, 
		body:'grant_type=client_credentials' 
	}); 
	const j = await r.json(); 
	return j.access_token; 
}

// Send payout to PayPal email
export async function sendPayoutToEmail(receiverEmail, amount, currency='AUD', note='Payout'){ 
	const token = await getAccessToken(); 
	const body = { 
		sender_batch_header:{ 
			sender_batch_id:''+Date.now(), 
			email_subject:'Payout from PayLinkBridge' 
		}, 
		items:[{ 
			recipient_type:'EMAIL', 
			amount:{ 
				value: Number(amount).toFixed(2), 
				currency 
			}, 
			receiver: receiverEmail, 
			note 
		}] 
	}; 
	const resp = await fetch(baseUrl(process.env.PAYPAL_ENV||'sandbox') + '/v1/payments/payouts', { 
		method:'POST', 
		headers:{ 
			'Authorization':'Bearer '+token, 
			'Content-Type':'application/json' 
		}, 
		body: JSON.stringify(body) 
	}); 
	return resp.json(); 
}

// Send payout to bank account
export async function sendPayoutToBank(amount, currency='AUD', note='Payout'){
	const token = await getAccessToken();
	const body = {
		sender_batch_header:{
			sender_batch_id:''+Date.now(),
			email_subject:'Bank Transfer from PayLinkBridge'
		},
		items:[{
			recipient_type:'BANK_ACCOUNT',
			amount:{
				value: Number(amount).toFixed(2),
				currency
			},
			receiver:{
				account_number: process.env.BANK_ACCOUNT_NUMBER || '4760652200',
				routing_number: process.env.BANK_BSB || '062948',
				account_type: 'CHECKING'
			},
			note
		}]
	};
	const resp = await fetch(baseUrl(process.env.PAYPAL_ENV||'sandbox') + '/v1/payments/payouts', {
		method:'POST',
		headers:{
			'Authorization':'Bearer '+token,
			'Content-Type':'application/json'
		},
		body: JSON.stringify(body)
	});
	return resp.json();
}

// Legacy export for backwards compatibility
export async function sendPayout(receiverEmail, amount, currency='AUD', note='Payout'){
	return sendPayoutToEmail(receiverEmail, amount, currency, note);
}
