// Script per generare hash password con bcrypt
const bcrypt = require('bcrypt');

async function hashPassword(password) {
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  console.log('Password hash:', hash);
  return hash;
}

// Genera hash per la password "pupo"
hashPassword('pupo');