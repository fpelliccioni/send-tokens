'use strict'
require('colors');
const _ = require('lodash');

const { ethers } = require("ethers");
const FlexContract = require('flex-contract');
// const FlexEther = require('flex-ether');
const BigNumber = require('bignumber.js');
const ethjs = require('ethereumjs-util');
const ethwallet = require('ethereumjs-wallet');
const ethjshdwallet = require('ethereumjs-wallet/hdkey');
const bip39 = require('bip39');
const fs = require('mz/fs');
const readline = require('readline');
const process = require('process');
const prompt = require('prompt');
prompt.message = '';
prompt.delimiter = ':';
const ERC20_ABI = require('./erc20.abi.json');

module.exports = {
	sendTokens: sendTokens,
	sendMultipleTokens: sendMultipleTokens,
	toWallet: toWallet
};

function toWallet(opts) {
	let from = null;
	let key = null;
	if (opts.mnemonic || opts.key || opts.keystore) {
		key = getPrivateKey(opts);
		if (key)
			from = keyToAddress(key);
	}
	return {
		address: from,
		key: key
	};
}

// https://ethereum.org/en/developers/tutorials/send-token-etherjs/
// function send_token(provider,
// 	walletSigner,
// 	contract_address,
// 	send_token_amount,
// 	to_address,
// 	send_account
// 	) {

// 	provider.getGasPrice().then((currentGasPrice) => {
// 	  let gas_price = ethers.utils.hexlify(parseInt(currentGasPrice))
// 	  console.log(`gas_price: ${gas_price}`)

// 	  if (contract_address) {
// 		// general token send
// 		let contract = new ethers.Contract(
// 		  contract_address,
// 		  send_abi,
// 		  walletSigner
// 		)

// 		// How many tokens?
// 		let numberOfTokens = ethers.utils.parseUnits(send_token_amount, 18)
// 		console.log(`numberOfTokens: ${numberOfTokens}`)

// 		// Send tokens
// 		contract.transfer(to_address, numberOfTokens).then((transferResult) => {
// 		  console.dir(transferResult)
// 		  alert("sent token")
// 		})
// 	  } // ether send
// 	  else {
// 		const tx = {
// 		  from: send_account,
// 		  to: to_address,
// 		  value: ethers.utils.parseEther(send_token_amount),
// 		  nonce: provider.getTransactionCount(
// 			send_account,
// 			"latest"
// 		  ),
// 		  gasLimit: ethers.utils.hexlify(gas_limit), // 100000
// 		  gasPrice: gas_price,
// 		}
// 		console.dir(tx)
// 		try {
// 		  walletSigner.sendTransaction(tx).then((transaction) => {
// 			console.dir(transaction)
// 			alert("Send finished!")
// 		  })
// 		} catch (error) {
// 		  alert("failed to send!!")
// 		}
// 	  }
// 	})
//   }

// async function send_token(provider,
// 	contract,
// 	amount,
// 	to_address,
// ) {


// 	const currentGasPrice = await provider.getGasPrice();
// 	console.log("currentGasPrice: ", currentGasPrice);

// 	let gas_price = ethers.utils.hexlify(parseInt(currentGasPrice))
// 	console.log(`gas_price: ${gas_price}`);

// 	// How many tokens?
// 	let numberOfTokens = ethers.utils.parseUnits(amount, 18)
// 	console.log(`numberOfTokens: ${numberOfTokens}`);

// 	// Send tokens
// 	const transferResult = await contract.transfer(to_address, numberOfTokens);
// 	console.dir(transferResult)
// 	return transferResult;
// }


async function send_token(provider, walletSigner, send_token_amount, to_address, send_account) {

	const currentGasPrice = await provider.getGasPrice();
	const gas_price = ethers.utils.hexlify(parseInt(currentGasPrice));
	console.log(`gas_price: ${gas_price}`)
	const gas_limit = 48925;

	console.log(`send_token_amount: ${send_token_amount}`);
	console.log(`send_token_amount: ${ethers.utils.parseEther(send_token_amount)}`);


	const tx = {
		from: send_account,
		to: to_address,
		value: ethers.utils.parseEther(send_token_amount),
		nonce: await provider.getTransactionCount(
			send_account,
			"latest"
		),
		gasLimit: ethers.utils.hexlify(gas_limit), // 100000
		gasPrice: gas_price,
	}
	console.dir(tx);
	const transaction = await walletSigner.sendTransaction(tx);
	console.dir(transaction);
	return transaction;
}

async function sendMultipleTokens(token, data, opts={}) {
	if (!/^(\w+\.)*\w+\.(test|eth)$/.test(token) && !ethjs.isValidAddress(token)) {
		throw new Error(`Invalid Token address: ${token}`);
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

	token = ethjs.isValidAddress(token) ? ethjs.toChecksumAddress(token) : token;


	const provider = getProvider();
	let wallet = new ethers.Wallet(opts.key);
	let walletSigner = wallet.connect(provider);


	const confirmations = opts.confirmations || 0;
	const txOpts = await createTransferOpts(opts);
	console.log("txOpts: ", txOpts);
	const contract = createContract(token, walletSigner);
	// console.log("contract: ", contract);
	const sender = await resolveSender(contract._eth, txOpts);
	console.log("sender: ", sender);

	const temp = await contract.decimals();
	console.log("temp: ", temp);


	const tokenDecimals = await resolveDecimals(contract);
	const tokenSymbol = await resolveSymbol(contract);
	const inputDecimals = _.isNumber(opts.decimals) ? opts.decimals : tokenDecimals;

	let receipts = [];

	for (const [toStr, amountData] of Object.entries(data)) {

		const to = ethjs.isValidAddress(toStr) ? ethjs.toChecksumAddress(toStr) : toStr;
		const amountForLog = toWei(amountData, inputDecimals);

		if (!sender) {
			throw new Error('Cannot determine sender.');
		}

		const logId = createLogId({
			time: _.now(),
			token: token,
			to: to,
			amount: amountForLog,
			from: sender
		});
		const writeLog = opts.log ? createJSONLogger(logId, opts.log) : _.noop;
		const say = opts.quiet ? _.noop : console.log;

		say(`Token: ${tokenSymbol.bold} @ ${token.green.bold} (${tokenDecimals} decimal places)`);
		say(`${sender.blue.bold} -> ${toDecimal(amountForLog, tokenDecimals).yellow.bold} ${tokenSymbol} -> ${to.blue.bold}`);
		if (opts.confirm) {
			if (!(await confirm()))
				return;
		}

		const amount = amountData.toString();

		// let xxx = await send_token(provider, contract, amount, to);
		const xxx = await send_token(provider, walletSigner, amount, to, sender);
		console.log("xxx: ", xxx);

		// const {tx} = await transfer(contract, to, amount, txOpts);
		// console.log("tx: ", tx);
		// const txId = await tx.txId;
		// console.log("txId: ", txId);

		// if (_.isFunction(opts.onTxId)) {
		// 	opts.onTxId(txId);
		// }

		// say(`Waiting for transaction ${txId.green.bold} to be mined...`);
		// const receipt = await tx.confirmed(confirmations);
		// const transferEvent = receipt.events.find(e => e.name === 'Transfer');
		// if (!transferEvent) {
		// 	console.warning(`No ERC20 'Transfer' event raised! Verify transfer manually.`);
		// } else {
		// 	say(`Successfully transferred ${toDecimal(transferEvent.args[2], tokenDecimals).yellow.bold} ${tokenSymbol}!`);
		// }

		writeLog({
			from: sender,
			amount: amount,
			token: token,
			to: to,
			// txId: txId,
			// gas: receipt.gasUsed,
			// block: receipt.blockNumber,
		});

		// receipts.push(receipt);
	}

	return receipts;
}


async function sendTokens(token, to, amount, opts={}) {
	for (let addr of [token, to]) {
		if (!/^(\w+\.)*\w+\.(test|eth)$/.test(addr) && !ethjs.isValidAddress(addr))
			throw new Error(`Invalid address: ${addr}`);
	}
	if (!_.isNumber(amount) && !/^\d+(\.\d+)?$/.test(amount))
		throw new Error(`Invalid amount: ${amount}`);
	if (!_.isNil(opts.decimals) && !_.inRange(opts.decimals, 0, 256))
		throw new Error(`Invalid decimals: ${opts.decimals}`);

	token = ethjs.isValidAddress(to) ? ethjs.toChecksumAddress(token) : token;
	to = ethjs.isValidAddress(to) ? ethjs.toChecksumAddress(to) : to;
	const confirmations = opts.confirmations || 0;
	const txOpts = await createTransferOpts(opts);
	const contract = createContract(token, txOpts);
	const sender = await resolveSender(contract._eth, txOpts);
	const tokenDecimals = await resolveDecimals(contract);
	const tokenSymbol = await resolveSymbol(contract);
	const inputDecimals = _.isNumber(opts.decimals) ? opts.decimals : tokenDecimals;
	amount = toWei(amount, inputDecimals);

	if (!sender)
		throw new Error('Cannot determine sender.');

	const logId = createLogId({
		time: _.now(),
		token: token,
		to: to,
		amount: amount,
		from: sender
	});
	const writeLog = opts.log ? createJSONLogger(logId, opts.log) : _.noop;
	const say = opts.quiet ? _.noop : console.log;

	say(`Token: ${tokenSymbol.bold} @ ${token.green.bold} (${tokenDecimals} decimal places)`);
	say(`${sender.blue.bold} -> ${toDecimal(amount, tokenDecimals).yellow.bold} ${tokenSymbol} -> ${to.blue.bold}`);
	if (opts.confirm) {
		if (!(await confirm()))
			return;
	}

	const {tx} = await transfer(contract, to, amount, txOpts);
	const txId = await tx.txId;
	if (_.isFunction(opts.onTxId))
		opts.onTxId(txId);
	say(`Waiting for transaction ${txId.green.bold} to be mined...`);
	const receipt = await tx.confirmed(confirmations);
	const transferEvent = receipt.events.find(e => e.name === 'Transfer');
	if (!transferEvent) {
		console.warning(`No ERC20 'Transfer' event raised! Verify transfer manually.`);
	} else {
		say(`Successfully transferred ${toDecimal(transferEvent.args[2], tokenDecimals).yellow.bold} ${tokenSymbol}!`);
	}

	writeLog({
		from: sender,
		amount: amount,
		token: token,
		to: to,
		txId: txId,
		gas: receipt.gasUsed,
		block: receipt.blockNumber,
	});
	return receipt;
}

function confirm() {
	return new Promise((accept, reject) => {
		prompt.get({
				description: 'Proceed? [y/N]',
				name: 'answer',
			}, (err, {answer}) => {
				answer = (answer || 'n').toLowerCase();
				accept(answer == 'y' || answer == 'yes');
			});
	});
}

async function resolveSender(eth, opts) {
	const w = toWallet(opts);
	if (w && w.address)
		return w.address;
	return eth.getDefaultAccount();
}

async function resolveDecimals(contract) {
	try {
		return _.toNumber(await contract.decimals());
	} catch (err) {
		return 18;
	}
}

async function resolveSymbol(contract) {
	try {
		return await contract.symbol();
	} catch (err) {
		return '???';
	}
}

function toDecimal(amount, decimals) {
	return new BigNumber(amount).div(`1e${decimals}`).toString(10);
}

function toWei(amount, decimals) {
	return new BigNumber(amount).times(`1e${decimals}`).integerValue().toString(10);
}

async function createTransferOpts(opts) {
	const txOpts = {};
	if (opts.key) {
		txOpts.key = ethjs.addHexPrefix(opts.key);
		if (!/^0x[a-f0-9]{64}$/i.test(txOpts.key))
			throw new Error('Invalid private key.');
	} else if (opts.keyFile) {
		txOpts.key = await fs.readFile(opts.keyFile, 'utf-8');
	} else if (opts.keystoreFile) {
		txOpts.keystore = await fs.readFile(opts.keystoreFile, 'utf-8');
		txOpts.password = opts.password;
	} else if (opts.keystore) {
		txOpts.keystore = opts.keystore;
		txOpts.password = opts.password;
	} else if (opts.mnemonic) {
		txOpts.mnemonicIndex = opts.mnemonicIndex || 0;
		txOpts.mnemonic = opts.mnemonic.trim();
	} else if (opts.account) {
		txOpts.from = opts.account;
	} else if (opts.from) {
		txOpts.from = opts.from;
	}

	if (opts.provider) {
		if (_.isString(opts.provider)) {
			txOpts.providerURI = opts.provider;
		}
		else {
			txOpts.provider = opts.provider;
		}
	} else if (opts.providerURI) {
		txOpts.providerURI = opts.providerURI;
	}

	if (opts.network) {
		txOpts.network = opts.network;
	}

	if (opts.gasPrice) {
		txOpts.gasPrice = new BigNumber('1e9')
			.times(opts.gasPrice)
			.integerValue()
			.toString(10);
	}

	if (txOpts.keystore && !txOpts.password)
		txOpts.password = await promptForPassword();
	return txOpts;
}

function promptForPassword() {
	return new Promise((accept, reject) => {
		prompt.get({
				description: 'Enter password',
				name: 'pw',
				hidden: true,
				replace: '*'
			}, (err, {pw}) => {
				if (!pw)
					return reject(pw);
				accept(pw);
			});
	});
}

function createLogId(fields) {
	const s = {
		time: fields.time,
		token: ethjs.toChecksumAddress(fields.token),
		to: ethjs.toChecksumAddress(fields.to),
		from: ethjs.toChecksumAddress(fields.from),
		amount: ethjs.bufferToHex(ethjs.toUnsigned(new ethjs.BN(fields.amount)))
	};
	return ethjs.bufferToHex(
		ethjs.keccak256(Buffer.from(JSON.stringify(s))).slice(0, 8)).slice(2);
}

function createJSONLogger(logId, file) {
	return (payload={}) => {
		const data = _.assign(payload,
			{time: Math.floor(_.now() / 1000), id: logId});
		const line = JSON.stringify(data);
		fs.appendFileSync(file, `${line}\n`);
	};
}

function getProvider() {
    // If you don't specify a //url//, Ethers connects to the default
    // (i.e. ``http:/\/localhost:8545``)
    // const provider = new ethers.providers.JsonRpcProvider("https://rpc.uatvo.com");
    // const provider = new ethers.providers.JsonRpcProvider("https://global.uat.cash");
    const provider = new ethers.providers.JsonRpcProvider("https://smartbch.fountainhead.cash/mainnet");
    // const provider = new ethers.providers.JsonRpcProvider("wss://smartbch-wss.greyh.at");
    // console.log(provider);

    // // The provider also allows signing transactions to
    // // send ether and pay to change state within the blockchain.
    // // For this, we need the account signer...
    // const signer = provider.getSigner()
    // // console.log(signer);

    return provider;
}


function createContract(token, walletSigner) {

	// const contract = new ethers.Contract(token, ERC20_ABI, provider);
	const contract = new ethers.Contract(token, ERC20_ABI, walletSigner);

	// console.log("ret: ", ret);
	return contract;

	// return new FlexContract(
	// 	ERC20_ABI,
	// 	token,
	// 	{
	// 		providerURI: opts.providerURI,
	// 		provider: opts.provider,
	// 		network: opts.network,
	// 		// infuraKey: opts.infuraKey,
	// 		eth: opts.eth,
	// 		net: require('net'),
	// 	},
	// );
}

async function transfer(contract, to, amount, opts={}) {
	let from = undefined;
	let key = undefined;
	if (!opts.mnemonic && !opts.key && !opts.keystore) {
		if (opts.from)
			from = opts.from;
		else
			from = await contract._eth.getDefaultAccount();
	} else {
		const w = toWallet(opts, contract._eth);
		from = w.address;
		key = w.key;
	}
	if (!from)
		throw new Error('No account to send from.');
	await verifyTokenBalance(contract, from, amount);
	return {
		tx: contract.transfer(
			to,
			amount,
			{
				from: key ? undefined : from,
				key: key,
				gasPrice: opts.gasPrice
			},
		),
	};
}

async function verifyTokenBalance(contract, from, amount) {
	const balance = await contract.balanceOf(from);
	if (new BigNumber(balance).lt(amount))
		throw new Error('Insufficient balance.');
}

function keyToAddress(key) {
	return ethjs.toChecksumAddress(ethjs.bufferToHex(
		ethjs.privateToAddress(ethjs.toBuffer(key))));
}

function getPrivateKey(opts) {
	if (opts.key)
		return ethjs.addHexPrefix(opts.key);
	if (opts.keystore)
		return fromKeystore(opts.keystore, opts.password);
	if (opts.mnemonic)
		return fromMnemonic(opts.mnemonic, opts.mnemonicIndex || 0);
}

function fromKeystore(keystore, pw) {
	if (!pw)
		throw new Error('Keystore requires password.');
	if (_.isObject(keystore))
		keystore = JSON.stringify(keystore);
	const wallet = ethwallet.fromV3(keystore, pw, true);
	return ethjs.bufferToHex(wallet.getPrivateKey());
}

function fromMnemonic(mnemonic, idx=0) {
	const seed = bip39.mnemonicToSeedSync(mnemonic.trim());
	const path = `m/44'/60'/0'/0/${idx}`;
	const node = ethjshdwallet.fromMasterSeed(seed).derivePath(path);
	const wallet = node.getWallet();
	return ethjs.bufferToHex(wallet.getPrivateKey());
}
