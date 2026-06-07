import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/logszone';

      console.log('   4. Or switch to local MongoDB: mongodb://localhost:27017/logszone');

    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/logszone';
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

