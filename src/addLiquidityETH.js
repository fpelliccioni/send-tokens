require('dotenv').config()//for importing parameters
const {sendMultipleTokens} = require('./lib');
const Web3 = require('web3')
const BigNumber = require('bignumber.js');
const { ethers } = require("ethers");

const ERC20_ABI = require('./erc20.abi.json');
const ROUTER_ABI = require('./UniswapV2Router02.abi.json');


function toWei(amount, decimals) {
	return new BigNumber(amount).times(`1e${decimals}`).integerValue().toString(10);
}


const privateKey = process.env.DEV_PRIVATE_KEY


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


async function approve(contract, tokenAddr, spender, value) {
	const currentGasPrice = await web3.eth.getGasPrice();
	console.log(`currentGasPrice: ${currentGasPrice}`)
	const gasPrice = ethers.utils.hexlify(parseInt(currentGasPrice));
	console.log(`gasPrice: ${gasPrice}`)
	const gasNeeded = await contract.methods.approve(spender, value).estimateGas({gasPrice: gasPrice});
	console.log(`gasNeeded: ${gasNeeded}`);

	const tx = {
		from: contract.options.address,
		to: tokenAddr,
		// gasLimit: gasLimit,
		gasLimit: gasNeeded,
		gasPrice: gasPrice,
		// gas: gasNeeded,
		data: contract.methods.approve(spender, value).encodeABI(),
	}
	// console.log('tx: ', tx);

	const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
	console.log('signedTx: ', signedTx);

	const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
	console.log(`Tx hash: ${receipt.transactionHash}\n`);




	// const tx = {
	// 	from: sender,
	// 	to: contract.options.address,
	// 	gasLimit: gasLimit,
	// 	gasPrice: gasPrice,
	// 	// gas: gasNeeded,
	// 	data: contract.methods.approve(bRouter.options.address,amountIn).encodeABI()
	// 	// data: contract.methods.transfer(toStr, amount).encodeABI()
	// }
	// // console.log('tx: ', tx);

	// signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
	// // console.log('signedTx: ', signedTx);

	// // console.log('Tx pending {1/1}')
	// receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)

}

web3.eth.net.getId().then(async function(netId) {
	console.log('netId: ', netId);

	const routerAddr = process.env.ROUTER_ADDRESS;
	console.log("routerAddr: ", routerAddr);

	// const rs = await sendMultipleTokens(web3, token, data, opts);
	// // console.log(rs);

	const routerContract = new web3.eth.Contract(ROUTER_ABI, routerAddr);
	// console.log("routerContract: ", routerContract);







	const decimals = 18;
	// const decimals = await routerContract.methods.decimals().call();
	console.log("decimals: ", decimals);

	const token = '0x77CB87b57F54667978Eb1B199b28a0db8C8E1c0B';
	const amountTokenDesired = '813666000000000000';
	const amountTokenMin = '813666000000000000';
	const amountETHMin = '1000000000000000';
	const to = '0xB79E7e395Ed0406e279cEb3838cD3c7db1D7CbfF';
	// const deadline = '0x61880441';
	const deadline = '0x61898e7e';

	// const amountTokenDesired = toWei(amountTokenDesiredStr, decimals);
	// const amountTokenMin = toWei(amountTokenMinStr, decimals);
	// const amountETHMin = toWei(amountETHMinStr, decimals);

	console.log('amountTokenDesired: ', amountTokenDesired);
	console.log('amountTokenMin:     ', amountTokenMin);
	console.log('amountETHMin:       ', amountETHMin);
	console.log('amountETHMin:       ', amountETHMin);

	console.log('routerContract.options.address:       ', routerContract.options.address);

	const accountObj = await web3.eth.accounts.privateKeyToAccount(privateKey);
    const from = accountObj.address;
    console.log("from: ", from);

	const accountContract = new web3.eth.Contract(ERC20_ABI, from);
	// console.log("accountContract: ", accountContract);
	await approve(accountContract, token, routerContract.options.address, amountTokenDesired);
	return;















	// const res = await routerContract.methods.addLiquidityETH(
	// 	token, amountTokenDesired,
	// 	amountTokenMin, amountETHMin, to, deadline).estimateGas();


	// value = BigNumber.from((tokenBIsETH ? parsedAmountB : parsedAmountA).quotient.toString())
	// const value = new BigNumber(amountETHMin).quotient;
	// console.log(value);
	// return


	console.log("ETH amount: ", toWei('0.001', 18));

	// using the callback
	routerContract.methods.addLiquidityETH(
		token, amountTokenDesired, amountTokenMin, amountETHMin, to, deadline)
		.estimateGas({
			gasPrice: 1050000000,
			value: amountETHMin,
			// from: from
		}, function(error, gasAmount){
		console.log('error: ', error);
		console.log('gasAmount: ', gasAmount);
	});
	// console.log("res: ", res);

	// const decimals = await routerContract.methods.decimals().call();
	// console.log("decimals: ", decimals);

	// const tokenSymbol = await resolveSymbol(routerContract);
	// console.log("tokenSymbol: ", tokenSymbol);

	// const privateKey = opts.key;
	// // console.log("privateKey: ", privateKey);

    // const accountObj = await web3.eth.accounts.privateKeyToAccount(privateKey);
    // const sender = accountObj.address;
    // console.log("sender: ", sender);
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

