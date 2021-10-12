require('dotenv').config()//for importing parameters
const {sendMultipleTokens} = require('./lib');
const Web3 = require('web3')

// const data = {
// 	'0x8f31dFbb4fBc9eEdE8A41f1B7bB94C34634fA27D':	556883.0360
// 	,'0x6CdDe7DD0ACc56caBfc2315791016f7c334d72c3':	401332.0357
// 	,'0x88Cbd6227F3B33EDCa69aee5cA7527Fa4B12Ef49':	220090.1388
// 	,'0xAeE0d73765a3C849403285641ac33Be284a05287':	181050.6049
// 	,'0xb4450e071ab199C88A942fd682b9273d8dD0816E':	152518.9159
// 	,'0x7FA5b07c22ef129c3dCe63801346aE02f095bB6b':	93656.0640
// 	,'0xb7B50A24C81b7970A9455264cE02329DdB4148E8':	84524.9812
// 	,'0xfe4F1c80028e110185b551Cf89D5f19e1e7F65FD':	83754.9266
// 	,'0x336d041c8CE0418583B1503da2554c525169E586':	73065.3418

// 	,'0x87Af45E8B65De04B736460EE668ad691136305E1':	66982.2919
// 	,'0x8bBBCE8fb49114508855de5f3D15fF791c8CD400':	62801.0308
// 	,'0x71804ee220c092Beb1217779e49bC1acAfDf46E9':	53659.0132
// 	,'0xDb771A0fef388Ae16e2aD356f8aDA72Ec2edD7b8':	53002.8834
// 	,'0xe4B5D6AF4c3157531d5857338972fbcEABa5C4e7':	43678.4668
// 	,'0xC0f6cDEb601538B41785cc4Fd2AC1c438F80584F':	36740.7606
// 	,'0x168A719B56Ae8A14F285d3B7A43A407Feef53FcF':	33223.1156
// 	,'0x1a9b7a1bB33B046D9b61Fba4EeCC2Bc0f13956C7':	28360.9405
// 	,'0xddbCeD904FBE12Aab9C881e1b0ebc1584570593F':	21578.1142
// 	,'0x1c5C802140f83c738f70AEfaE52a736c4F72ccD5':	18930.7251

// 	,'0x0e177a4775091e31d26F3c1e098Cfcfe22e0DE90':	14584.6997
// 	,'0x77C55F90014f99B4b424C4dd3240A4f105B11B14':	11153.0285
// 	,'0x0E8829F8210CD119dDDECd6522f03239B8730430':	10231.7649
// 	,'0x96F5B267Bbe5e957389461d5e610EC2bca658Faa':	7577.6763
// 	,'0xF24BF38435FF7152C7210617fAA6d706E8e58678':	6835.4944

// 	,'0x8EEcC8279F6BF4eDEC9A01855c38AEd7C583592e':	6835.4944
// 	,'0xf4b6cDeb03D058A47df728baA920671c14A2D3C0':	3184.4561
// 	,'0xB4495E5c2e13d15a76BCA9870C850D28dCBae072':	2901.6600
// 	,'0x6Ba7d64ddCab0645755F4740A53d6097dD7FAb51':	2331.0584
// 	,'0xff3dAE5A61F57498F98261574A19e334A55bD48a':	1531.3221

// 	,'0x7F1ecf25b2ae2A9F29685EBC44c7E15E0ae6E616':	1085.4863
// 	,'0x1929568b336F715B89AabF8695F3586f9b0880af':	693.4613
// 	,'0x0608037fd563fA0d159adb934FFc9035dF56FB88':	689.8786
// 	,'0x4ed7C114FDbb1F54FBd9CA465833510E590794B9':	681.3834
// 	,'0xD258A93F89e922CD3e2AcC53604d5B95456dC50b':	482.8417

// 	,'0x5c933CA68D583F688B978822E0eF3eD66a04ec0c':	449.6366
// 	,'0x9C53C096d9C2F533df8F079469fB88155db363fe':	389.0543
// 	,'0x5f7D2cF6A2363490fbC86aFC914288BaB127C13d':	184.6310
// 	,'0xE241004CCb4525c210E4C8347a464B1Cff87596C':	137.0948
// 	,'0x78af1ebC10047D72BA5063131867D5d6d045f45F':	43.6689
// };

// const data = {
// 	'0xBC12F56a406A10dEa7DC3855B3e9F15E8451f359':	56651.837
// };


const data = {
	'0x8f31dFbb4fBc9eEdE8A41f1B7bB94C34634fA27D':	556883.0360
	,'0x6CdDe7DD0ACc56caBfc2315791016f7c334d72c3':	401332.0357
	,'0x88Cbd6227F3B33EDCa69aee5cA7527Fa4B12Ef49':	220090.1388
	,'0xAeE0d73765a3C849403285641ac33Be284a05287':	181050.6049
	,'0xb4450e071ab199C88A942fd682b9273d8dD0816E':	152518.9159
	,'0x7FA5b07c22ef129c3dCe63801346aE02f095bB6b':	93656.0640
	,'0xb7B50A24C81b7970A9455264cE02329DdB4148E8':	84524.9812
	,'0xfe4F1c80028e110185b551Cf89D5f19e1e7F65FD':	83754.9266
	,'0x336d041c8CE0418583B1503da2554c525169E586':	73065.3418
};

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

