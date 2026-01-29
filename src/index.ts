import connectDB from './config/db';
import { ENV } from './config/env';
import createClobClient from './utils/createClobClient';
import tradeExecutor from './services/tradeExecutor';
import tradeMonitor from './services/tradeMonitor';
import test from './test/test';

const USER_ADDRESS = ENV.USER_ADDRESS;
const PROXY_WALLET = ENV.PROXY_WALLET;

export const main = async () => {
    await connectDB();
    console.log(`Target User Wallet addresss is: ${USER_ADDRESS}`);
    console.log(`My Wallet addresss is: ${PROXY_WALLET}`);
    const clobClient = await createClobClient();
    tradeMonitor();  //Monitor target user's transactions
    tradeExecutor(clobClient);  //Execute transactions on your wallet
    // test(clobClient);
};

main();
