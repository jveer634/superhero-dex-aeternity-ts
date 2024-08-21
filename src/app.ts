import {
    AeSdk,
    CompilerHttp,
    MemoryAccount,
    Node,
    Contract,
    AE_AMOUNT_FORMATS,
    ContractMethodsBase,
} from "@aeternity/aepp-sdk";

import { RouterABI } from "./router";
import { TokenABI } from "./token";

import "dotenv/config";

const secretKey = process.env.KEY as string;

const nodeUrl = "https://testnet.aeternity.io";
const compilerUrl = "https://v7.compiler.aepps.com";

const account = new MemoryAccount(secretKey);
const node = new Node(nodeUrl);
const aeSdk = new AeSdk({
    nodes: [{ name: "testnet", instance: node }],
    accounts: [account],
    onCompiler: new CompilerHttp(compilerUrl),
});

// 3 seconds deadline
const deadline = Date.now() + 30000;

const receiver = account.address;
const tokenAddress = "ct_2BbAphKx48mggpyMB9x25AdoZWfJ9zG3U3shjmU4Bzpanfai99";
const WAE = "ct_JDp175ruWd7mQggeHewSLS1PFXt9AzThCDaFedxon8mF8xTRF";

const ROUTER = "ct_MLXQEP12MBn99HL6WDaiTqDbG4bJQ3Q9Bzr57oLfvEkghvpFb";

const approveToken = async (
    token: Contract<ContractMethodsBase>,
    router: Contract<ContractMethodsBase>,
    amount: number
) => {
    const { decodedResult: currentAllowance } = await token.$call("allowance", [
        {
            from_account: account.address,
            for_account: (router.$options.address as string).replace(
                "ct_",
                "ak_"
            ),
        },
    ]);
    console.log("Token Allowance: ", currentAllowance);

    if (currentAllowance == undefined || currentAllowance == null) {
        const { decodedResult: allowanceResult } = await token.$call(
            "create_allowance",
            [(router.$options.address as string).replace("ct_", "ak_"), amount],
            {
                confirm: 1,
            }
        );

        console.log("Tokens allowance created...", allowanceResult);
    } else if (parseInt(currentAllowance) < amount) {
        const { decodedResult: allowanceResult } = await token.$call(
            "change_allowance",
            [(router.$options.address as string).replace("ct_", "ak_"), amount],
            {
                confirm: 1,
            }
        );

        console.log("Allowance updated... ", allowanceResult);
    }
};

const swapAEToToken = async () => {
    const router = await Contract.initialize({
        ...aeSdk.getContext(),
        address: ROUTER,
        sourceCode: RouterABI,
    });

    const amount = 1;

    const path = [WAE, tokenAddress];
    const { decodedResult: minOuts } = await router.$call("get_amounts_out", [
        amount,
        path,
    ]);

    const tx = await router.$call(
        "swap_exact_ae_for_tokens",
        [minOuts[1], path, receiver, deadline],
        // @ts-ignore
        { denomination: AE_AMOUNT_FORMATS.FEMTO_AE, amount, confirm: 1 }
    );

    console.log("Swap completed: ", tx.hash);
};

const swapTokenToAE = async () => {
    const token = await Contract.initialize({
        ...aeSdk.getContext(),
        address: tokenAddress,
        sourceCode: TokenABI,
    });

    const router = await Contract.initialize({
        ...aeSdk.getContext(),
        address: ROUTER,
        sourceCode: RouterABI,
    });

    const path = [tokenAddress, WAE];

    const meta = await token.$call("meta_info", []);

    const amount = 1 * Math.pow(10, parseInt(meta.decodedResult.decimals));

    const { decodedResult: minOuts } = await router.$call("get_amounts_out", [
        amount,
        path,
    ]);

    const { decodedResult: balance } = await token.$call("balance", [
        account.address,
    ]);

    if (balance == undefined) throw Error("Not Enough Balance");

    // Token approve
    await approveToken(token, router, amount);

    console.log("Swapping....");
    let tx = await router.$call(
        "swap_exact_tokens_for_ae",
        [amount, minOuts[1], path, receiver, deadline],
        {
            confirm: 1,
        }
    );
    console.log("Tokens swapped: ", tx.hash);
};

const tokenToToken = async () => {
    console.log("User: ", account.address);
    const router = await Contract.initialize({
        ...aeSdk.getContext(),
        address: ROUTER,
        sourceCode: RouterABI,
    });

    const tokenA = await Contract.initialize({
        ...aeSdk.getContext(),
        address: "ct_24NsP1ANaSeMCF7P3z2tvyxsibkL7N1xVVavHbk18bDfNuFRd9",
        sourceCode: TokenABI,
    });

    const tokenB = await Contract.initialize({
        ...aeSdk.getContext(),
        address: "ct_2gqa3ZindpiYTjV6u4mBeQkwCDxAwMqeuairqjx5Vz3yittfcp",
        sourceCode: TokenABI,
    });

    const { decodedResult: meta } = await tokenA.$call("meta_info", []);

    const amount = 1 * Math.pow(10, parseInt(meta.decimals));

    console.log(
        "User - Token A Balance: ",
        (await tokenA.$call("balance", [account.address])).decodedResult
    );
    console.log(
        "User - Token B Balance: ",
        (await tokenB.$call("balance", [account.address])).decodedResult
    );

    await approveToken(tokenA, router, amount);

    const path = [tokenA.$options.address, tokenB.$options.address];
    const { decodedResult: minOuts } = await router.$call("get_amounts_out", [
        amount,
        path,
    ]);
    console.log("Min Amount out: ", minOuts);

    const tx = await router.$call(
        "swap_exact_tokens_for_tokens",
        [amount, minOuts[1], path, account.address, deadline],
        { confirm: 1 }
    );

    console.log("Tokens swapped: ", tx.hash);
};

tokenToToken().then((_) => process.exit(0));
