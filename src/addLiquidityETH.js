require('dotenv').config()//for importing parameters
const {sendMultipleTokens} = require('./lib');
const Web3 = require('web3')
const BigNumber = require('bignumber.js');
const { ethers } = require("ethers");

const ERC20_ABI = require('./erc20.abi.json');
const ROUTER_ABI = require('./UniswapV2Router02.abi.json');
const IPair = require('@uniswap/v2-core/build/IUniswapV2Pair.json')

function toWei(amount, decimals) {
	return new BigNumber(amount).times(`1e${decimals}`).integerValue().toString(10);
}


// const privateKey = process.env.DEV_PRIVATE_KEY
const privateKey = process.env.DEPLOYER_PRIVATE_KEY


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
	// Amount to approve: 115792089237316195423570985008687907853269984665640564039457584007913129639935
	//   			      0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff (64 digits)

	value = '115792089237316195423570985008687907853269984665640564039457584007913129639935';

	const currentGasPrice = await web3.eth.getGasPrice();
	console.log(`currentGasPrice: ${currentGasPrice}`)
	const gasPrice = ethers.utils.hexlify(parseInt(currentGasPrice));
	console.log(`gasPrice: ${gasPrice}`)

	// const gasNeeded = await contract.methods.approve(spender, value).estimateGas({gasPrice: gasPrice});
	const gasNeeded = 59418;
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
	console.log('tx: ', tx);

	const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
	console.log('signedTx: ', signedTx);

	const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
	console.log(`Tx hash: ${receipt.transactionHash}\n`);
}

web3.eth.net.getId().then(async function(netId) {
	console.log('netId: ', netId);

	const routerAddr = process.env.ROUTER_ADDRESS;
	console.log("routerAddr: ", routerAddr);


	const pairAddr = '0x5B8D7645E354A971D6B07090aCdFDF335974C264';
	// const pairContract = new web3.eth.Contract(IPair.abi, pairAddr);
	// console.log("pairContract: ", pairContract);
	const routerContract = new web3.eth.Contract(ROUTER_ABI, routerAddr);
	// console.log("routerContract: ", routerContract);


	const accountObj = await web3.eth.accounts.privateKeyToAccount(privateKey);
    const from = accountObj.address;
    console.log("from: ", from);



	const decimals = 18;
	// const decimals = await routerContract.methods.decimals().call();
	console.log("decimals: ", decimals);

	const token = '0x77CB87b57F54667978Eb1B199b28a0db8C8E1c0B';
	const amountTokenDesired = '813666000000000000';
	const amountTokenMin = '813666000000000000';
	const amountETHMin = '1000000000000000';
	// const to = '0xB79E7e395Ed0406e279cEb3838cD3c7db1D7CbfF';
	const to = from;
	// const deadline = '0x61880441';
	const deadline = '0x61898e7e';

	// const amountTokenDesired = toWei(amountTokenDesiredStr, decimals);
	// const amountTokenMin = toWei(amountTokenMinStr, decimals);
	// const amountETHMin = toWei(amountETHMinStr, decimals);

	console.log('amountTokenDesired: ', amountTokenDesired);
	console.log('amountTokenMin:     ', amountTokenMin);
	console.log('amountETHMin:       ', amountETHMin);
	console.log('amountETHMin:       ', amountETHMin);
	console.log('to:                 ', to);
	console.log('routerContract.options.address:       ', routerContract.options.address);


	const accountContract = new web3.eth.Contract(ERC20_ABI, from);
	// console.log("accountContract: ", accountContract);
	// await approve(accountContract, token, routerContract.options.address, amountTokenDesired);
	// await approve(accountContract, pairAddr, routerContract.options.address, amountTokenDesired);


	// value = BigNumber.from((tokenBIsETH ? parsedAmountB : parsedAmountA).quotient.toString())
	// const value = new BigNumber(amountETHMin).quotient;
	// console.log(value);
	// return


	// console.log("ETH amount: ", toWei('0.001', 18));

	// routerContract.methods.addLiquidityETH(token, amountTokenDesired, amountTokenMin, amountETHMin, to, deadline)
	// .estimateGas({
	// 		gasPrice: 1050000000,
	// 		value: amountETHMin,
	// 		// from: from
	// 	}, function(error, gasAmount){
	// 	console.log('error: ', error);
	// 	console.log('gasAmount: ', gasAmount);
	// });



	const currentGasPrice = await web3.eth.getGasPrice();
	console.log(`currentGasPrice: ${currentGasPrice}`)
	const gasPrice = ethers.utils.hexlify(parseInt(currentGasPrice));
	console.log(`gasPrice: ${gasPrice}`)

	// const gasNeeded = await contract.methods.approve(spender, value).estimateGas({gasPrice: gasPrice});
	const gasNeeded = 2815124;
	console.log(`gasNeeded: ${gasNeeded}`);


	const tx = {
		from: from,
		to: routerContract.options.address,
		value: amountETHMin,
		gasLimit: gasNeeded,
		gasPrice: gasPrice,
		data: routerContract.methods.addLiquidityETH(token, amountTokenDesired, amountTokenMin, amountETHMin, to, deadline).encodeABI(),
	}
	console.log('tx: ', tx);

	const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
	console.log('signedTx: ', signedTx);

	const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
	console.log(`Tx hash: ${receipt.transactionHash}\n`);



/*

TOKEN EBEN		0xff5254f440816a778851b21d2dfe879b7bad182d

approveToken() {
    const that = this;
    return new Promise((resolve, reject) => {
      const contract = require('@truffle/contract');
      const transferContract = contract(tokenAbi);
      transferContract.setProvider(that.web3);
      transferContract.at('0xff5254f440816a778851b21d2dfe879b7bad182d').then(function(instance) {
        console.log('we about to approve it');
        return instance.approve( 
           '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
           Web3.utils.toWei("100000000", "ether"),                     
          {
            from: that.account,
            gas: 4000000,
          });
      }).then(function(status) {
        if (status) {
          console.log('erc20 approved');
          return resolve(status);
        }
      }).catch(function(error) {
        console.log(error);
        return reject('transfer.service error');
      });
    });
  }

   createPair() {
    const that = this;
    return new Promise((resolve, reject) => {

      const contract = require('@truffle/contract');
      const transferContract = contract(UniSwapRouterAbi);
      transferContract.setProvider(that.web3);
      transferContract.at('0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D').then(function(instance) {
        console.log('we are inside the router contract');
        return instance.addLiquidityETH( 
           '0xff5254f440816a778851b21d2dfe879b7bad182d',
           10000000000,
           5000000000,
           1000000000,
           '0xaC3c34E28D0679442e550a1177a6ce472F8C4156',
           1598313600,                     
          {
            from: that.account,
            gas: 4000000,
            value: 1000000000
          });
      }).then(function(status) {
        if (status) {
          console.log('adding liquidity worked');
          return resolve(status);
        }
      }).catch(function(error) {
        console.log(error);
        return reject('transfer.service error');
      });
    });
  }


*/



/*

        // Approve and add liquidity
        const IUniswapV2Pair = artifacts.require("IUniswapV2Pair");
        const IUniswapV2Factory = artifacts.require("IUniswapV2Factory");
        const IUniswapV2Router01 = artifacts.require("IUniswapV2Router01");
        const IUniswapV2Router02 = artifacts.require("IUniswapV2Router02");

        const uniswapV2Router = await IUniswapV2Router02.at('0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'); //UniSwapV2Router02 address

        await myToken.approve('0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', //UniSwapV2Router02 address
            1000,
            {
            from: '0xD7dfaDD73e3F87227b5D8F7860A975e92A9266A1', // accounts[0] wallet 
            gas: 4000000,
        });

        const tokenPair = await IUniswapV2Pair.at('0xa6af56Dc3F2Df62CC1922F5b47C6B8Df4B0B30A8'); //token|ETH pair in constructor
        await tokenPair.approve('0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', //UniSwapV2Router02 address
            1000,
            {
            from: '0xD7dfaDD73e3F87227b5D8F7860A975e92A9266A1', // accounts[0] wallet 
            gas: 4000000,
        });
		
		await uniswapV2Router.addLiquidityETH(
            myToken.address, // token address
            1000, // token value
            1, // slippage is unavoidable
            1, // slippage is unavoidable
            '0xD7dfaDD73e3F87227b5D8F7860A975e92A9266A1', // accounts[0] wallet 
            1690886616,
            {
                from: '0xD7dfaDD73e3F87227b5D8F7860A975e92A9266A1', // accounts[0] wallet 
                value: 1 //eth value
            }
        );
*/

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

