const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function test() {
  const client = new Client({ 
    host: 'localhost', 
    port: 5434,
    user: 'medfield_user', 
    password: 'medfield_password', 
    database: 'medfield' 
  });
  await client.connect();
  const res = await client.query('SELECT username, password FROM users WHERE username = $1', ['admin']);
  console.log('DB Hash:', res.rows[0].password);
  console.log('Password Match:', bcrypt.compareSync('password', res.rows[0].password));
  await client.end();
}

test();