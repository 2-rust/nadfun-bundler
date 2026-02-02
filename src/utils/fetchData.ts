import axios, { AxiosError } from 'axios';
import { ENV } from '../config/env';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isNetworkError = (error: unknown): boolean => {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        const code = axiosError.code;
        // Network timeout/connection errors
        return (
            code === 'ETIMEDOUT' ||
            code === 'ENETUNREACH' ||
            code === 'ECONNRESET' ||
            code === 'ECONNREFUSED' ||
            !axiosError.response
        ); // No response = network issue
    }
    return false;
};

const fetchData = async (url: string) => {
    const retries = ENV.NETWORK_RETRY_LIMIT;
    const timeout = ENV.REQUEST_TIMEOUT_MS;
    const retryDelay = 1000; // 1 second base delay

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await axios.get(url, {
                timeout,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
                // Force IPv4 to avoid IPv6 connectivity issues
                family: 4,
            });
            return response.data;
        } catch (error) {
            const isLastAttempt = attempt === retries;

            if (isNetworkError(error) && !isLastAttempt) {
                const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff: 1s, 2s, 4s
                console.warn(
                    `⚠️  Network error (attempt ${attempt}/${retries}), retrying in ${delay / 1000}s...`
                );
                await sleep(delay);
                continue;
            }

            // If it's the last attempt or not a network error, throw
            if (isLastAttempt && isNetworkError(error)) {
                console.error(
                    `❌ Network timeout after ${retries} attempts -`,
                    axios.isAxiosError(error) ? error.code : 'Unknown error'
                );
            }
            throw error;
        }
    }
};

export default fetchData;
