// Approve and add liquidity
const IUniswapV2Pair = artifacts.require("IUniswapV2Pair");
const IUniswapV2Factory = artifacts.require("IUniswapV2Factory");
const IUniswapV2Router01 = artifacts.require("IUniswapV2Router01");
const IUniswapV2Router02 = artifacts.require("IUniswapV2Router02");

const uniswapV2Router = await IUniswapV2Router02.at('0xFCE3E4daDfA42104e5Fac61349D510ddDecCFE95'); //UniSwapV2Router02 address

await myToken.approve('0xFCE3E4daDfA42104e5Fac61349D510ddDecCFE95', //UniSwapV2Router02 address
    1000,
    {
    from: '0xD7dfaDD73e3F87227b5D8F7860A975e92A9266A1', // accounts[0] wallet 
    gas: 4000000,
});

const tokenPair = await IUniswapV2Pair.at('0xa6af56Dc3F2Df62CC1922F5b47C6B8Df4B0B30A8'); //token|ETH pair in constructor
await tokenPair.approve('0xFCE3E4daDfA42104e5Fac61349D510ddDecCFE95', //UniSwapV2Router02 address
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

----------------------------------------------------------------------------

async function approve(contract, tokenAddr, spender, value) {
	const tx = {
		from: 0xB79E7e395Ed0406e279cEb3838cD3c7db1D7CbfF
		to:   0x77CB87b57F54667978Eb1B199b28a0db8C8E1c0B,
		data: contract.methods.approve(
            0xFCE3E4daDfA42104e5Fac61349D510ddDecCFE95, 
            813666000000000000).encodeABI(),
	}
}

from:  0xB79E7e395Ed0406e279cEb3838cD3c7db1D7CbfF
const accountContract = new web3.eth.Contract(ERC20_ABI, from);
// console.log("accountContract: ", accountContract);
// await approve(accountContract, token, routerContract.options.address, amountTokenDesired);
