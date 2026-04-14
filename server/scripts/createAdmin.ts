import dotenv from 'dotenv';
import mongoose from 'mongoose';
import * as readline from 'readline';
import Admin from '../src/models/Admin';

// Load environment variables
dotenv.config();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Helper function to prompt for user input
const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

// Helper function to prompt for password (hidden input)
const questionPassword = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    process.stdout.write(query);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    let password = '';
    const onData = (char: string) => {
      char = char.toString();

      switch (char) {
        case '\n':
        case '\r':
        case '\u0004': // Ctrl+D
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeListener('data', onData);
          process.stdout.write('\n');
          resolve(password);
          break;
        case '\u0003': // Ctrl+C
          process.exit();
          break;
        case '\u007f': // Backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write('\b \b');
          }
          break;
        default:
          password += char;
          process.stdout.write('*');
          break;
      }
    };

    process.stdin.on('data', onData);
  });
};

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/plugstore';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB\n');

    // Get admin credentials from user input
    console.log('Please enter admin account details:\n');
    
    const adminEmail = await question('Email: ');
    if (!adminEmail || !adminEmail.includes('@')) {
      console.log('❌ Invalid email address');
      rl.close();
      await mongoose.connection.close();
      process.exit(1);
    }

    const adminUsername = await question('Username: ');
    if (!adminUsername || adminUsername.trim().length < 3) {
      console.log('❌ Username must be at least 3 characters');
      rl.close();
      await mongoose.connection.close();
      process.exit(1);
    }

    const adminPassword = await questionPassword('Password: ');
    if (!adminPassword || adminPassword.length < 6) {
      console.log('❌ Password must be at least 6 characters');
      rl.close();
      await mongoose.connection.close();
      process.exit(1);
    }

    rl.close();

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: adminEmail.toLowerCase() });
    
    if (existingAdmin) {
      console.log(`\n⚠️  Admin with email ${adminEmail} already exists.`);
      console.log('   Skipping admin creation.');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Create admin account
    const admin = await Admin.create({
      email: adminEmail.toLowerCase().trim(),
      username: adminUsername.trim(),
      password: adminPassword,
      isEmailVerified: true, // Auto-verify admin email
    });

    console.log('\n✅ Admin account created successfully!');
    console.log('\n📋 Admin Credentials:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Username: ${admin.username}`);
    console.log('\n⚠️  Please keep your password secure!');

    // Close connection
    await mongoose.connection.close();
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error creating admin account:', error.message);
    rl.close();
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the script
createAdmin();

