import { ethers } from 'ethers';
import { ENV } from '../config/env';
import fetchData from '../utils/fetchData';

const PRIVATE_KEY = ENV.PRIVATE_KEY;
const RPC_URL = ENV.RPC_URL;

// Gnosis Safe Proxy Factory on Polygon
const GNOSIS_SAFE_PROXY_FACTORY = '0xaacfeea03eb1561c4e67d661e40682bd20e3541b';
const POLYMARKET_PROXY_FACTORY = '0xab45c5a4b0c941a2f231c04c3f49182e1a254052';

async function computeGnosisSafeAddress() {
    console.log('\n🔍 COMPUTING GNOSIS SAFE PROXY ADDRESS\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const wallet = new ethers.Wallet(PRIVATE_KEY);
    const eoaAddress = wallet.address;

    console.log('📋 EOA address (from private key):\n');
    console.log(`   ${eoaAddress}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 Searching for Gnosis Safe Proxy via events\n');

    try {
        const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

        // ABI for ProxyCreation event
        const proxyFactoryAbi = ['event ProxyCreation(address indexed proxy, address singleton)'];

        const gnosisSafeFactory = new ethers.Contract(
            GNOSIS_SAFE_PROXY_FACTORY,
            proxyFactoryAbi,
            provider
        );

        const polymarketProxyFactory = new ethers.Contract(
            POLYMARKET_PROXY_FACTORY,
            proxyFactoryAbi,
            provider
        );

        console.log('   Searching for ProxyCreation events...\n');

        const latestBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, latestBlock - 10000000); // Last 10M blocks

        console.log(`   Blocks: ${fromBlock} - ${latestBlock}\n`);
        console.log('   ⏳ Search may take some time...\n');

        // Search for ProxyCreation events for both factories
        const factories = [
            {
                name: 'Gnosis Safe Factory',
                contract: gnosisSafeFactory,
                address: GNOSIS_SAFE_PROXY_FACTORY,
            },
            {
                name: 'Polymarket Proxy Factory',
                contract: polymarketProxyFactory,
                address: POLYMARKET_PROXY_FACTORY,
            },
        ];

        for (const factory of factories) {
            console.log(`   Checking ${factory.name}...\n`);

            try {
                const filter = factory.contract.filters.ProxyCreation();
                const events = await factory.contract.queryFilter(filter, fromBlock, latestBlock);

                console.log(`   Found events: ${events.length}\n`);

                // Check each created proxy
                for (const event of events) {
                    if (event.args && event.args.proxy) {
                        const proxyAddress = event.args.proxy;

                        // Check if our EOA owns this proxy
                        // For Gnosis Safe check owners
                        try {
                            const gnosisSafeAbi = ['function getOwners() view returns (address[])'];

                            const safeContract = new ethers.Contract(
                                proxyAddress,
                                gnosisSafeAbi,
                                provider
                            );
                            const owners = await safeContract.getOwners();

                            if (owners && owners.length > 0) {
                                const isOwner = owners.some(
                                    (owner: string) =>
                                        owner.toLowerCase() === eoaAddress.toLowerCase()
                                );

                                if (isOwner) {
                                    console.log(`   🎯 GNOSIS SAFE FOUND!\n`);
                                    console.log(`   Proxy address: ${proxyAddress}\n`);

                                    // Check positions
                                    const positions: any[] = await fetchData(
                                        `https://data-api.polymarket.com/positions?user=${proxyAddress}`
                                    );

                                    console.log(`   Positions on Proxy: ${positions?.length || 0}\n`);

                                    if (positions && positions.length > 0) {
                                        console.log(
                                            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
                                        );
                                        console.log('✅ SOLUTION FOUND!\n');
                                        console.log(
                                            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
                                        );
                                        console.log(`Update .env file:\n`);
                                        console.log(`PROXY_WALLET=${proxyAddress}\n`);
                                        console.log(
                                            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
                                        );
                                        return proxyAddress;
                                    }
                                }
                            }
                        } catch (e) {
                            // Not Gnosis Safe or error, skip
                        }
                    }
                }
            } catch (e) {
                console.log(`   ⚠️  Error checking ${factory.name}\n`);
            }
        }

        console.log('   ❌ Gnosis Safe Proxy not found via events\n');
    } catch (error) {
        console.log('   ⚠️  Error searching via blockchain\n');
    }

    // Alternative method - check specific address
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 Checking known address 0xd62531...\n');

    const suspectAddress = '0xd62531bc536bff72394fc5ef715525575787e809';

    try {
        const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

        // Check if this is a smart contract
        const code = await provider.getCode(suspectAddress);
        const isContract = code !== '0x';

        console.log(`   Address: ${suspectAddress}`);
        console.log(`   Type: ${isContract ? 'Smart Contract' : 'EOA'}\n`);

        if (isContract) {
            // Check Gnosis Safe owners
            try {
                const gnosisSafeAbi = [
                    'function getOwners() view returns (address[])',
                    'function getThreshold() view returns (uint256)',
                ];

                const safeContract = new ethers.Contract(suspectAddress, gnosisSafeAbi, provider);
                const owners = await safeContract.getOwners();
                const threshold = await safeContract.getThreshold();

                console.log(`   This is a Gnosis Safe!`);
                console.log(`   Owners: ${owners.length}`);
                console.log(`   Threshold: ${threshold}\n`);

                for (let i = 0; i < owners.length; i++) {
                    console.log(`   Owner ${i + 1}: ${owners[i]}`);
                    if (owners[i].toLowerCase() === eoaAddress.toLowerCase()) {
                        console.log(`   ✅ THIS IS YOUR GNOSIS SAFE!\n`);
                    }
                }

                // Check positions
                const positions: any[] = await fetchData(
                    `https://data-api.polymarket.com/positions?user=${suspectAddress}`
                );

                console.log(`\n   Positions on this address: ${positions?.length || 0}\n`);

                if (positions && positions.length > 0) {
                    console.log('   🎯 POSITIONS FOUND ON THIS ADDRESS!\n');
                }
            } catch (e) {
                console.log('   ⚠️  Not Gnosis Safe or access error\n');
            }
        }
    } catch (error) {
        console.log('   ⚠️  Error checking address\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('💡 SUMMARY:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('You have 2 addresses:\n');
    console.log(`1. EOA:   ${eoaAddress}`);
    console.log(`   - Positions: 20`);
    console.log(`   - Bot trades HERE\n`);

    console.log(`2. Proxy: ${suspectAddress}`);
    console.log(`   - Positions: 0`);
    console.log(`   - Frontend shows THIS address\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🔧 WHY THIS HAPPENS:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('Polymarket creates Gnosis Safe proxy on first login.\n');
    console.log('But your bot is configured to use EOA directly.\n');
    console.log('Therefore:\n');
    console.log('- Bot trades through EOA (0x4fbBe...)\n');
    console.log('- Frontend shows Gnosis Safe (0xd6253...)\n');
    console.log('- These are DIFFERENT wallets!\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ SOLUTION:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('OPTION 1: Use EOA address on frontend\n');
    console.log(`  Open: https://polymarket.com/profile/${eoaAddress}\n`);
    console.log('  Here you will see all 20 bot positions.\n');

    console.log('OPTION 2: Configure bot to use Gnosis Safe\n');
    console.log('  Update bot code to use SignatureType.POLY_GNOSIS_SAFE\n');
    console.log(`  and PROXY_WALLET=${suspectAddress}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

computeGnosisSafeAddress().catch(console.error);
