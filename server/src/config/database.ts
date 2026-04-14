import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/plugstore';
    
    // Log connection attempt (without sensitive info)
    const uriForLog = mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    console.log('🔌 Attempting MongoDB connection...');
    console.log(`   URI: ${uriForLog}`);
    
    // Connection options for better error handling
    const options = {
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000,
    };
    
    const conn = await mongoose.connect(mongoURI, options);

    console.log('✅ MongoDB: Connected successfully');
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
  } catch (error: any) {
    console.log('\n❌ MongoDB: Connection failed');
    console.log(`   Error: ${error.message}`);
    
    // Provide helpful debugging information
    if (error.message.includes('ENOTFOUND') || error.message.includes('querySrv')) {
      console.log('\n🔍 Debugging Information:');
      console.log('   This appears to be a DNS resolution issue.');
      console.log('   Possible causes:');
      console.log('   1. MongoDB Atlas cluster does not exist or was deleted');
      console.log('   2. Incorrect cluster hostname in connection string');
      console.log('   3. Network connectivity issues');
      console.log('\n💡 Solutions:');
      console.log('   1. Verify your MongoDB Atlas cluster exists and is running');
      console.log('   2. Check your MONGODB_URI in .env file');
      console.log('   3. Get a fresh connection string from MongoDB Atlas dashboard');
      console.log('   4. Or switch to local MongoDB: mongodb://localhost:27017/plugstore');
    } else if (error.message.includes('authentication failed')) {
      console.log('\n🔍 Authentication failed:');
      console.log('   Check your username and password in the connection string');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('\n🔍 Connection refused:');
      console.log('   Make sure MongoDB is running locally');
      console.log('   Or verify your MongoDB Atlas network access settings');
    }
    
    console.log('\n📝 Current MONGODB_URI format:');
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/plugstore';
    const uriForLog = mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    console.log(`   ${uriForLog}\n`);
    
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB: Disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB: Connection error:', err);
});

export default connectDB;

