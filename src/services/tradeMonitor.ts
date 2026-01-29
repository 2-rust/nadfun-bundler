import { ENV } from '../config/env';
import { UserActivityInterface } from '../interfaces/User';
import { getUserActivityModel } from '../models/userHistory';
import fetchData from '../utils/fetchData';

const USER_ADDRESS = ENV.USER_ADDRESS;
const TOO_OLD_TIMESTAMP = ENV.TOO_OLD_TIMESTAMP;
const FETCH_INTERVAL = ENV.FETCH_INTERVAL;

if (!USER_ADDRESS) {
    throw new Error('USER_ADDRESS is not defined');
}

const UserActivity = getUserActivityModel(USER_ADDRESS);

let temp_trades: UserActivityInterface[] = [];

const init = async () => {
    temp_trades = (await UserActivity.find().exec()).map((trade) => trade as UserActivityInterface);
};

const fetchTradeData = async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const cutoffSec = nowSec - TOO_OLD_TIMESTAMP * 3600;
    const url = `https://data-api.polymarket.com/activity?user=${USER_ADDRESS}&type=TRADE&limit=100&start=${cutoffSec}&end=${nowSec}&sortBy=TIMESTAMP&sortDirection=DESC`;
    try {
        const activities: UserActivityInterface[] = await fetchData(url);
        for (const activity of activities) {
            const existing = await UserActivity.findOne({
                transactionHash: activity.transactionHash,
                asset: activity.asset,
                timestamp: activity.timestamp,
            }).exec();
            if (!existing) {
                await UserActivity.create({
                    ...activity,
                    bot: false,
                });
            }
        }
    } catch (err) {
        console.error('Error fetching trade data:', err);
    }
};

const tradeMonitor = async () => {
    console.log('Trade Monitor is running every', FETCH_INTERVAL, 'seconds');
    await init();    // Load my orders before server downs
    while (true) {
        await fetchTradeData();     //Fetch all user activities
        await new Promise((resolve) => setTimeout(resolve, FETCH_INTERVAL * 1000));     //Fetch user activities every second
    }
};

export default tradeMonitor;
