const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    // For development, we use Ethereal Email (a fake SMTP service)
    // If you want to use real email like Gmail, change these credentials.
    let testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });

    const mailOptions = {
      from: '"StreamFlix Support" <noreply@streamflix.com>',
      to: options.email,
      subject: options.subject,
      text: options.message,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✉️ Message sent: %s', info.messageId);
    
    // Preview URL is very useful for testing without a real email account
    console.log('👀 Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = sendEmail;
