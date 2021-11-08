require('dotenv').config()//for importing parameters
const {sendMultipleTokens} = require('./lib');
const Web3 = require('web3')

const data = {
//   '0x8f31dFbb4fBc9eEdE8A41f1B7bB94C34634fA27D':	750329.74
// , '0x6CdDe7DD0ACc56caBfc2315791016f7c334d72c3':	440891.16
// , '0xAeE0d73765a3C849403285641ac33Be284a05287':	272674.98
// , '0x88Cbd6227F3B33EDCa69aee5cA7527Fa4B12Ef49':	269980.45
// , '0xb4450e071ab199C88A942fd682b9273d8dD0816E':	232634.18
// , '0x7FA5b07c22ef129c3dCe63801346aE02f095bB6b':	124450.97
// , '0xfe4F1c80028e110185b551Cf89D5f19e1e7F65FD':	116515.56
  '0x87Af45E8B65De04B736460EE668ad691136305E1':	105877.65

//   '0x8bBBCE8fb49114508855de5f3D15fF791c8CD400':	79185.27
// , '0xb7B50A24C81b7970A9455264cE02329DdB4148E8':	71612.65
// , '0x1c5C802140f83c738f70AEfaE52a736c4F72ccD5':	30135.26
// , '0x168A719B56Ae8A14F285d3B7A43A407Feef53FcF':	28147.83
// , '0x0e177a4775091e31d26F3c1e098Cfcfe22e0DE90':	21402.44
// , '0x77C55F90014f99B4b424C4dd3240A4f105B11B14':	16929.00
// , '0xe5cfF2e9A90E243d93BE83c65323dBEC4387991a':	16649.52
// , '0xE241004CCb4525c210E4C8347a464B1Cff87596C':	13272.44
// , '0x96F5B267Bbe5e957389461d5e610EC2bca658Faa':	11655.28
// , '0x1800D4599E9368aCFB6A2EF13FCBdE240EE1e2C7':	11102.86

	// '0xF24BF38435FF7152C7210617fAA6d706E8e58678':	9270.41
	// , '0x8EEcC8279F6BF4eDEC9A01855c38AEd7C583592e':	5791.28
	// , '0xB4495E5c2e13d15a76BCA9870C850D28dCBae072':	3777.43
	// , '0x6Ba7d64ddCab0645755F4740A53d6097dD7FAb51':	3468.51
	// , '0xf4b6cDeb03D058A47df728baA920671c14A2D3C0':	3109.88
	// , '0xff3dAE5A61F57498F98261574A19e334A55bD48a':	2434.84
	// , '0x1929568b336F715B89AabF8695F3586f9b0880af':	1057.46
	// , '0x0608037fd563fA0d159adb934FFc9035dF56FB88':	666.71
	// , '0x5c933CA68D583F688B978822E0eF3eD66a04ec0c':	661.94
	// , '0x9C53C096d9C2F533df8F079469fB88155db363fe':	506.48
	// , '0x281839415FE7095003302103db74b26cF38f8808':	473.43
	// , '0xD258A93F89e922CD3e2AcC53604d5B95456dC50b':	433.87
	// , '0x5f7D2cF6A2363490fbC86aFC914288BaB127C13d':	276.88
	// , '0xF1b5a6505c1f4A4337F4efb58e9012d4F36852c8':	10.63
};

// const data = {
// 	'0xBC12F56a406A10dEa7DC3855B3e9F15E8451f359':	56651.837
// };



const privateKey = process.env.PRIVATE_KEY
const token = process.env.TOKEN


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
	const rs = await sendMultipleTokens(web3, token, data, opts);
	// console.log(rs);

	for (let i = 0; i < rs.length; ++i) {
		const e = rs[i];
		console.log(e.to, e.txid);
	}
	// for (const e in rs) {
	// 	console.log(e.to, e.txid);
	// }
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

