import { wallets, proxies, getWalletAddress, getTimestamp } from "./src/utils.js";
import { getWallet, insertWallet } from "./src/database.js";
import { processWallet } from "./src/processor.js";

if (wallets.length !== proxies.length) {
    const diff = Math.abs(wallets.length - proxies.length);
    if (wallets.length > proxies.length) {
        console.log(`${getTimestamp()} ❌ Кол-во приватных ключей (${wallets.length}) и прокси (${proxies.length}) не совпадает! Добавь ${diff} прокси.`);
    } else {
        console.log(`${getTimestamp()} ❌ Кол-во приватных ключей (${wallets.length}) и прокси (${proxies.length}) не совпадает! Добавь ${diff} приватных ключей.`);
    }
    process.exit(1);
}

(async () => {
    const last25h = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();

    let availableWallet = null;
    let availableWalletAddress = null;
    let selectedProxy = null;
    let walletEntry = null;

    for (let i = 0; i < wallets.length; i++) {
        const address = getWalletAddress(wallets[i]);
        walletEntry = getWallet(address);

        if (!walletEntry) {
            insertWallet(address);
            walletEntry = getWallet(address);

            await processWallet(wallets[i], address, proxies[i], walletEntry);
            return;
        }

        if (!walletEntry.last_used || walletEntry.last_used < last25h) {
            availableWallet = wallets[i];
            selectedProxy = proxies[i];
            availableWalletAddress = address;
            break;
        }
    }

    if (!availableWallet || !selectedProxy) {
        console.log(`${getTimestamp()} ❌ Нет доступных кошельков для обработки. Завершаю работу.`);
    } else {
        await processWallet(availableWallet, availableWalletAddress, selectedProxy, walletEntry);
    }  

})();
