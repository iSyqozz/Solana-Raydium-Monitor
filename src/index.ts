import { Metaplex, PublicKey} from "@metaplex-foundation/js";
import { Connection } from "@solana/web3.js";
import fs from "fs"
import disc from "discord.js";





//sending discord ember notifier
async function send_to_discord(connection: Connection, id: string, baseMint: string, quoteMint: string, liq: number) {

    let json = fs.readFileSync('clients.json');

    const liquid = get_liquid(liq, quoteMint);

    //getting base data
    var token_out_symbol = 'UNKNOWN';
    var token_out_image = 'https://cryptoslate.com/wp-content/uploads/2021/02/raydium-social.jpg';

    const metadata = await fetch_metadata(connection, new PublicKey(baseMint));

    try {
        //@ts-ignore
        token_out_symbol = metadata.symbol as string;
    } catch (e) {
        token_out_symbol = 'UNKNOWN';
    }

    try {
        //@ts-ignore
        token_out_image = metadata.image as string;

        if (token_out_image.length > 200) {
            token_out_symbol = 'UNKNOWN';
        }
    } catch (e) {
        token_out_symbol = 'UNKNOWN';
    }

    //getting quote data
    var quotemintsjson = JSON.parse(fs.readFileSync("quotemints.json", 'utf8'));

    var quoteMint_data = 'UNKNOWN';
    try {
        quoteMint_data = quotemintsjson[quoteMint].symbol;
    } catch (e) {
        quoteMint_data = 'UNKOWN'
    }
    console.log(metadata);
    var good_embed = new disc.EmbedBuilder();
    good_embed.setTitle("Monitor - DexSpyder")
    good_embed.setDescription("New Pool detected!\n" + id + "\n[RugCheck](https://rugcheck.xyz/tokens/" + baseMint + ") [BirdEye](https://birdeye.so/token/" + baseMint + ")");
    good_embed.setColor(0x581672)
    good_embed.addFields({ name: 'Token Address', value: baseMint, inline: false }, { name: "Token In", value: "$" + quoteMint_data, inline: true }, { name: "Token Out", value: "$" + token_out_symbol, inline: true }, { name: "Liquidity", value: liquid + " $" + quoteMint_data, inline: true });
    good_embed.setImage(token_out_image);
    good_embed.setFooter({ text: "@DexSpyder", iconURL: "https://media.discordapp.net/attachments/1108171405339676723/1108505276484681748/doxx4.jpg?width=702&height=702" })
    good_embed.setTimestamp(Date.now());
    JSON.parse(json.toString()).clients.forEach((client: any) => {
        let link = client.link;
        let color = client.brand.color;
        let right_color = parseInt(color, 16);
        let webhook = new disc.WebhookClient({ url: link });
        if (client.brand != "") {
            console.log(client.brand.name);
            var branded_embed = new disc.EmbedBuilder()
            branded_embed.setTitle(client.brand.name)
            branded_embed.setDescription("New Pool detected!\n" + id + "\n[RugCheck](https://rugcheck.xyz/tokens/" + baseMint + ") [BirdEye](https://birdeye.so/token/" + baseMint + ")");
            branded_embed.setColor(right_color);
            good_embed.addFields({ name: 'Token Address', value: baseMint, inline: false }, { name: "Token In", value: "$" + quoteMint_data, inline: true }, { name: "Token Out", value: "$" + token_out_symbol, inline: true }, { name: "Liquidity", value: liquid + " $" + quoteMint_data, inline: true });
            good_embed.setImage(token_out_image);
            branded_embed.setFooter({ text: client.brand.name, iconURL: client.brand.image })
            branded_embed.setTimestamp(Date.now());
            webhook.send({ embeds: [branded_embed] });
        } else {
            webhook.send({ embeds: [good_embed] });
        }
    });

};

//fetching spl-token metadata

function get_liquid(amount: number, mint: string) {

    const deci_map = new Map<string, number>()
    deci_map.set('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 6);
    deci_map.set('So11111111111111111111111111111111111111112', 9);
    deci_map.set('4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', 6);
    deci_map.set('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', 6)

    const deci = deci_map.get(mint);
    return deci ? (amount / (10 ** deci)) : 0
}


async function fetch_metadata(connection: Connection, mint_address: PublicKey) {
    try {
        const metaplex = Metaplex.make(connection);

        const data = await metaplex.nfts().findByMint({ mintAddress: mint_address, loadJsonMetadata: true });
        if (!data.json) {
            return {}
        } else {
            return data.json;
        }
    } catch (e) {
        console.log(e);
        return 1;
    }
}

//sleep function
function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

//parsing signatures
async function parseSignatures(connection: Connection, signatures: string[]) {
    const parsedSignatures = await connection.getParsedTransactions(signatures, { maxSupportedTransactionVersion: 2 });
    return parsedSignatures
}

//getting the mint address from an associated token account
async function getTokenMintAddress(connection: Connection, tokenAccountAddress: PublicKey) {
    const tokenAccountInfo = await connection.getParsedAccountInfo(tokenAccountAddress);

    if (tokenAccountInfo.value === null || !tokenAccountInfo.value.data) {
        return 'null';
    }
    //@ts-ignore
    const data = tokenAccountInfo.value.data.parsed.info;
    if (data && 'mint' in data) {
        const mintAddress = new PublicKey(data.mint);
        return mintAddress.toBase58();
    }
}

//program start
async function main() {
    //caching to avoid accidental duplicate on-chain reads 
    var cache: Set<string> = new Set();

    setInterval(() => {
        cache.clear();
        console.log("cache flushed");
    }, 3 * 60 * 1000);

    //Set Connection here:
    const connection = new Connection('<YOUR-RPC-URL-HERE>');

    var until: string | undefined = 'VWKiU3S8Ujn2g1PWmaU13vkYFw8T6pQMt5p8MtBPxXqnuKnWYTs9usAk6Cv7d39xUoc2WcGySqn29U81buaTwQK';
    while (true) {
        const start = Math.floor(Date.now() / 1000);
        //fetching sigs 
        const data = await connection.getConfirmedSignaturesForAddress2(new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'), { limit: 200, until: until });

        //getting successfull sigs
        const confirmed_sigs: string[] = [];
        data.forEach((entry) => {
            if (!entry.err)
                confirmed_sigs.push(entry.signature);
        });

        if (confirmed_sigs.length === 0) {
            await sleep(2000);
            continue
        }


        //getting parsed transactions
        const parsed_sigs = await parseSignatures(connection, confirmed_sigs);

        for (var i = 0; i < parsed_sigs.length; i++) {

            const sig = parsed_sigs[i];

            if (
                1 == (sig?.meta?.innerInstructions?.length!) &&
                37 == (sig?.meta?.innerInstructions![0].instructions.length!) &&
                !cache.has(confirmed_sigs[i])
            ) {

                try {

                    cache.add(confirmed_sigs[i])

                    fs.appendFileSync('temp.csv', confirmed_sigs[i] + '\n');

                    console.log('Transaction Sig:', confirmed_sigs[i]);

                    //@ts-ignore
                    const AMM_ID = (sig?.meta?.innerInstructions![0].instructions[24].parsed.info.account);
                    if (!AMM_ID) { continue }
                    console.log('pool ID:', AMM_ID);

                    //@ts-ignore
                    const baseMintAccount = (sig?.meta?.innerInstructions![0].instructions[13].parsed.info.account);
                    if (!baseMintAccount) { continue }
                    const baseMint = await getTokenMintAddress(connection, new PublicKey(baseMintAccount));
                    console.log('baseMint', baseMint);

                    //@ts-ignore
                    const quoteMintAccount = (sig?.meta?.innerInstructions![0].instructions[17].parsed.info.account);
                    if (!quoteMintAccount) { continue }
                    const quoteMint = await getTokenMintAddress(connection, new PublicKey(quoteMintAccount));
                    console.log('quoteMint:', quoteMint);

                    if (baseMint && quoteMint && AMM_ID) {
                        //@ts-ignore
                        const liq_tx = (sig?.meta?.innerInstructions![0].instructions[35].parsed.info)
                        const amount = parseFloat(liq_tx.amount);
                        send_to_discord(connection, AMM_ID, baseMint, quoteMint, amount);
                    }

                } catch (e) {
                    await sleep(200);
                    continue
                }

            }
        }
        const end = Math.floor(Date.now() / 1000);
        until = confirmed_sigs[0];
    }
}

async function try_with_pool_amm(sig: string) {


    const connection = new Connection('https://white-quiet-glitter.solana-mainnet.quiknode.pro/2d4bcbb69148d23b481215ff6c3776ecb183f698/');
    const parsedsig = await connection.getParsedTransaction(sig);
    //@ts-ignore
    const AMM_ID = (parsedsig?.meta?.innerInstructions![0].instructions[24].parsed.info.account);
    console.log('pool ID:', AMM_ID);



    function get_liquid(amount: number, mint: string) {

        const deci_map = new Map<string, number>()
        deci_map.set('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 6);
        deci_map.set('So11111111111111111111111111111111111111112', 9);
        deci_map.set('4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', 6);
        deci_map.set('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', 6)

        const deci = deci_map.get(mint);
        return deci ? (amount / (10 ** deci)) : 0
    }


    //@ts-ignore
    const baseMintAccount = (parsedsig?.meta?.innerInstructions![0].instructions[13].parsed.info.account);
    const baseMint = await getTokenMintAddress(connection, new PublicKey(baseMintAccount));
    console.log('baseMint', baseMint);

    //@ts-ignore
    const quoteMintAccount = (parsedsig?.meta?.innerInstructions![0].instructions[17].parsed.info.account);
    const quoteMint = await getTokenMintAddress(connection, new PublicKey(quoteMintAccount));
    console.log('quoteMint:', quoteMint);




    //@ts-ignore
    const liq_tx = (parsedsig?.meta?.innerInstructions![0].instructions[35].parsed.info)
    const amount = parseFloat(liq_tx.amount);
    console.log(liq_tx)

    const liq = get_liquid(amount, quoteMint!);
    console.log(liq)


}

try {
    //try_with_pool_amm("3uohvvYf98FojwdppsAEqSZVHQszy2sKaPuiXyge53R1uHWF5pF8W8QQzszrrXXj7QRjq42hca28jBwyLNm5vpad");
    main();
} catch (e) {
    console.log(e);
}