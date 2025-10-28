// src/services/emailService.js
const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Generate HTML bill template
const generateBillHTML = (bill) => {
  const billDate = new Date(bill.billDate).toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const itemsHTML = bill.items.map((item, index) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${index + 1}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <strong>${item.name}</strong><br/>
        <small style="color: #666;">${item.brand} | ${item.pid}</small>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${parseFloat(item.price).toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${parseFloat(item.amount).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice - ${bill.billNumber}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">TAX INVOICE</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Invoice #${bill.billNumber}</p>
      </div>
      
      <!-- Company & Customer Info -->
      <div style="background: #f8f9fa; padding: 30px; border-left: 1px solid #ddd; border-right: 1px solid #ddd;">
        <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 250px; margin-bottom: 20px;">
            <h2 style="color: #667eea; margin: 0 0 15px 0; font-size: 20px;">From:</h2>
            <p style="margin: 5px 0; font-weight: bold; font-size: 18px;">${bill.branchName}</p>
            <p style="margin: 5px 0; color: #666;">${bill.branchLocation || 'N/A'}</p>
            <p style="margin: 5px 0; color: #666;">Branch ID: ${bill.branchId}</p>
            <p style="margin: 5px 0; color: #666;">GSTIN: 29ABCDE1234F1Z5</p>
          </div>
          
          <div style="flex: 1; min-width: 250px; margin-bottom: 20px;">
            <h2 style="color: #667eea; margin: 0 0 15px 0; font-size: 20px;">Bill To:</h2>
            <p style="margin: 5px 0; font-weight: bold; font-size: 18px;">${bill.customer.name}</p>
            <p style="margin: 5px 0; color: #666;">Phone: ${bill.customer.phone}</p>
            ${bill.customer.email ? `<p style="margin: 5px 0; color: #666;">Email: ${bill.customer.email}</p>` : ''}
            ${bill.customer.address ? `<p style="margin: 5px 0; color: #666;">${bill.customer.address}</p>` : ''}
          </div>
        </div>
        
        <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #ddd;">
          <p style="margin: 5px 0;"><strong>Invoice Date:</strong> ${billDate}</p>
          <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${bill.paymentMethod}</p>
          <p style="margin: 5px 0;"><strong>Served By:</strong> ${bill.staffName}</p>
        </div>
      </div>
      
      <!-- Items Table -->
      <div style="background: white; padding: 0; border-left: 1px solid #ddd; border-right: 1px solid #ddd;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #667eea; color: white;">
              <th style="padding: 15px 12px; text-align: left;">#</th>
              <th style="padding: 15px 12px; text-align: left;">Product Details</th>
              <th style="padding: 15px 12px; text-align: center;">Qty</th>
              <th style="padding: 15px 12px; text-align: right;">Rate</th>
              <th style="padding: 15px 12px; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>
      </div>
      
      <!-- Totals -->
      <div style="background: #f8f9fa; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 10px 10px;">
        <div style="max-width: 400px; margin-left: auto;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd;">
            <span>Subtotal:</span>
            <span style="font-weight: bold;">₹${parseFloat(bill.totals.subtotal).toFixed(2)}</span>
          </div>
          
          ${bill.discount > 0 ? `
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd; color: #28a745;">
            <span>Discount (${bill.discount}%):</span>
            <span style="font-weight: bold;">- ₹${parseFloat(bill.totals.discountAmount).toFixed(2)}</span>
          </div>
          ` : ''}
          
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd;">
            <span>Taxable Amount:</span>
            <span style="font-weight: bold;">₹${parseFloat(bill.totals.taxableAmount).toFixed(2)}</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd;">
            <span>CGST (${bill.gstRate / 2}%):</span>
            <span style="font-weight: bold;">₹${(parseFloat(bill.totals.gstAmount) / 2).toFixed(2)}</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 2px solid #667eea;">
            <span>SGST (${bill.gstRate / 2}%):</span>
            <span style="font-weight: bold;">₹${(parseFloat(bill.totals.gstAmount) / 2).toFixed(2)}</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; padding: 15px 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; margin-top: 10px; padding: 20px; border-radius: 8px;">
            <span style="font-size: 18px; font-weight: bold;">Total Amount:</span>
            <span style="font-size: 24px; font-weight: bold;">₹${parseFloat(bill.totals.total).toFixed(2)}</span>
          </div>
        </div>
        
        ${bill.notes ? `
        <div style="margin-top: 25px; padding: 15px; background: white; border-left: 4px solid #667eea; border-radius: 4px;">
          <strong style="color: #667eea;">Notes:</strong>
          <p style="margin: 8px 0 0 0; color: #666;">${bill.notes}</p>
        </div>
        ` : ''}
      </div>
      
      <!-- Footer -->
      <div style="text-align: center; padding: 30px 20px; color: #666; border-top: 2px solid #ddd; margin-top: 30px;">
        <p style="margin: 10px 0; font-size: 18px; color: #667eea; font-weight: bold;">Thank you for your business!</p>
        <p style="margin: 10px 0; font-size: 14px;">This is a computer-generated invoice and does not require a signature.</p>
        <p style="margin: 10px 0; font-size: 12px; color: #999;">Terms & Conditions: Goods once sold cannot be returned or exchanged.</p>
      </div>
      
    </body>
    </html>
  `;
};

// Send bill via email
const sendBillEmail = async (bill, recipientEmail) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: bill.branchName,
        address: process.env.EMAIL_FROM
      },
      to: recipientEmail,
      subject: `Invoice ${bill.billNumber} - ${bill.branchName}`,
      html: generateBillHTML(bill),
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully:', info.messageId);
    return {
      success: true,
      messageId: info.messageId,
      message: 'Email sent successfully'
    };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
};

// Verify email configuration
const verifyEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email configuration verified');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error);
    return false;
  }
};

module.exports = {
  sendBillEmail,
  verifyEmailConfig,
  generateBillHTML
};