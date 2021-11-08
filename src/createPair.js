require('dotenv').config()//for importing parameters
const {sendMultipleTokens} = require('./lib');
const Web3 = require('web3')
const { ethers } = require("ethers");

const ERC20_ABI = require('./erc20.abi.json');
const ROUTER_ABI = require('./UniswapV2Router02.abi.json');
const FACTORY_ABI = require('./UniswapV2Factory.abi.json');

const privateKey = process.env.DEPLOYER_PRIVATE_KEY
// const privateKey = process.env.DEV_PRIVATE_KEY


const opts = {
	key: privateKey,
	gasPrice: 1.046739556,
	providerURI: 'https://smartbch.fountainhead.cash/mainnet',
	// provider: opts.provider,
	network: 10000,
	// eth: opts.eth,
	// net: require('net'),
}

let web3 = new Web3(`https://smartbch.fountainhead.cash/mainnet`);

web3.eth.net.getId().then(async function(netId) {
	console.log('netId: ', netId);

	const factoryAddr = process.env.FACTORY_ADDRESS;
	console.log("factoryAddr: ", factoryAddr);

	const factoryContract = new web3.eth.Contract(FACTORY_ABI, factoryAddr);
	// console.log("factoryContract: ", factoryContract);

	const tokenA = '0x3743eC0673453E5009310C727Ba4eaF7b3a1cc04';
	const tokenB = '0x77CB87b57F54667978Eb1B199b28a0db8C8E1c0B';



	let len = await factoryContract.methods.allPairsLength().call();
	console.log("len: ", len);

	let res = await factoryContract.methods.getPair(tokenA, tokenB).call();
	console.log("res: ", res);


	// ------------------------------------------------------------------------------------------
	// CreatePair
	// ------------------------------------------------------------------------------------------

	// const accountObj = await web3.eth.accounts.privateKeyToAccount(privateKey);
    // const sender = accountObj.address;
    // console.log("sender: ", sender);

	// const currentGasPrice = await web3.eth.getGasPrice();
	// console.log(`currentGasPrice: ${currentGasPrice}`)
	// const gasPrice = ethers.utils.hexlify(parseInt(currentGasPrice));
	// console.log(`gasPrice: ${gasPrice}`)
	// // const gasLimit = ethers.utils.hexlify(61623);
	// // console.log(`gasLimit: ${gasLimit}`);

	// const gasNeeded = await factoryContract.methods.createPair(tokenA, tokenB).estimateGas({gasPrice: gasPrice});
	// console.log(`gasNeeded: ${gasNeeded}`);

	// const tx = {
	// 	from: sender,
	// 	to: factoryContract.options.address,
	// 	// gasLimit: gasLimit,
	// 	gasLimit: gasNeeded,
	// 	gasPrice: gasPrice,
	// 	// gas: gasNeeded,
	// 	data: factoryContract.methods.createPair(tokenA, tokenB).encodeABI(),
	// }
	// // console.log('tx: ', tx);

	// const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
	// console.log('signedTx: ', signedTx);

	// const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
	// console.log(`Tx hash: ${receipt.transactionHash}\n`);
	// ------------------------------------------------------------------------------------------






	// let confirmedTransaction = await transaction.wait()
	// console.log("confirmedTransaction: ", confirmedTransaction);

	// const tokenContract = new web3.eth.Contract(ERC20_ABI, tokenStr);
	// const pair = erc20.attach(pairAddress)

	res = await factoryContract.methods.getPair(tokenA, tokenB).call();
	console.log("res: ", res);


});


// async function main() {
// 	try {


// 		const rs = await sendMultipleTokens(token, data, opts);
// 		console.log(rs);

// 		// for (const [addressStr, amount] of Object.entries(data)) {
// 		// 	const r = await sendTokens(token, addressStr, amount, this);
// 		// }



// 		process.exit(0);
// 	} catch (err) {
// 		console.error(err);
// 		process.exit(-1);
// 	}
// }

// (async () => {
//     try {
//         await main();
//     } catch (e) {
//         // Deal with the fact the chain failed
//     }
// })();

