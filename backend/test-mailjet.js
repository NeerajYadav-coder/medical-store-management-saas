const apiKey = process.env.MAILJET_API_KEY || 'df5b7fd4278726bd1a0a6d5f560869f2';
const apiSecret = process.env.MAILJET_SECRET_KEY || '9d217956d744248d819922994605b469';
const senderEmail = process.env.SMTP_USER || 'support.krishnapharmacy@gmail.com';

const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

const payload = {
  Messages: [
    {
      From: {
        Email: senderEmail,
        Name: "Krishna Pharmacy"
      },
      To: [
        {
          Email: "neerajbhaiya1508@gmail.com",
          Name: "Neeraj"
        }
      ],
      Subject: "Mailjet API Test",
      TextPart: "It works!",
      HTMLPart: "<h3>It works!</h3>"
    }
  ]
};

fetch('https://api.mailjet.com/v3.1/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${auth}`
  },
  body: JSON.stringify(payload)
})
.then(res => res.json())
.then(data => console.log('Mailjet Response:', JSON.stringify(data, null, 2)))
.catch(err => console.error('Error:', err));
