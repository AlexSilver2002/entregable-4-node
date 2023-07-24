const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
      }
    });

    const mailOptions = {
      from: process.env.EMAIL,
      ...options
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(info);
    return { message: "Email sent successfully" };
  } catch (error) {
    console.log(error);
    throw { message: "An error has occurred" };
  }
};

module.exports = sendEmail;
