import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import 'dotenv/config';

const PORT = process.env.PORT ?? 80
const ALLOWED_CODES = process.env.ALLOWED_CODES ?? "";
const LOGIN_USER = process.env.LOGIN_USER;

const allowedCodes = new Set(ALLOWED_CODES.split(",").map(c => c.trim()));

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/login", (req, res) => {
  const { code } = req.body;
  if (!allowedCodes.has(code)) {
    res.json({}).end();
    return;
  }
  res.json({ user: LOGIN_USER }).end();
});

app.listen(PORT, () => {
  return console.log(`Listening at http://localhost:${PORT}`);
});
