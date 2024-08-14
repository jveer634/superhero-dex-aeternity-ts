import {
	AeSdk,
	CompilerHttp,
	MemoryAccount,
	Node,
	Contract,
	AE_AMOUNT_FORMATS,
} from "@aeternity/aepp-sdk";

import { RouterABI } from "./router";

import "dotenv/config"

const main = async () => {
	const amount = 10;
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

	const router = await Contract.initialize({
		...aeSdk.getContext(),
		address: "ct_MLXQEP12MBn99HL6WDaiTqDbG4bJQ3Q9Bzr57oLfvEkghvpFb",
		// aci: RouterJson,
		sourceCode: RouterABI,
	});

	const path = [
		"ct_JDp175ruWd7mQggeHewSLS1PFXt9AzThCDaFedxon8mF8xTRF",
		"ct_2BbAphKx48mggpyMB9x25AdoZWfJ9zG3U3shjmU4Bzpanfai99",
	];
	const deadline = Date.now() + 300000;
	const minOut = 2375000000000000;
	const receiver = "ak_7vMJq7UhYkZHycLs6nm5dL9DdYp6jsuY9qYnT9dN29tj12wAg";

	const tx = await router.swap_exact_ae_for_tokens(
		minOut,
		path,
		receiver,
		deadline,
		{
			confirm: 1,
			amount: 1,
		}
	);

	console.log(tx);
};

main();
