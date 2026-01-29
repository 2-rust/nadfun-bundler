import mongoose from 'mongoose';
import { ENV } from './env';

const uri = ENV.MONGO_URI || 'mongodb://localhost:27017/polymarket_copytrading';

const connectDB = async () => {
    try {
        await mongoose.connect(uri);
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

export default connectDB;
