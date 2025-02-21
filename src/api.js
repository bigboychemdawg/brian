import { delay, headers, getTimestamp } from "./utils.js";
import { updateWallet } from "./database.js";

export async function checkPoints(walletEntry, brianToken, brianAddress, agent, expectedPoints) {
    console.log(`${getTimestamp()} 🔍 Проверяем начисленные поинты...`);
    await delay(10000 + Math.random() * 10000);

    const response = await fetch("https://www.brianknows.org/api/leaderboard", {
        method: "GET",
        headers: headers(brianToken, brianAddress),
        agent
    });

    const data = await response.json();
    const userPoints = data.result?.points ?? 0;
    const currentPoints = walletEntry.points ?? 0;

    console.log(`${getTimestamp()} 💎 Текущие поинты в БД: ${currentPoints}, Поинты с сервера: ${userPoints}`);

    if (userPoints >= currentPoints + expectedPoints) {
        console.log(`${getTimestamp()} ✅ Поинты успешно начислены!`);
        updateWallet(walletEntry, "points", userPoints);
        return true;
    }

    console.log(`${getTimestamp()} ⚠️ Поинты не начислены.`);
    return false;
}

export async function getNonce() {
    const response = await fetch("https://www.brianknows.org/api/auth/nonce");
    return response.text();
}

export async function sendQuery(query, brianToken, brianAddress, agent) {
    await fetch("https://www.brianknows.org/api/builds", { 
        method: "POST", 
        headers: headers(brianToken, brianAddress),
        body: JSON.stringify({ query, chain: 1 }), 
        agent 
    });
    await delay(10000 + Math.random() * 10000);
}
