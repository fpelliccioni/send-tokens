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

function getDeadline(plusMinutes = 20) {
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

// Amount to approve: 115792089237316195423570985008687907853269984665640564039457584007913129639935
//   			      0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff (64 digits)
// value = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
async function approve(web3, privateKey, contract, tokenAddr, spender, value) {
	const currentGasPrice = await web3.eth.getGasPrice();
	const gasPrice = ethers.utils.hexlify(parseInt(currentGasPrice));
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
	const currentGasPrice = await web3.eth.getGasPrice();
	const gasPrice = ethers.utils.hexlify(parseInt(currentGasPrice));
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


// function addLiquidity(uint256 tokenAmount, uint256 ethAmount) private {
// 	// approve token transfer to cover all possible scenarios
// 	_approve(address(this), address(uniswapV2Router), tokenAmount);

// 	// add the liquidity
// 	uniswapV2Router.addLiquidityETH{value: ethAmount}(
// 		address(this),
// 		tokenAmount,
// 		0, // slippage is unavoidable
// 		0, // slippage is unavoidable
// 		owner(),
// 		block.timestamp
// 	);
// }


async function getOrCreatePair(web3, privateKey, factoryContract, tokenA, tokenB) {
	let pair = await factoryContract.methods.getPair(tokenA, tokenB).call();
	// console.log("pair: ", pair);
	if (pair !== '0x0000000000000000000000000000000000000000') {
		return pair;
	}
	return await createPair(web3, privateKey, factoryContract, tokenA, tokenB);
}

async function createPair(web3, privateKey, factoryContract, tokenA, tokenB) {
	const currentGasPrice = await web3.eth.getGasPrice();
	const gasPrice = ethers.utils.hexlify(parseInt(currentGasPrice));
	const gasNeeded = await factoryContract.methods.createPair(tokenA, tokenB).estimateGas({gasPrice: gasPrice});

	const tx = {
		// from: sender,
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
	console.log("transfer() 1");
	const currentGasPrice = await web3.eth.getGasPrice();
	const gasPrice = ethers.utils.hexlify(parseInt(currentGasPrice));

	console.log("transfer() to:    ", to);
	console.log("transfer() value: ", value);

	const gasNeeded = await tokenContract.methods.transfer(to, value).estimateGas({gasPrice: gasPrice});

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

	const pairAddr = await getOrCreatePair(web3, privateKey, factoryContract, tokenA, tokenB);
	console.log("pairAddr:                    ", pairAddr);
	// console.log("IPair:                    ", IPair);

	const pairContract = new web3.eth.Contract(IPair.abi, pairAddr);
	// console.log("pairContract:                    ", await pairContract.symbol());

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
	const tokenA = '0x3743eC0673453E5009310C727Ba4eaF7b3a1cc04';
	const tokenB = '0x77CB87b57F54667978Eb1B199b28a0db8C8E1c0B';
	const amountTokenDesired = '813666000000000000';
	const amountTokenMin = '813666000000000000';
	const amountETHMin = '1000000000000000';
	// const deadline = '0x61898e7e';
	const deadline = getDeadline();
	const amount = 10;




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


	await createSLP(_web3, privateKey, factoryAddr, tokenA, tokenB, amount);

});



// const now = new Date()
// const secondsSinceEpoch = Math.round(now.getTime() / 1000)
// const utcMilllisecondsSinceEpoch = now.getTime() + (now.getTimezoneOffset() * 60 * 1000)
// const utcSecondsSinceEpoch = Math.round(utcMilllisecondsSinceEpoch / 1000)

// console.log('utcSecondsSinceEpoch: ', utcSecondsSinceEpoch);
// console.log('secondsSinceEpoch:    ', secondsSinceEpoch);


