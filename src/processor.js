import Web3 from "web3";
import fetch from "node-fetch";
import { SocksProxyAgent } from "socks-proxy-agent";
import { generateQuery, parseProxy, headers, getTimestamp, randomAmount, randomToken, randomChain, generateEns, generateSameTypeQuery } from "./utils.js";
import { updateWallet, getWallet } from "./database.js";
import { checkPoints, getNonce, sendQuery } from "./api.js";

export async function processWallet(privateKey, address, proxy, walletEntry) {   
    const nonce = await getNonce();
    const proxyUrl = parseProxy(proxy);
    const agent = new SocksProxyAgent(new URL(proxyUrl));
    const time = new Date().toISOString();

    console.log(`${getTimestamp()} 📜 В работе адрес ${address}`);

    const messageText = `www.brianknows.org wants you to sign in with your Ethereum account:
${address}

By signing this message, you confirm you have read and accepted the following Terms and Conditions: https://brianknows.org/terms-and-conditions

URI: https://www.brianknows.org
Version: 1
Chain ID: 1
Nonce: ${nonce}
Issued At: ${time}`;

    const web3 = new Web3();
    const signature = web3.eth.accounts.sign(messageText, privateKey).signature;
    
    const requestBody = JSON.stringify({
        message: {
            domain: "www.brianknows.org",
            address: address,
            statement: "By signing this message, you confirm you have read and accepted the following Terms and Conditions: https://brianknows.org/terms-and-conditions",
            uri: "https://www.brianknows.org",
            version: "1",
            nonce: nonce,
            issuedAt: time,
            chainId: 1
        },
        signature
    });
    
    console.log(`${getTimestamp()} ✏️  Подписываю сообщение...`);

    const authResponse = await fetch("https://www.brianknows.org/api/auth/verify", { 
        method: "POST", 
        headers: headers(),
        body: requestBody, 
        agent 
    });    
    
    if (!authResponse.ok) {
        console.log(`${getTimestamp()} ❌ Ошибка авторизации: ${authResponse.status} - ${authResponse.statusText}`);
        return;
    }

    const authHeaders = authResponse.headers.raw();
    const cookies = authHeaders["set-cookie"];

    if (!cookies) {
        console.log(`${getTimestamp()} ❌ Заголовки 'set-cookie' отсутствуют. Завершаем работу.`);
        return;
    }

    const brianToken = cookies.find(cookie => cookie.startsWith("brian-token="))?.split(";")[0];
    const brianAddress = cookies.find(cookie => cookie.startsWith("brian-address="))?.split(";")[0];

    if (!brianToken || !brianAddress) {
        console.log(`${getTimestamp()} ❌ Не вышло получить токены. Завершаю работу.`);
        return;
    } 

    let lastQuery = await generateQuery();
    let queryType = "ens"; // Обозначаем ENS-запрос
    console.log(`${getTimestamp()} 📡 Отправляем запрос: ${lastQuery}`);
    await sendQuery(lastQuery, brianToken, brianAddress, agent);

    let retryCount = 0;
    while (retryCount < 3) {
        walletEntry = getWallet(walletEntry.address);
        if (await checkPoints(walletEntry, brianToken, brianAddress, agent, 10)) {
            break;
        }
        retryCount++;
        lastQuery = await generateQuery();
        console.log(`${getTimestamp()} 🔄 Повторная попытка #${retryCount}: ${lastQuery}`);
        await sendQuery(lastQuery, brianToken, brianAddress, agent);
    }

    const activities = [
        { type: "bridge", generator: () => `Bridge ${randomAmount()} ${randomToken()} to ${randomChain()}` },
        { type: "deposit", generator: () => `Deposit ${randomAmount()} ${randomToken()} on Aave` },
        { type: "swap", generator: () => `Swap ${randomAmount()} ${randomToken()} to ${randomToken()}` },
        { type: "transfer", generator: async () => `Transfer ${randomAmount()} dollars of ${randomToken()} to ${await generateEns()}` },
        { type: "withdraw", generator: () => `Withdraw ${randomAmount()} ${randomToken()} from Aave` },
        { type: "register", generator: async () => `Register ${await generateEns(true)} for 2 years and set it as my primary name` },
        { type: "renew", generator: async () => `Renew ${await generateEns()} for 2 years` }
    ];

    for (const activity of activities) {
        retryCount = 0;
        lastQuery = await activity.generator();
        queryType = activity.type;
        console.log(`${getTimestamp()} 📡 Отправляем запрос: ${lastQuery}`);
        await sendQuery(lastQuery, brianToken, brianAddress, agent);

        while (retryCount < 3) {
            walletEntry = getWallet(walletEntry.address);
            if (await checkPoints(walletEntry, brianToken, brianAddress, agent, 20)) {
                break;
            }
            retryCount++;
            lastQuery = await generateSameTypeQuery(queryType);
            console.log(`${getTimestamp()} 🔄 Повторная попытка #${retryCount}: ${lastQuery}`);
            await sendQuery(lastQuery, brianToken, brianAddress, agent);
        }
    }

    updateWallet(walletEntry, "last_used", new Date().toISOString());
    console.log(`${getTimestamp()} ✅ Кошелек ${address} завершил сессию.`);
}