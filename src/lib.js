require('colors');
const _ = require('lodash');
require('dotenv').config()//for importing parameters
const ethjs = require('ethereumjs-util');
const BigNumber = require('bignumber.js');
const { ethers } = require("ethers");


module.exports = {
	// sendTokens: sendTokens,
	sendMultipleTokens: sendMultipleTokens,
	// toWallet: toWallet
};



//ABIs
// const IFactory = require('@uniswap/v2-core/build/IUniswapV2Factory.json')
// const IPair = require('@uniswap/v2-core/build/IUniswapV2Pair.json')
// const IRouter = require('@uniswap/v2-periphery/build/IUniswapV2Router02.json')
// const Utils = require('../build/contracts/Utils.json')
// const IERC20 = require('@uniswap/v2-periphery/build/IERC20.json')

const ERC20_ABI = require('./erc20.abi.json');


//importing parameters from .env (mostly given)
// let addrToken0 = process.env.ADDR_TOKEN0
// let addrToken1 = process.env.ADDR_TOKEN1
const privateKey = process.env.PRIVATE_KEY
const validPeriod = process.env.VALID_PERIOD



// //contracts
// const bFactory = new web3.eth.Contract(IFactory.abi,addrBFactory)
// const bRouter = new web3.eth.Contract(IRouter.abi,addrBRouter)
// const mFactory = new web3.eth.Contract(IFactory.abi,addrMFactory)//mistswap, same ABIs, mistswap forked from sushiswap and sushiswap forked uniswap so, basically same contracts
// const mRouter = new web3.eth.Contract(IRouter.abi,addrMRouter)
// const token0 = new web3.eth.Contract(IERC20.abi,addrToken0)//henceforth T0
// const token1 = new web3.eth.Contract(IERC20.abi,addrToken1)//and T1
// const utils = new web3.eth.Contract(Utils.abi, addrUtils)//because includes an support math function that its required

// //asyncs variables
// let bPair0,bPair1,mPair,myAccount,token0Name,token1Name,token0Symbol,token1Symbol
// async function asyncsVar() {
//     //will be used to determine BCH price later
//     bPair0 = new web3.eth.Contract(IPair.abi, (await bFactory.methods.getPair(addrBch, addrFlexUsd).call()) )
//     //token pairs
//     bPair1 = new web3.eth.Contract(IPair.abi, (await bFactory.methods.getPair(token0.options.address, token1.options.address).call()) )
//     mPair = new web3.eth.Contract(IPair.abi, (await mFactory.methods.getPair(token0.options.address, token1.options.address).call()) )

//     //account with you will be using to sign the transactions
//     const accountObj = await web3.eth.accounts.privateKeyToAccount(privateKey)
//     myAccount = accountObj.address
//     console.log("myAccount: ", myAccount);

//     token0Name = await token0.methods.name().call()
//     token0Symbol = await token0.methods.symbol().call()
//     token1Name = await token1.methods.name().call()
//     token1Symbol = await token1.methods.symbol().call()
// }


async function validate(tokenStr, data, opts) {
	if (!/^(\w+\.)*\w+\.(test|eth)$/.test(tokenStr) && !ethjs.isValidAddress(tokenStr)) {
		throw new Error(`Invalid Token address: ${tokenStr}`);
	}

	for (const [to, amount] of Object.entries(data)) {
		if (!/^(\w+\.)*\w+\.(test|eth)$/.test(to) && !ethjs.isValidAddress(to)) {
			throw new Error(`Invalid address: ${to}`);
		}

		if (!_.isNumber(amount) && !/^\d+(\.\d+)?$/.test(amount)) {
			throw new Error(`Invalid amount: ${amount}`);
		}
	}

	if (!_.isNil(opts.decimals) && !_.inRange(opts.decimals, 0, 256)) {
		throw new Error(`Invalid decimals: ${opts.decimals}`);
	}
}

function toDecimal(amount, decimals) {
	return new BigNumber(amount).div(`1e${decimals}`).toString(10);
}

async function resolveSymbol(contract) {
	try {
		// return await contract.symbol();
		return await contract.methods.symbol().call();
	} catch (err) {
		return '???';
	}
}

function doLog(tokenSymbol, contractAddress, decimals, sender, amount, to, opts) {
	// const logId = createLogId({
	// 	time: _.now(),
	// 	token: token,
	// 	to: to,
	// 	amount: amountForLog,
	// 	from: sender
	// });
	// const writeLog = opts.log ? createJSONLogger(logId, opts.log) : _.noop;
	const say = opts.quiet ? _.noop : console.log;

	say(`Token: ${tokenSymbol.bold} @ ${contractAddress.green.bold} (${decimals} decimal places)`);
	say(`${sender.blue.bold} -> ${toDecimal(amount, decimals).yellow.bold} ${tokenSymbol} -> ${to.blue.bold}`);
}

function toWei(amount, decimals) {
	return new BigNumber(amount).times(`1e${decimals}`).integerValue().toString(10);
}

// function toFixed(x) {
// 	if (Math.abs(x) < 1.0) {
// 	  var e = parseInt(x.toString().split('e-')[1]);
// 	  if (e) {
// 		  x *= Math.pow(10,e-1);
// 		  x = '0.' + (new Array(e)).join('0') + x.toString().substring(2);
// 	  }
// 	} else {
// 	  var e = parseInt(x.toString().split('+')[1]);
// 	  if (e > 20) {
// 		  e -= 20;
// 		  x /= Math.pow(10,e);
// 		  x += (new Array(e+1)).join('0');
// 	  }
// 	}
// 	return x;
// }

async function sendMultipleTokens(web3, tokenStr, data, opts={}) {
	validate(tokenStr, data, opts);

	// const token = ethjs.isValidAddress(tokenStr) ? ethjs.toChecksumAddress(tokenStr) : tokenStr;

	// const tokenContract = new web3.eth.Contract(IERC20.abi, tokenStr);
	const tokenContract = new web3.eth.Contract(ERC20_ABI, tokenStr);
	// console.log("tokenContract: ", tokenContract);
	const decimals = await tokenContract.methods.decimals().call();
	// console.log("decimals: ", decimals);

	const tokenSymbol = await resolveSymbol(tokenContract);
	// console.log("tokenSymbol: ", tokenSymbol);

	const privateKey = opts.key;
	// console.log("privateKey: ", privateKey);

    const accountObj = await web3.eth.accounts.privateKeyToAccount(privateKey);
    const sender = accountObj.address;
    console.log("sender: ", sender);

	if ( ! sender) {
		throw new Error('Cannot determine sender.');
	}

	// const gasNeeded = 172079;
	// const gasCost = Number(currentGasPrice)*gasNeeded/10**18

	const currentGasPrice = await web3.eth.getGasPrice();
	// console.log(`currentGasPrice: ${currentGasPrice}`)
	const gasPrice = ethers.utils.hexlify(parseInt(currentGasPrice));
	// console.log(`gasPrice: ${gasPrice}`)
	const gasLimit = ethers.utils.hexlify(61623);
	// console.log(`gasLimit: ${gasLimit}`);

	let receipts = [];

	for (const [toStr, amountData] of Object.entries(data)) {

		// const to = ethjs.isValidAddress(toStr) ? ethjs.toChecksumAddress(toStr) : toStr;
		const amountForLog = toWei(amountData, decimals);
		// console.log("amountForLog: ", amountForLog);

		// doLog(tokenSymbol, opts);
		doLog(tokenSymbol, tokenStr, decimals, sender, amountForLog, toStr, opts);

		// if (opts.confirm) {
		// 	if (!(await confirm()))
		// 		return;
		// }

		// console.log("amountData: ", amountData);
		// const intAmount = (amountData * 10**decimals).toString();
		// const intAmount = (amountData * 10**decimals).toFixed(0);
		// const intAmount = toFixed(amountData * 10**decimals);
		// console.log("intAmount: ", intAmount);
		// const amount = ethers.BigNumber.from(intAmount);
		const amount = toWei(amountData, decimals)
		// console.log("amount: ", amount);

		const tx = {
			from: sender,
			to: tokenContract.options.address,
			gasLimit: gasLimit,
			gasPrice: gasPrice,
			// gas: gasNeeded,
			// data: tokenContract.methods.approve(bRouter.options.address,amountIn).encodeABI()
			data: tokenContract.methods.transfer(toStr, amount).encodeABI()
		}
		// console.log('tx: ', tx);

		signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
		// console.log('signedTx: ', signedTx);

		// console.log('Tx pending {1/1}')
		receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)

		console.log(`Tx hash: ${receipt.transactionHash}\n`);

		receipts.push({
			to: toStr,
			txid: receipt.transactionHash,
			receipt: receipt
		});
	}

	return receipts;








	// // const tx0 = {//transaction
	// //     from: myAccount,
	// //     to: token0.options.address,
	// //     gas: gasNeeded0,
	// //     data: token0.methods.approve(bRouter.options.address,amountIn).encodeABI()
	// // }
	// // console.log('tx0: ', tx0);

	// // signedTx0 = await web3.eth.accounts.signTransaction(tx0, privateKey);
	// // console.log('signedTx0: ', signedTx0);

	// // console.log('Tx pending {1/2}')
	// // receipt0 = await web3.eth.sendSignedTransaction(signedTx0.rawTransaction)

	// // console.log(
	// //     `Tx mined\n`+
	// //     `Tx hash: ${receipt0.transactionHash}\n`
	// //     )


	// console.log('swapETHForExactTokens-----------------------------------');
	// console.log('amountIn:   ', amountIn);
	// console.log('amountOut:  ', amountOut);
	// console.log('path:      ', path);
	// console.log('myAccount: ', myAccount);
	// console.log('deadline:  ', deadline);
	// console.log('bRouter.options.address:  ', bRouter.options.address);

	// const tx1 = {
	// 	from: myAccount,
	// 	to: bRouter.options.address,
	// 	gas: gasNeeded1,
	// 	data: bRouter.methods.swapETHForExactTokens(
	// 		amountOut,
	// 		path,
	// 		myAccount,
	// 		deadline
	// 	).encodeABI()
	// };


	// console.log('tx1: ', tx1);

	// signedTx1 = await web3.eth.accounts.signTransaction(tx1, privateKey);
	// console.log('signedTx1: ', signedTx1);


	// // const temp = Math.round(Date.now()/1000);
	// // console.log("temp: ", temp);


	// console.log('Tx pending {2/2}')
	// receipt1 = await web3.eth.sendSignedTransaction(signedTx1.rawTransaction)

	// console.log(
	// 	`Tx mined, trade executed!\n`+
	// 	`Tx hash: ${receipt1.transactionHash}\n`
	// 	);
}

// Trezor 1:    1662592.245 KTH
// Arbitraje2:    56651.837 KTH