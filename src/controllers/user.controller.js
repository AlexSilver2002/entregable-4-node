const catchError = require('../utils/catchError');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const sendEmail = require('../utils/sendEmail');
const EmailCode = require('../models/EmailCode');
const jwt = require('jsonwebtoken');

const getAll = catchError(async (req, res) => {
  const results = await User.findAll();
  res.json(results);
});

const create = catchError(async (req, res) => {
  const {
    email, password, firstName, lastName, country, image, frontBaseUrl
  } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    email, password: hashedPassword, firstName, lastName, country, image
  });

  const code = require('crypto').randomBytes(32).toString('hex');
  const link = `${frontBaseUrl}/verify_email/${code}`;

  await sendEmail({
    to: email,
    subject: "verificate email for user app",
    html: `
      <h1>Hello ${firstName} ${lastName}</h1>
      <b>Verify your account clicking this link</b>
      <a href="${link}" target="_blank">${link}</a>
      <h3>Thank you</h3>
    `
  });

  await EmailCode.create({ code, userId: user.id });
  res.status(201).json(user);
});

const getOne = catchError(async (req, res) => {
  const { id } = req.params;
  const result = await User.findByPk(id);
  if (!result) res.sendStatus(404);
  res.json(result);
});

const remove = catchError(async (req, res) => {
  const { id } = req.params;
  await User.destroy({ where: { id } });
  res.sendStatus(204);
});

const update = catchError(async (req, res) => {
  const { id } = req.params;
  const result = await User.update(req.body, { where: { id }, returning: true });
  if (result[0] === 0) res.sendStatus(404);
  res.json(result[1][0]);
});

const verifyCode = catchError(async (req, res) => {
  const { code } = req.params;
  const codeFound = await EmailCode.findOne({ where: { code } });
  if (!codeFound) res.status(401).json({ message: "Invalid code" });
  
  await User.update({ isVerified: true }, { where: { id: codeFound.userId }, returning: true });
  await codeFound.destroy();
  res.json(user);
});

const login = catchError(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user || !await bcrypt.compare(password, user.password) || !user.isVerified) {
    res.status(401).json({ message: "Invalid credentials" });
  } else {
    const token = jwt.sign({ user }, process.env.TOKEN_SECRET, { expiresIn: "1d" });
    res.json({ user, token });
  }
});

const getLoggedUser = catchError(async (req, res) => {
  const user = req.user;
  res.json(user);
});

module.exports = {
  getAll,
  create,
  getOne,
  remove,
  update,
  verifyCode,
  login,
  getLoggedUser
};
