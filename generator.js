import Web3 from "web3";
import fs from "fs";
import readline from "readline";

import { getTimestamp } from "./src/utils.js";

async function askWalletCount() {
    while (true) {
        const count = await new Promise(resolve => {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            rl.question("\nСколько кошельков создать?\n> ", answer => {
                rl.close();
                resolve(answer.trim());
            });
        });

        const numWallets = parseInt(count, 10);

        if (!isNaN(numWallets) && numWallets > 0) {
            return numWallets;
        }

        console.log(`${getTimestamp()} ❌ Введено некорректное число. Попробуйте снова.`);
    }
}

async function generateWallets() {
    const count = await askWalletCount();
    const web3 = new Web3();
    const wallets = [];

    for (let i = 0; i < count; i++) {
        const account = web3.eth.accounts.create();
        const privateKey = account.privateKey.replace(/^0x/, "");
        wallets.push(privateKey);
        console.log(`${getTimestamp()} 💰 Кошелек ${i + 1}: ${account.address}`);
    }

    const filePath = "wallets.txt";
    let existingContent = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf-8").trim() : "";

    const newContent = (existingContent ? existingContent + "\n" : "") + wallets.join("\n") + "\n";

    fs.writeFileSync(filePath, newContent, "utf-8");

    console.log(`${getTimestamp()} ✅ Успешно добавлено ${count} новых кошельков в ${filePath}`);
}

generateWallets();
