
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function findUser() {
  await mongoose.connect(process.env.MONGODB_URI);
  const email = 'chamarthy.mahesh@gmail.com';
  const user = await User.findOne({ email });
  
  if (user) {
    console.log('✅ User found:');
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log('Note: Password is hashed and cannot be read directly.');
    
    // Let's reset it to a known default if the user wants
    const newPass = 'User@2025';
    user.password = newPass;
    await user.save();
    console.log(`\n🔑 Password has been RESET to: ${newPass}`);
  } else {
    console.log('❌ User not found in database.');
  }
  
  await mongoose.disconnect();
}

findUser();
