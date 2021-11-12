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
	const currentGasPrice = await web3.eth.getGasPrice();
	const gasPrice = ethers.utils.hexlify(parseInt(currentGasPrice));
	// const gasNeeded = 59418;		//hardcoded
	const gasNeeded = await contract.methods.approve(spender, value).estimateGas({from: contract.options.address, gasPrice: gasPrice});

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


async function transferFrom(web3, privateKey, tokenContract, from, to, value) {
	console.log("transferFrom() 1");
	const gasPrice = await getGasPrice(web3);

	console.log("transferFrom() from:  ", from);
	console.log("transferFrom() to:    ", to);
	console.log("transferFrom() value: ", value);

	const gasNeeded = await tokenContract.methods.transferFrom(from, to, value).estimateGas({gasPrice: gasPrice});
	// const gasNeeded = 585251;		//hardcoded

	console.log("transferFrom() 2");
	const tx = {
		// from: sender,
		to: tokenContract.options.address,
		gasLimit: gasNeeded,
		gasPrice: gasPrice,
		data: tokenContract.methods.transferFrom(from, to, value).encodeABI(),
	}
	console.log('transferFrom() tx: ', tx);
	const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
	const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)

	console.log(`transferFrom() receipt: ${receipt}\n`);
	console.log(`transferFrom() tx hash: ${receipt.transactionHash}\n`);
}

async function addLiquidityETH(web3,
	routerAddr, privateKey,
	token, amountTokenDesired, amountTokenMin, amountETHMin, deadline)
{
	const routerContract = new web3.eth.Contract(ROUTER_ABI, routerAddr);
	const accountObj = await _web3.eth.accounts.privateKeyToAccount(privateKey);
	const currentGasPrice = await web3.eth.getGasPrice();
	const gasPrice = ethers.utils.hexlify(parseInt(currentGasPrice));
	// const gasNeeded = 2815124; //hardcoded
	// const gasNeeded = await routerContract.methods.addLiquidityETH(token, amountTokenDesired, amountTokenMin, amountETHMin, accountObj.address, deadline).estimateGas({gasPrice: gasPrice});
	const gasNeeded = await routerContract.methods.addLiquidityETHTemp(token, amountTokenDesired, amountTokenMin, amountETHMin, accountObj.address, deadline).estimateGas({gasPrice: gasPrice});


	console.log('gasNeeded: ', gasNeeded);

	const tx = {
		// from: accountObj.address,
		to: routerContract.options.address,
		value: amountETHMin,
		gasLimit: gasNeeded,
		gasPrice: gasPrice,
		data: routerContract.methods.addLiquidityETHTemp(token, amountTokenDesired, amountTokenMin, amountETHMin, accountObj.address, deadline).encodeABI(),
		// data: routerContract.methods.addLiquidityETH(token, amountTokenDesired, amountTokenMin, amountETHMin, accountObj.address, deadline).encodeABI(),
		// data: routerContract.methods.addLiquidityETH(token, amountTokenDesired, 0, 0, accountObj.address, deadline).encodeABI(),
	}
	console.log('addLiquidityETH tx: ', tx);
	const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
	const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
	console.log(`addLiquidityETH tx hash: ${receipt.transactionHash}\n`);
	console.log(`addLiquidityETH receipt: ${JSON.stringify(receipt)}\n`);
}

async function approveAndAddLiquidityETH(web3,
	routerAddr, privateKey,
	tokenAddr, amountTokenDesired, amountTokenMin, amountETHMin, deadline)
{
	const accountObj = await _web3.eth.accounts.privateKeyToAccount(privateKey);
	console.log('accountObj.address: ', accountObj.address);
	const accountContract = new _web3.eth.Contract(ERC20_ABI, accountObj.address);
	const routerContract = new web3.eth.Contract(ROUTER_ABI, routerAddr);

	// // _approve(address(this), address(uniswapV2Router), tokenAmount);
	// const max = "115792089237316195423570985008687907853269984665640564039457584007913129639935";
	// // await approve(web3, privateKey, accountContract, tokenAddr, routerContract.options.address, amountTokenDesired);
	// await approve(web3, privateKey, accountContract, tokenAddr, routerContract.options.address, max);

	await addLiquidityETH(web3,
		routerAddr, privateKey,
		tokenAddr, amountTokenDesired, amountTokenMin, amountETHMin, deadline);
}

_web3.eth.net.getId().then(async function(netId) {
	const privateKey = process.env.DEPLOYER_PRIVATE_KEY
	const routerAddr = process.env.ROUTER_ADDRESS;

	// const tokenAddr = '0x77CB87b57F54667978Eb1B199b28a0db8C8E1c0B';	//EBEN
	const tokenAddr = '0x4d927B6bb73C009d870871420E9E51a8b8355Ee2';	//TTT
	const wbchAddr = '0x3743eC0673453E5009310C727Ba4eaF7b3a1cc04';	//WBCH, WETH

	const amountTokenDesired = '813666000000000000';
	// const amountTokenMin = '813666000000000000';
	const amountTokenMin = '1000000000000000';
	const amountETHMin = '1000000000000000';
	const deadline = getDeadline();

	console.log('routerAddr:                     ', routerAddr);
	console.log('tokenAddr:                      ', tokenAddr);
	console.log('amountTokenDesired:             ', amountTokenDesired);
	console.log('amountTokenMin:                 ', amountTokenMin);
	console.log('amountETHMin:                   ', amountETHMin);
	console.log('deadline:                       ', deadline);

	// await approveAndAddLiquidityETH(_web3, routerAddr, privateKey, tokenAddr,
	// 	                            amountTokenDesired, amountTokenMin, amountETHMin, deadline);

	const factoryAddr = process.env.FACTORY_ADDRESS;
	const factoryContract = new _web3.eth.Contract(FACTORY_ABI, factoryAddr);
	const tokenContract = new _web3.eth.Contract(ERC20_ABI, tokenAddr);
	const tokenSymbol = await tokenContract.methods.symbol().call();
	console.log("tokenSymbol:                    ", tokenSymbol);
	console.log('tokenContract.options.address:  ', tokenContract.options.address);

	const pair = await factoryContract.methods.getPair(tokenAddr, wbchAddr).call();
	console.log("pair: ", pair);


	const accountObj = await _web3.eth.accounts.privateKeyToAccount(privateKey);
	console.log("accountObj.address: ", accountObj.address);

	// function allowance(address owner, address spender) public view virtual override returns (uint256) {
	let allowance = await tokenContract.methods.allowance(accountObj.address, accountObj.address).call();
	console.log("allowance: ", allowance);

	// await approve(_web3, privateKey, tokenContract, tokenAddr, accountObj.address, amountTokenDesired);
	// allowance = await tokenContract.methods.allowance(accountObj.address, accountObj.address).call();
	// console.log("allowance: ", allowance);

	await transferFrom(_web3, privateKey, tokenContract, accountObj.address, pair, amountTokenDesired);
});
