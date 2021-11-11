require('dotenv').config()//for importing parameters
const {sendMultipleTokens} = require('./lib');
const Web3 = require('web3')
const BigNumber = require('bignumber.js');
const { ethers } = require('ethers');

const ERC20_ABI = require('./erc20.abi.json');
const ROUTER_ABI = require('./UniswapV2Router02.abi.json');
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

_web3.eth.net.getId().then(async function(netId) {
	// const privateKey = process.env.DEV_PRIVATE_KEY
	const privateKey = process.env.DEPLOYER_PRIVATE_KEY
	const routerAddr = process.env.ROUTER_ADDRESS;
	const tokenAddr = '0x77CB87b57F54667978Eb1B199b28a0db8C8E1c0B';
	const amountTokenDesired = '813666000000000000';
	const amountTokenMin = '813666000000000000';
	const amountETHMin = '1000000000000000';
	// const deadline = '0x61898e7e';
	const deadline = getDeadline();

	console.log('routerAddr:                     ', routerAddr);
	console.log('tokenAddr:                      ', tokenAddr);
	console.log('amountTokenDesired:             ', amountTokenDesired);
	console.log('amountTokenMin:                 ', amountTokenMin);
	console.log('amountETHMin:                   ', amountETHMin);
	console.log('deadline:                       ', deadline);
	// console.log('routerContract.options.address: ', routerContract.options.address);

	await approveAndAddLiquidityETH(_web3, routerAddr, privateKey, tokenAddr,
		                            amountTokenDesired, amountTokenMin, amountETHMin, deadline);

});



// const now = new Date()
// const secondsSinceEpoch = Math.round(now.getTime() / 1000)
// const utcMilllisecondsSinceEpoch = now.getTime() + (now.getTimezoneOffset() * 60 * 1000)
// const utcSecondsSinceEpoch = Math.round(utcMilllisecondsSinceEpoch / 1000)

// console.log('utcSecondsSinceEpoch: ', utcSecondsSinceEpoch);
// console.log('secondsSinceEpoch:    ', secondsSinceEpoch);


