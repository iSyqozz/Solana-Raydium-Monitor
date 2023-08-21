"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const js_1 = require("@metaplex-foundation/js");
const web3_js_1 = require("@solana/web3.js");
const fs_1 = __importDefault(require("fs"));
const discord_js_1 = __importDefault(require("discord.js"));
//sending discord ember notifier
function send_to_discord(connection, id, baseMint, quoteMint, liq) {
    return __awaiter(this, void 0, void 0, function* () {
        let json = fs_1.default.readFileSync('clients.json');
        const liquid = get_liquid(liq, quoteMint);
        //getting base data
        var token_out_symbol = 'UNKNOWN';
        var token_out_image = 'https://cryptoslate.com/wp-content/uploads/2021/02/raydium-social.jpg';
        const metadata = yield fetch_metadata(connection, new js_1.PublicKey(baseMint));
        try {
            //@ts-ignore
            token_out_symbol = metadata.symbol;
        }
        catch (e) {
            token_out_symbol = 'UNKNOWN';
        }
        try {
            //@ts-ignore
            token_out_image = metadata.image;
            if (token_out_image.length > 200) {
                token_out_symbol = 'UNKNOWN';
            }
        }
        catch (e) {
            token_out_symbol = 'UNKNOWN';
        }
        //getting quote data
        var quotemintsjson = JSON.parse(fs_1.default.readFileSync("quotemints.json", 'utf8'));
        var quoteMint_data = 'UNKNOWN';
        try {
            quoteMint_data = quotemintsjson[quoteMint].symbol;
        }
        catch (e) {
            quoteMint_data = 'UNKOWN';
        }
        console.log(metadata);
        var good_embed = new discord_js_1.default.EmbedBuilder();
        good_embed.setTitle("Monitor - DexSpyder");
        good_embed.setDescription("New Pool detected!\n" + id + "\n[RugCheck](https://rugcheck.xyz/tokens/" + baseMint + ") [BirdEye](https://birdeye.so/token/" + baseMint + ")");
        good_embed.setColor(0x581672);
        good_embed.addFields({ name: 'Token Address', value: baseMint, inline: false }, { name: "Token In", value: "$" + quoteMint_data, inline: true }, { name: "Token Out", value: "$" + token_out_symbol, inline: true }, { name: "Liquidity", value: liquid + " $" + quoteMint_data, inline: true });
        good_embed.setImage(token_out_image);
        good_embed.setFooter({ text: "@DexSpyder", iconURL: "https://media.discordapp.net/attachments/1108171405339676723/1108505276484681748/doxx4.jpg?width=702&height=702" });
        good_embed.setTimestamp(Date.now());
        JSON.parse(json.toString()).clients.forEach((client) => {
            let link = client.link;
            let color = client.brand.color;
            let right_color = parseInt(color, 16);
            let webhook = new discord_js_1.default.WebhookClient({ url: link });
            if (client.brand != "") {
                console.log(client.brand.name);
                var branded_embed = new discord_js_1.default.EmbedBuilder();
                branded_embed.setTitle(client.brand.name);
                branded_embed.setDescription("New Pool detected!\n" + id + "\n[RugCheck](https://rugcheck.xyz/tokens/" + baseMint + ") [BirdEye](https://birdeye.so/token/" + baseMint + ")");
                branded_embed.setColor(right_color);
                good_embed.addFields({ name: 'Token Address', value: baseMint, inline: false }, { name: "Token In", value: "$" + quoteMint_data, inline: true }, { name: "Token Out", value: "$" + token_out_symbol, inline: true }, { name: "Liquidity", value: liquid + " $" + quoteMint_data, inline: true });
                good_embed.setImage(token_out_image);
                branded_embed.setFooter({ text: client.brand.name, iconURL: client.brand.image });
                branded_embed.setTimestamp(Date.now());
                webhook.send({ embeds: [branded_embed] });
            }
            else {
                webhook.send({ embeds: [good_embed] });
            }
        });
    });
}
;
//fetching spl-token metadata
function get_liquid(amount, mint) {
    const deci_map = new Map();
    deci_map.set('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 6);
    deci_map.set('So11111111111111111111111111111111111111112', 9);
    deci_map.set('4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', 6);
    deci_map.set('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', 6);
    const deci = deci_map.get(mint);
    return deci ? (amount / (10 ** deci)) : 0;
}
function fetch_metadata(connection, mint_address) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const metaplex = js_1.Metaplex.make(connection);
            const data = yield metaplex.nfts().findByMint({ mintAddress: mint_address, loadJsonMetadata: true });
            if (!data.json) {
                return {};
            }
            else {
                return data.json;
            }
        }
        catch (e) {
            console.log(e);
            return 1;
        }
    });
}
//sleep function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
//parsing signatures
function parseSignatures(connection, signatures) {
    return __awaiter(this, void 0, void 0, function* () {
        const parsedSignatures = yield connection.getParsedTransactions(signatures, { maxSupportedTransactionVersion: 2 });
        return parsedSignatures;
    });
}
//getting the mint address from an associated token account
function getTokenMintAddress(connection, tokenAccountAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        const tokenAccountInfo = yield connection.getParsedAccountInfo(tokenAccountAddress);
        if (tokenAccountInfo.value === null || !tokenAccountInfo.value.data) {
            return 'null';
        }
        //@ts-ignore
        const data = tokenAccountInfo.value.data.parsed.info;
        if (data && 'mint' in data) {
            const mintAddress = new js_1.PublicKey(data.mint);
            return mintAddress.toBase58();
        }
    });
}
//program start
function main() {
    var _a, _b, _c, _d, _e, _f, _g;
    return __awaiter(this, void 0, void 0, function* () {
        //caching to avoid accidental duplicate on-chain reads 
        var cache = new Set();
        setInterval(() => {
            cache.clear();
            console.log("cache flushed");
        }, 3 * 60 * 1000);
        //Set Connection here:
        const connection = new web3_js_1.Connection('<YOUR-RPC-URL-HERE>');
        var until = 'VWKiU3S8Ujn2g1PWmaU13vkYFw8T6pQMt5p8MtBPxXqnuKnWYTs9usAk6Cv7d39xUoc2WcGySqn29U81buaTwQK';
        while (true) {
            const start = Math.floor(Date.now() / 1000);
            //fetching sigs 
            const data = yield connection.getConfirmedSignaturesForAddress2(new js_1.PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'), { limit: 200, until: until });
            //getting successfull sigs
            const confirmed_sigs = [];
            data.forEach((entry) => {
                if (!entry.err)
                    confirmed_sigs.push(entry.signature);
            });
            if (confirmed_sigs.length === 0) {
                yield sleep(2000);
                continue;
            }
            //getting parsed transactions
            const parsed_sigs = yield parseSignatures(connection, confirmed_sigs);
            for (var i = 0; i < parsed_sigs.length; i++) {
                const sig = parsed_sigs[i];
                if (1 == ((_b = (_a = sig === null || sig === void 0 ? void 0 : sig.meta) === null || _a === void 0 ? void 0 : _a.innerInstructions) === null || _b === void 0 ? void 0 : _b.length) &&
                    37 == ((_c = sig === null || sig === void 0 ? void 0 : sig.meta) === null || _c === void 0 ? void 0 : _c.innerInstructions[0].instructions.length) &&
                    !cache.has(confirmed_sigs[i])) {
                    try {
                        cache.add(confirmed_sigs[i]);
                        fs_1.default.appendFileSync('temp.csv', confirmed_sigs[i] + '\n');
                        console.log('Transaction Sig:', confirmed_sigs[i]);
                        //@ts-ignore
                        const AMM_ID = ((_d = sig === null || sig === void 0 ? void 0 : sig.meta) === null || _d === void 0 ? void 0 : _d.innerInstructions[0].instructions[24].parsed.info.account);
                        if (!AMM_ID) {
                            continue;
                        }
                        console.log('pool ID:', AMM_ID);
                        //@ts-ignore
                        const baseMintAccount = ((_e = sig === null || sig === void 0 ? void 0 : sig.meta) === null || _e === void 0 ? void 0 : _e.innerInstructions[0].instructions[13].parsed.info.account);
                        if (!baseMintAccount) {
                            continue;
                        }
                        const baseMint = yield getTokenMintAddress(connection, new js_1.PublicKey(baseMintAccount));
                        console.log('baseMint', baseMint);
                        //@ts-ignore
                        const quoteMintAccount = ((_f = sig === null || sig === void 0 ? void 0 : sig.meta) === null || _f === void 0 ? void 0 : _f.innerInstructions[0].instructions[17].parsed.info.account);
                        if (!quoteMintAccount) {
                            continue;
                        }
                        const quoteMint = yield getTokenMintAddress(connection, new js_1.PublicKey(quoteMintAccount));
                        console.log('quoteMint:', quoteMint);
                        if (baseMint && quoteMint && AMM_ID) {
                            //@ts-ignore
                            const liq_tx = ((_g = sig === null || sig === void 0 ? void 0 : sig.meta) === null || _g === void 0 ? void 0 : _g.innerInstructions[0].instructions[35].parsed.info);
                            const amount = parseFloat(liq_tx.amount);
                            send_to_discord(connection, AMM_ID, baseMint, quoteMint, amount);
                        }
                    }
                    catch (e) {
                        yield sleep(200);
                        continue;
                    }
                }
            }
            const end = Math.floor(Date.now() / 1000);
            until = confirmed_sigs[0];
        }
    });
}
function try_with_pool_amm(sig) {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function* () {
        const connection = new web3_js_1.Connection('https://white-quiet-glitter.solana-mainnet.quiknode.pro/2d4bcbb69148d23b481215ff6c3776ecb183f698/');
        const parsedsig = yield connection.getParsedTransaction(sig);
        //@ts-ignore
        const AMM_ID = ((_a = parsedsig === null || parsedsig === void 0 ? void 0 : parsedsig.meta) === null || _a === void 0 ? void 0 : _a.innerInstructions[0].instructions[24].parsed.info.account);
        console.log('pool ID:', AMM_ID);
        function get_liquid(amount, mint) {
            const deci_map = new Map();
            deci_map.set('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 6);
            deci_map.set('So11111111111111111111111111111111111111112', 9);
            deci_map.set('4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', 6);
            deci_map.set('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', 6);
            const deci = deci_map.get(mint);
            return deci ? (amount / (10 ** deci)) : 0;
        }
        //@ts-ignore
        const baseMintAccount = ((_b = parsedsig === null || parsedsig === void 0 ? void 0 : parsedsig.meta) === null || _b === void 0 ? void 0 : _b.innerInstructions[0].instructions[13].parsed.info.account);
        const baseMint = yield getTokenMintAddress(connection, new js_1.PublicKey(baseMintAccount));
        console.log('baseMint', baseMint);
        //@ts-ignore
        const quoteMintAccount = ((_c = parsedsig === null || parsedsig === void 0 ? void 0 : parsedsig.meta) === null || _c === void 0 ? void 0 : _c.innerInstructions[0].instructions[17].parsed.info.account);
        const quoteMint = yield getTokenMintAddress(connection, new js_1.PublicKey(quoteMintAccount));
        console.log('quoteMint:', quoteMint);
        //@ts-ignore
        const liq_tx = ((_d = parsedsig === null || parsedsig === void 0 ? void 0 : parsedsig.meta) === null || _d === void 0 ? void 0 : _d.innerInstructions[0].instructions[35].parsed.info);
        const amount = parseFloat(liq_tx.amount);
        console.log(liq_tx);
        const liq = get_liquid(amount, quoteMint);
        console.log(liq);
    });
}
try {
    //try_with_pool_amm("3uohvvYf98FojwdppsAEqSZVHQszy2sKaPuiXyge53R1uHWF5pF8W8QQzszrrXXj7QRjq42hca28jBwyLNm5vpad");
    main();
}
catch (e) {
    console.log(e);
}
