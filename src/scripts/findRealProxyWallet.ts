import { ethers } from 'ethers';
import { ENV } from '../config/env';
import fetchData from '../utils/fetchData';

const PRIVATE_KEY = ENV.PRIVATE_KEY;
const RPC_URL = ENV.RPC_URL;

async function findRealProxyWallet() {
    console.log('\n🔍 SEARCHING FOR REAL PROXY WALLET\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const wallet = new ethers.Wallet(PRIVATE_KEY);
    const eoaAddress = wallet.address;

    console.log('📋 EOA address (from private key):\n');
    console.log(`   ${eoaAddress}\n`);

    // Step 1: Check username API
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 STEP 1: Checking username via API\n');

    try {
        // Try to get user profile
        const userProfile = await fetchData(`https://data-api.polymarket.com/users/${eoaAddress}`);

        console.log('   Profile data:', JSON.stringify(userProfile, null, 2), '\n');
    } catch (error) {
        console.log('   ⚠️  Failed to get profile via /users\n');
    }

    // Step 2: Check all transactions on blockchain
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 STEP 2: Analyzing transactions on Polygon\n');

    try {
        const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

        // Get recent transactions
        console.log('   Getting transaction history...\n');

        // Use Polygonscan API
        const polygonscanApiKey = 'YourApiKeyToken'; // Free tier
        const polygonscanUrl = `https://api.polygonscan.com/api?module=account&action=txlist&address=${eoaAddress}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=${polygonscanApiKey}`;

        try {
            const response = await fetch(polygonscanUrl);
            const data = await response.json();

            if (data.status === '1' && data.result && data.result.length > 0) {
                console.log(`   ✅ Found transactions: ${data.result.length}\n`);

                // Look for interactions with Gnosis Safe Factory or Proxy
                const gnosisSafeFactories = [
                    '0xaacfeea03eb1561c4e67d661e40682bd20e3541b', // Gnosis Safe Proxy Factory
                    '0xab45c5a4b0c941a2f231c04c3f49182e1a254052', // Polymarket Proxy Factory
                ];

                const relevantTxs = data.result.filter((tx: any) =>
                    gnosisSafeFactories.some(
                        (factory) => tx.to?.toLowerCase() === factory.toLowerCase()
                    )
                );

                if (relevantTxs.length > 0) {
                    console.log('   🎯 Found transactions with Proxy Factory:\n');

                    for (const tx of relevantTxs.slice(0, 3)) {
                        console.log(`      TX: ${tx.hash}`);
                        console.log(`      To: ${tx.to}`);
                        console.log(`      Block: ${tx.blockNumber}\n`);

                        // Get receipt to find created contract
                        try {
                            const receipt = await provider.getTransactionReceipt(tx.hash);

                            if (receipt && receipt.logs && receipt.logs.length > 0) {
                                console.log(`      📝 Logs in transaction:\n`);

                                // Look for proxy creation events
                                for (const log of receipt.logs) {
                                    console.log(`         Contract: ${log.address}`);

                                    // Check if this is a contract address
                                    const code = await provider.getCode(log.address);
                                    if (code !== '0x') {
                                        console.log(`         ✅ This is a smart contract!\n`);

                                        // Check if there are positions on this address
                                        const positions: any[] = await fetchData(
                                            `https://data-api.polymarket.com/positions?user=${log.address}`
                                        );

                                        if (positions && positions.length > 0) {
                                            console.log(`         🎉 FOUND PROXY WITH POSITIONS!\n`);
                                            console.log(`         Proxy address: ${log.address}`);
                                            console.log(`         Positions: ${positions.length}\n`);

                                            console.log(
                                                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
                                            );
                                            console.log('✅ SOLUTION FOUND!\n');
                                            console.log(
                                                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
                                            );
                                            console.log(`Update .env file:\n`);
                                            console.log(`PROXY_WALLET=${log.address}\n`);
                                            return;
                                        }
                                    }
                                }
                            }
                        } catch (e) {
                            console.log(`      ⚠️  Failed to get receipt\n`);
                        }
                    }
                } else {
                    console.log('   ❌ No transactions with Proxy Factory\n');
                }
            }
        } catch (e) {
            console.log('   ⚠️  Polygonscan API unavailable (API key needed)\n');
        }
    } catch (error) {
        console.log('   ⚠️  Error analyzing transactions\n');
    }

    // Step 3: Check via token balance
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 STEP 3: Search via balance API\n');

    try {
        const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

        // USDC contract on Polygon
        const USDC_ADDRESS = '0x2791bca1f2de4661ed88a30c99a7a9449aa84174';
        const usdcAbi = [
            'function balanceOf(address owner) view returns (uint256)',
            'event Transfer(address indexed from, address indexed to, uint256 value)',
        ];

        const usdcContract = new ethers.Contract(USDC_ADDRESS, usdcAbi, provider);

        // Check balance on EOA
        const balance = await usdcContract.balanceOf(eoaAddress);
        console.log(`   USDC on EOA: ${ethers.utils.formatUnits(balance, 6)}\n`);

        // Look for Transfer events related to our EOA
        console.log('   Searching for USDC transfers...\n');

        const latestBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, latestBlock - 1000000); // Last ~1M blocks

        const transferFilter = usdcContract.filters.Transfer(eoaAddress, null);
        const events = await usdcContract.queryFilter(transferFilter, fromBlock, latestBlock);

        if (events.length > 0) {
            console.log(`   ✅ Found USDC transfers: ${events.length}\n`);

            // Collect unique recipient addresses
            const recipients = new Set<string>();
            for (const event of events) {
                if (event.args && event.args.to) {
                    recipients.add(event.args.to.toLowerCase());
                }
            }

            console.log('   Checking recipients for positions...\n');

            for (const recipient of Array.from(recipients).slice(0, 5)) {
                const positions: any[] = await fetchData(
                    `https://data-api.polymarket.com/positions?user=${recipient}`
                );

                if (positions && positions.length > 0) {
                    console.log(`   🎯 Address with positions: ${recipient}`);
                    console.log(`   Positions: ${positions.length}\n`);
                }
            }
        }
    } catch (error) {
        console.log('   ⚠️  Failed to check USDC transfers\n');
    }

    // Step 4: Final instructions
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('💡 MANUAL METHOD (100% works):\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('1. Open polymarket.com\n');
    console.log('2. Import private key into MetaMask:\n');
    console.log(`   ${PRIVATE_KEY.slice(0, 10)}...${PRIVATE_KEY.slice(-6)}\n`);
    console.log('3. Connect to Polymarket\n');
    console.log('4. Open browser console (F12)\n');
    console.log('5. Execute:\n');
    console.log('   localStorage\n');
    console.log('   or\n');
    console.log('   window.ethereum.selectedAddress\n');
    console.log('6. Copy the address you see there\n');
    console.log('7. Send me this address\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🔍 OR check in browser:\n');
    console.log('   1. Go to polymarket.com\n');
    console.log('   2. Connect wallet\n');
    console.log('   3. Click on profile icon\n');
    console.log('   4. Copy the address shown there\n');
    console.log('   5. This is your real Proxy address!\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

findRealProxyWallet().catch(console.error);
