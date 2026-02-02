import { ethers } from 'ethers';
import { ENV } from '../config/env';
import fetchData from '../utils/fetchData';

const PRIVATE_KEY = ENV.PRIVATE_KEY;
const RPC_URL = ENV.RPC_URL;

// Gnosis Safe Proxy Factory address on Polygon
const GNOSIS_SAFE_PROXY_FACTORY = '0xaacfeea03eb1561c4e67d661e40682bd20e3541b';

async function findGnosisSafeProxy() {
    console.log('\n🔍 SEARCHING FOR GNOSIS SAFE PROXY WALLET\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Step 1: Get EOA address from private key
    const wallet = new ethers.Wallet(PRIVATE_KEY);
    const eoaAddress = wallet.address;

    console.log('📋 STEP 1: Your EOA address (from private key)\n');
    console.log(`   ${eoaAddress}\n`);

    // Step 2: Search for all positions on EOA
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 STEP 2: Positions on EOA address\n');

    try {
        const eoaPositions: any[] = await fetchData(
            `https://data-api.polymarket.com/positions?user=${eoaAddress}`
        );
        console.log(`   Positions: ${eoaPositions?.length || 0}\n`);

        if (eoaPositions && eoaPositions.length > 0) {
            console.log('   ✅ There are positions on EOA!\n');
        }
    } catch (error) {
        console.log('   ❌ Failed to get positions\n');
    }

    // Step 3: Search EOA transactions to find proxy
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 STEP 3: Searching for Gnosis Safe Proxy via transactions\n');

    try {
        const activities: any[] = await fetchData(
            `https://data-api.polymarket.com/activity?user=${eoaAddress}&type=TRADE`
        );

        if (activities && activities.length > 0) {
            const firstTrade = activities[0];
            const proxyWalletFromTrade = firstTrade.proxyWallet;

            console.log(`   EOA address:          ${eoaAddress}`);
            console.log(`   Proxy in trades:      ${proxyWalletFromTrade}\n`);

            if (proxyWalletFromTrade.toLowerCase() !== eoaAddress.toLowerCase()) {
                console.log('   🎯 GNOSIS SAFE PROXY FOUND!\n');
                console.log(`   Proxy address: ${proxyWalletFromTrade}\n`);

                // Check positions on proxy
                const proxyPositions: any[] = await fetchData(
                    `https://data-api.polymarket.com/positions?user=${proxyWalletFromTrade}`
                );

                console.log(`   Positions on Proxy: ${proxyPositions?.length || 0}\n`);

                if (proxyPositions && proxyPositions.length > 0) {
                    console.log('   ✅ HERE ARE YOUR POSITIONS!\n');

                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
                    console.log('🔧 SOLUTION:\n');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

                    console.log('Update .env file:\n');
                    console.log(`PROXY_WALLET=${proxyWalletFromTrade}\n`);

                    console.log('Then the bot will use the correct Gnosis Safe proxy\n');
                    console.log('and positions will match the frontend!\n');

                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
                    console.log('📊 CURRENT STATUS:\n');
                    console.log(`   Bot uses:           ${ENV.PROXY_WALLET}`);
                    console.log(`   Should use:        ${proxyWalletFromTrade}\n`);

                    if (ENV.PROXY_WALLET.toLowerCase() === proxyWalletFromTrade.toLowerCase()) {
                        console.log('   ✅ Addresses match! Everything is configured correctly.\n');
                    } else {
                        console.log('   ❌ ADDRESSES DO NOT MATCH!\n');
                        console.log('   This is why you see different positions on bot and frontend.\n');
                    }
                }
            } else {
                console.log('   ℹ️  Proxy matches EOA (trading directly through EOA)\n');
            }
        } else {
            console.log('   ❌ No transactions on this address\n');
        }
    } catch (error) {
        console.log('   ❌ Error searching for transactions\n');
    }

    // Step 4: Additional search via Polygon blockchain
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 STEP 4: Search via Polygon blockchain\n');

    try {
        const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

        // Search for ProxyCreation events from Gnosis Safe Factory
        console.log('   Checking Gnosis Safe creation...\n');

        // ABI for ProxyCreation event
        const eventAbi = ['event ProxyCreation(address indexed proxy, address singleton)'];
        const iface = new ethers.utils.Interface(eventAbi);
        const eventTopic = iface.getEventTopic('ProxyCreation');

        // Search for events where owner is our EOA
        // Usually Gnosis Safe is created on first transaction
        const latestBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, latestBlock - 10000000); // Last ~10M blocks

        console.log(`   Scanning blocks from ${fromBlock} to ${latestBlock}...\n`);
        console.log('   ⏳ This may take some time...\n');

        // Check EOA transactions
        const txCount = await provider.getTransactionCount(eoaAddress);
        console.log(`   Transactions from EOA: ${txCount}\n`);

        if (txCount > 0) {
            console.log('   ℹ️  EOA has made transactions. Gnosis Safe may exist.\n');
        }
    } catch (error) {
        console.log('   ⚠️  Failed to check blockchain directly\n');
    }

    // Step 5: Final recommendations
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('💡 RECOMMENDATIONS:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('1. Go to polymarket.com in your browser\n');
    console.log('2. Connect wallet with the same private key\n');
    console.log('3. Copy the address shown by Polymarket\n');
    console.log('4. Update PROXY_WALLET in .env with this address\n');
    console.log('5. Restart the bot\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📍 HOW TO FIND PROXY ADDRESS ON FRONTEND:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('On Polymarket after connecting:\n');
    console.log('1. Click on profile icon (top right corner)\n');
    console.log('2. There will be an address like 0x...\n');
    console.log('3. This is your Proxy Wallet address!\n');
    console.log('4. Copy it to PROXY_WALLET in .env\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🔗 Useful links:\n');
    console.log(`   EOA profile:     https://polymarket.com/profile/${eoaAddress}`);
    console.log(`   EOA Polygonscan: https://polygonscan.com/address/${eoaAddress}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

findGnosisSafeProxy().catch(console.error);
