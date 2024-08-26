const amqp = require('amqplib/callback_api');
const nodemailer = require('nodemailer');

// Configure the email transport using Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail', // or another service provider
  auth: {
    user: 'vuvishnu23@gmail.com', // your email
    pass: 'ytsxoxectagqjmoa'
  }
});

amqp.connect('amqp://localhost', (error0, connection) => {
  if (error0) {
    throw error0;
  }
  connection.createChannel((error1, channel) => {
    if (error1) {
      throw error1;
    }

    const employeeQueue = 'employee_notifications';
    const assetQueue = 'asset_notifications';

    channel.assertQueue(employeeQueue, {
      durable: false
    });

    channel.assertQueue(assetQueue, {
      durable: false
    });

    console.log(" [*] Waiting for messages. To exit press CTRL+C");

    channel.consume(employeeQueue, (msg) => {
      const { email, name, employeeId } = JSON.parse(msg.content.toString());

      const mailOptions = {
        from: 'vuvishnu23@gmail.com',
        to: email,
        subject: 'Your Employee ID has been created',
        text: `Hello ${name},\n\nYour employee ID is created successfully. Your Employee ID is: ${employeeId}\n\nRegards,\nYour Company Name`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('Error sending email:', error);
        } else {
          console.log('Email sent:', info.response);
        }
      });

      console.log(" [x] Received '%s'", msg.content.toString());
    }, {
      noAck: true
    });

    channel.consume(assetQueue, (msg) => {
      const { email, name, assetId, issueDate } = JSON.parse(msg.content.toString());

      const mailOptions = {
        from: 'vuvishnu23@gmail.com',
        to: email,
        subject: 'Asset Issued to You',
        text: `Hello ${name},\n\nAn asset with ID ${assetId} has been issued to you on ${issueDate}.\n\nRegards,\nYour Company Name`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('Error sending email:', error);
        } else {
          console.log('Email sent:', info.response);
        }
      });

      console.log(" [x] Received '%s'", msg.content.toString());
    }, {
      noAck: true
    });
  });
});
