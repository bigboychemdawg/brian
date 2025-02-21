import readline from "readline";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Web3 from "web3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const walletsFilePath = path.resolve(__dirname, "../wallets.txt");
const proxiesFilePath = path.resolve(__dirname, "../proxy.txt");
const wordsFilePath = path.resolve(__dirname, "../data/words.txt");

export const wallets = fs.readFileSync(walletsFilePath, "utf-8").split("\n").map(k => k.trim()).filter(k => k).map(k => k.startsWith("0x") ? k : `0x${k}`);
export const proxies = fs.readFileSync(proxiesFilePath, "utf-8").split("\n").map(p => p.trim()).filter(p => p);

async function getRandomWord() {
    const fileStream = fs.createReadStream(wordsFilePath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let randomWord = null;
    let count = 0;

    for await (const line of rl) {
        const word = line.trim();
        if (word) {
            count++;
            if (Math.random() < 1 / count) {
                randomWord = word;
            }
        }
    }

    return randomWord;
}

export async function generateQuery() {
    const questions = [
        "Is ${ens}.eth available?",
        "When does ${ens}.eth expire?",
        "Tell me the registration costs of the following ens: ${ens_list}",
        "When does the following ens expire: ${ens_list}",
        "What are the addresses associated with the following ENS: ${ens_list}"
    ];

    const questionTemplate = questions[Math.floor(Math.random() * questions.length)];

    if (questionTemplate.includes("${ens_list}")) {
        let ensNames = [];
        const ensCount = Math.floor(Math.random() * 5) + 1;
        for (let i = 0; i < ensCount; i++) {
            const word = await getRandomWord();
            ensNames.push(`${word}.eth`);
        }
        return questionTemplate.replace("${ens_list}", ensNames.join(", "));
    } else {
        const randomWord = await getRandomWord();
        return questionTemplate.replace("${ens}", randomWord);
    }
}

export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function parseProxy(proxy) {
    const [ip, port, username, password] = proxy.split(":");
    return `socks5://${username}:${password}@${ip}:${port}`;
}

export function getWalletAddress(privateKey) {
    const web3 = new Web3();
    return web3.eth.accounts.privateKeyToAccount(privateKey).address;
}

export const headers = (brianToken, brianAddress) => ({
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.9",
    "Cookie": `${brianToken}; ${brianAddress}`, 
    "content-type": "application/json",
    "origin": "https://www.brianknows.org",
    "priority": "u=1, i",
    "referer": "https://www.brianknows.org/app/points",
    "sec-ch-ua": '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133")',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
});

export function getTimestamp() {
    const now = new Date();
    return `[${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")} ${now.getDate().toString().padStart(2, "0")}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getFullYear()}]`;
}

const tokens = ["eth", "usdt", "usdc", "dai"];
const chains = ["polygon", "arbitrum", "optimism", "base", "avalanche"];

export function randomAmount() {
    return (Math.random() * (100 - 0.01) + 0.01).toFixed(2);
}

export function randomToken() {
    return tokens[Math.floor(Math.random() * tokens.length)];
}

export function randomChain() {
    return chains[Math.floor(Math.random() * chains.length)];
}

export async function generateEns(double = false) {
    const word1 = await getRandomWord();
    const word2 = double ? await getRandomWord() : "";
    return `${word1}${word2}.eth`;
}

export async function generateSameTypeQuery(type) {
    switch (type) {
        case "bridge":
            return `Bridge ${randomAmount()} ${randomToken()} to ${randomChain()}`;
        case "deposit":
            return `Deposit ${randomAmount()} ${randomToken()} on Aave`;
        case "swap":
            return `Swap ${randomAmount()} ${randomToken()} to ${randomToken()}`;
        case "transfer":
            return `Transfer ${randomAmount()} dollars of ${randomToken()} to ${await generateEns()}`;
        case "withdraw":
            return `Withdraw ${randomAmount()} ${randomToken()} from Aave`;
        case "register":
            return `Register ${await generateEns(true)} for 2 years and set it as my primary name`;
        case "renew":
            return `Renew ${await generateEns()} for 2 years`;
        default:
            return await generateQuery();
    }
}
