require('dotenv').config()//for importing parameters
const {sendMultipleTokens} = require('./lib');
const Web3 = require('web3')
const BigNumber = require('bignumber.js');
const { ethers } = require('ethers');

const ERC20_ABI = require('./erc20.abi.json');
const ROUTER_ABI = require('./UniswapV2Router02.abi.json');
const FACTORY_ABI = require('./UniswapV2Factory.abi.json');
const IPair = require('@uniswap/v2-core/build/IUniswapV2Pair.json')

function toWei(amount, decimals) {
	return new BigNumber(amount).times(`1e${decimals}`).integerValue().toString(10);
}

let _web3 = new Web3(`https://smartbch.fountainhead.cash/mainnet`);
// let _web3 = new Web3(`https://35.220.203.194:9545`);
// let _web3 = new Web3(`http://35.220.203.194:8545`);

function getDeadline(plusMinutes = 2) {
	// var newDateObj = new Date(oldDateObj.getTime() + diff*60000);
	const now = new Date()
	const secondsSinceEpoch = Math.round((now.getTime() + plusMinutes * 60000) / 1000);
	// const utcMilllisecondsSinceEpoch = now.getTime() + (now.getTimezoneOffset() * 60 * 1000)
	// const utcSecondsSinceEpoch = Math.round(utcMilllisecondsSinceEpoch / 1000)
	// console.log('utcSecondsSinceEpoch: ', utcSecondsSinceEpoch);
	// console.log('secondsSinceEpoch:              ', secondsSinceEpoch);
	// console.log('secondsSinceEpoch.toString(16): ', secondsSinceEpoch.toString(16));
	return '0x' + secondsSinceEpoch.toString(16);
}

async function getGasPrice(web3) {
	let currentGasPrice = await web3.eth.getGasPrice();
	console.log("currentGasPrice == 0: ", currentGasPrice == 0);
	if (currentGasPrice == 0) {
		currentGasPrice = 1050000000;
	}
	const gasPrice = ethers.utils.hexlify(parseInt(currentGasPrice));
	console.log(currentGasPrice);
	console.log(gasPrice);
	return gasPrice;
}


// Amount to approve: 115792089237316195423570985008687907853269984665640564039457584007913129639935
//   			      0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff (64 digits)
// value = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
async function approve(web3, privateKey, contract, tokenAddr, spender, value) {
	const gasPrice = await getGasPrice(web3);
	const gasNeeded = 59418;		//hardcoded

	const tx = {
		// from: contract.options.address,
		to: tokenAddr,
		gasLimit: gasNeeded,
		gasPrice: gasPrice,
		data: contract.methods.approve(spender, value).encodeABI(),
	}
	console.log('approve tx: ', tx);
	const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
	const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
	console.log(`approve tx hash: ${receipt.transactionHash}\n`);
}

async function addLiquidityETH(web3,
	routerAddr, privateKey,
	token, amountTokenDesired, amountTokenMin, amountETHMin, deadline)
{
	const routerContract = new web3.eth.Contract(ROUTER_ABI, routerAddr);
	const accountObj = await _web3.eth.accounts.privateKeyToAccount(privateKey);
	const gasPrice = await getGasPrice(web3);
	const gasNeeded = 2815124; //hardcoded

	const tx = {
		// from: accountObj.address,
		to: routerContract.options.address,
		value: amountETHMin,
		gasLimit: gasNeeded,
		gasPrice: gasPrice,
		// data: routerContract.methods.addLiquidityETH(token, amountTokenDesired, amountTokenMin, amountETHMin, accountObj.address, deadline).encodeABI(),
		data: routerContract.methods.addLiquidityETH(token, amountTokenDesired, 0, 0, accountObj.address, deadline).encodeABI(),
	}
	console.log('addLiquidityETH tx: ', tx);
	const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
	const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
	console.log(`addLiquidityETH tx hash: ${receipt.transactionHash}\n`);
}

async function approveAndAddLiquidityETH(web3,
	routerAddr, privateKey,
	tokenAddr, amountTokenDesired, amountTokenMin, amountETHMin, deadline)
{
	const accountObj = await _web3.eth.accounts.privateKeyToAccount(privateKey);
	console.log('accountObj.address: ', accountObj.address);
	const accountContract = new _web3.eth.Contract(ERC20_ABI, accountObj.address);
	const routerContract = new web3.eth.Contract(ROUTER_ABI, routerAddr);

	// _approve(address(this), address(uniswapV2Router), tokenAmount);
	await approve(web3, privateKey, accountContract, tokenAddr, routerContract.options.address, amountTokenDesired);

	await addLiquidityETH(web3,
		routerAddr, privateKey,
		tokenAddr, amountTokenDesired, amountTokenMin, amountETHMin, deadline);
}

async function getOrCreatePair(web3, privateKey, factoryContract, tokenA, tokenB) {
	let pair = await factoryContract.methods.getPair(tokenA, tokenB).call();
	console.log("pair: ", pair);
	if (pair !== '0x0000000000000000000000000000000000000000') {
		return pair;
	}
	return await createPair(web3, privateKey, factoryContract, tokenA, tokenB);
}

async function createPair(web3, privateKey, factoryContract, tokenA, tokenB) {
	const gasPrice = await getGasPrice(web3);
	const gasNeeded = await factoryContract.methods.createPair(tokenA, tokenB).estimateGas({gasPrice: gasPrice});
	// const gasNeeded = 2059662;		//hardcoded

	const tx = {
		// from: sender,
		value: 0,
		to: factoryContract.options.address,
		gasLimit: gasNeeded,
		gasPrice: gasPrice,
		data: factoryContract.methods.createPair(tokenA, tokenB).encodeABI(),
	}
	console.log('createPair tx: ', tx);
	const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
	const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)

	console.log(`createPair receipt: ${receipt}\n`);
	console.log(`createPair tx hash: ${receipt.transactionHash}\n`);

	// res = await factoryContract.methods.getPair(tokenA, tokenB).call();
	// console.log("res: ", res);
}

async function transfer(web3, privateKey, tokenContract, to, value) {

	const accountObj = await _web3.eth.accounts.privateKeyToAccount(privateKey);
	const _from = accountObj.address;

	console.log("transfer() 1");
	const gasPrice = await getGasPrice(web3);

	console.log("transfer() _from: ", _from);
	console.log("transfer() to:    ", to);
	console.log("transfer() value: ", value);

	// const gasNeeded = await tokenContract.methods.transfer(to, value).estimateGas({from: _from, gasPrice: gasPrice});
	const gasNeeded = 585251;		//hardcoded

	console.log("transfer() 2");
	const tx = {
		// from: sender,
		to: tokenContract.options.address,
		gasLimit: gasNeeded,
		gasPrice: gasPrice,
		data: tokenContract.methods.transfer(to, value).encodeABI(),
	}
	console.log('transfer tx: ', tx);
	const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
	const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)

	console.log(`transfer receipt: ${receipt}\n`);
	console.log(`transfer tx hash: ${receipt.transactionHash}\n`);
}



// export async function createSLP(thisObject, name, tokenA, tokenB, amount) {
// 	const createPairTx = await thisObject.factory.createPair(tokenA.address, tokenB.address)

// 	const _pair = (await createPairTx.wait()).events[0].args.pair

// 	thisObject[name] = await thisObject.UniswapV2Pair.attach(_pair)

// 	await tokenA.transfer(thisObject[name].address, amount)
// 	await tokenB.transfer(thisObject[name].address, amount)

// 	await thisObject[name].mint(thisObject.alice.address)
//   }

async function createSLP(web3, privateKey, factoryAddr, tokenA, tokenB, amount) {
	const factoryContract = new web3.eth.Contract(FACTORY_ABI, factoryAddr);

	let pairCodeHash = await factoryContract.methods.pairCodeHash().call();
	console.log("pairCodeHash: ", pairCodeHash);

	const pairAddr = await getOrCreatePair(web3, privateKey, factoryContract, tokenA, tokenB);
	console.log("pairAddr:                    ", pairAddr);
	// console.log("IPair:                    ", IPair);

	const pairContract = new web3.eth.Contract(IPair.abi, pairAddr);
	// console.log("pairContract:                    ", await pairContract.symbol());

	let reserves = await pairContract.methods.getReserves().call();
	console.log("reserves: ", reserves);


	const tokenAContract = new _web3.eth.Contract(ERC20_ABI, tokenA);
	const tokenASymbol = await tokenAContract.methods.symbol().call();
	console.log("tokenASymbol:                    ", tokenASymbol);
	console.log('tokenAContract.options.address:  ', tokenAContract.options.address);

	const tokenBContract = new _web3.eth.Contract(ERC20_ABI, tokenB);
	const tokenBSymbol = await tokenBContract.methods.symbol().call();
	console.log("tokenBSymbol:                    ", tokenBSymbol);
	console.log('tokenBContract.options.address:  ', tokenBContract.options.address);

	await transfer(web3, privateKey, tokenAContract, pairContract.options.address, amount);

// 	await tokenA.transfer(thisObject[name].address, amount)
// 	await tokenB.transfer(thisObject[name].address, amount)

// 	await thisObject[name].mint(thisObject.alice.address)

}

_web3.eth.net.getId().then(async function(netId) {
	// const privateKey = process.env.DEV_PRIVATE_KEY
	const privateKey = process.env.DEPLOYER_PRIVATE_KEY
	const routerAddr = process.env.ROUTER_ADDRESS;
	const factoryAddr = process.env.FACTORY_ADDRESS;

	const tokenA = '0x3743eC0673453E5009310C727Ba4eaF7b3a1cc04';			// WBCH
	// const tokenB = '0x77CB87b57F54667978Eb1B199b28a0db8C8E1c0B';			// EBEN (mainnet)
	// const tokenB = '0x19a2685c097cB28F50c0E322D23Be415d066aCC6';			// TTK
	const tokenB = '0x4d927B6bb73C009d870871420E9E51a8b8355Ee2';			// TTT
	// const tokenB = '0x317e2dbd67cA406548C47368eb21fB30870f6B4D';			//TTT2

	const amountTokenDesired = '813666000000000000';
	const amountTokenMin = '813666000000000000';
	const amountETHMin = '1000000000000000';
	const deadline = getDeadline();
	const amount = '1000000000000000';

	console.log("factoryAddr:                    ", factoryAddr);
	console.log('routerAddr:                     ', routerAddr);
	console.log('tokenA:                         ', tokenA);
	console.log('tokenB:                         ', tokenB);
	console.log('amountTokenDesired:             ', amountTokenDesired);
	console.log('amountTokenMin:                 ', amountTokenMin);
	console.log('amountETHMin:                   ', amountETHMin);
	console.log('deadline:                       ', deadline);
	// console.log('routerContract.options.address: ', routerContract.options.address);

	// await approveAndAddLiquidityETH(_web3, routerAddr, privateKey, tokenAddr,
	// 	                            amountTokenDesired, amountTokenMin, amountETHMin, deadline);


	// await createSLP(_web3, privateKey, factoryAddr, tokenA, tokenB, amount);
	await createSLP(_web3, privateKey, factoryAddr, tokenA, tokenB, amountTokenDesired);
	

});



// const now = new Date()
// const secondsSinceEpoch = Math.round(now.getTime() / 1000)
// const utcMilllisecondsSinceEpoch = now.getTime() + (now.getTimezoneOffset() * 60 * 1000)
// const utcSecondsSinceEpoch = Math.round(utcMilllisecondsSinceEpoch / 1000)

// console.log('utcSecondsSinceEpoch: ', utcSecondsSinceEpoch);
// console.log('secondsSinceEpoch:    ', secondsSinceEpoch);


