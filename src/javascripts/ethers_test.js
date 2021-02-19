var ethers = require('ethers')
var fs = require('fs')
Provider = new ethers.providers.JsonRpcProvider();
//metamaskProvider = new ethers.providers.Web3Provider(ethereum);
signer = Provider.getSigner();
donation = ethers.BigNumber.from(10).pow(19).mul(3)
signer.sendTransaction({to:'0x272413576b6e57259edB189fa9ac9E2550b07580', value:donation})
dai_token_data = '0x608060405234801561001057600080fd5b5061050b806100206000396000f3fe608060405234801561001057600080fd5b506004361061009e5760003560e01c806354fd4d501161006657806354fd4d50146101d057806370a08231146101d85780637ecebe00146101fe57806395d89b4114610224578063a9059cbb1461022c5761009e565b806306fdde03146100a357806318160ddd1461012057806323b872dd1461013a578063313ce5671461018457806340c10f19146101a2575b600080fd5b6100ab610258565b6040805160208082528351818301528351919283929083019185019080838360005b838110156100e55781810151838201526020016100cd565b50505050905090810190601f1680156101125780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b610128610282565b60408051918252519081900360200190f35b6101706004803603606081101561015057600080fd5b506001600160a01b03813581169160208101359091169060400135610288565b604080519115158252519081900360200190f35b61018c6103a8565b6040805160ff9092168252519081900360200190f35b6101ce600480360360408110156101b857600080fd5b506001600160a01b0381351690602001356103ad565b005b6100ab610440565b610128600480360360208110156101ee57600080fd5b50356001600160a01b031661045d565b6101286004803603602081101561021457600080fd5b50356001600160a01b031661046f565b6100ab610481565b6101706004803603604081101561024257600080fd5b506001600160a01b0381351690602001356104a0565b6040518060400160405280600e81526020016d2230b49029ba30b13632b1b7b4b760911b81525081565b60005481565b6001600160a01b0383166000908152600160205260408120548211156102f5576040805162461bcd60e51b815260206004820152601860248201527f4461692f696e73756666696369656e742d62616c616e63650000000000000000604482015290519081900360640190fd5b6001600160a01b03841660009081526001602052604090205461031890836104b6565b6001600160a01b03808616600090815260016020526040808220939093559085168152205461034790836104c6565b6001600160a01b0380851660008181526001602090815260409182902094909455805186815290519193928816927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef92918290030190a35060019392505050565b601281565b6001600160a01b0382166000908152600160205260409020546103d090826104c6565b6001600160a01b038316600090815260016020526040812091909155546103f790826104c6565b60009081556040805183815290516001600160a01b03851692917fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef919081900360200190a35050565b604051806040016040528060018152602001603160f81b81525081565b60016020526000908152604090205481565b60026020526000908152604090205481565b6040518060400160405280600381526020016244414960e81b81525081565b60006104ad338484610288565b90505b92915050565b808203828111156104b057600080fd5b808201828110156104b057600080fdfea265627a7a723158206ce2f106791478f9f505c88df54cd296e8c07e73a9e3775e7707b25bfcdf2d8164736f6c634300050c0032'
dai_token_abi = fs.readFileSync('./build/abis/ERC20_abi_test.json', 'utf8');
dai_token_factory = new ethers.ContractFactory(dai_token_abi, dai_token_data, signer);
dai_token_factory.deploy().then((dai) => {
	dai_token = new ethers.Contract(dai.address, dai_token_abi, signer)
	console.log("dai token address: " + dai_token.address)
	dai_token.mint('0x5783B4aF6714e83b613B7A9a63e5a57EBF0f5326', donation).then((res) => {
		dai_token.balanceOf('0x5783B4aF6714e83b613B7A9a63e5a57EBF0f5326').then((bal) => console.log("dai balance: " + bal))
	})
})
congress_data = '0x608060405260405160608062001aa0833981018060405260608110156200002557600080fd5b508051602082015160409092015160008054600160a060020a031916331790559091906200005e838383640100000000620000bc810204565b60005460408051808201909152601281527f4b656974682056616e20537465656e77796b00000000000000000000000000006020820152620000b391600160a060020a03169064010000000062000128810204565b505050620002ad565b600054600160a060020a03163314620000d457600080fd5b600183905560028290556003819055604080518481526020810184905280820183905290517f0f265c85e92897f0a14e35afcbfcd67d0e3d9260ce80c5295c8284cf2cab5ec39181900360600190a1505050565b600054600160a060020a031633146200014057600080fd5b600160a060020a03821660009081526006602052604090205460ff16156200016757600080fd5b60408051606081018252600180825260208083018581524284860152600160a060020a038716600090815260068352949094208351815460ff191690151517815593518051939493620001c293850192919091019062000208565b5060409182015160029091015551600190600160a060020a038416907f6517f175230e960868c4eb1703331926f5b97569c338fad430493a0dc8896a4f90600090a35050565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f106200024b57805160ff19168380011785556200027b565b828001600101855582156200027b579182015b828111156200027b5782518255916020019190600101906200025e565b50620002899291506200028d565b5090565b620002aa91905b8082111562000289576000815560010162000294565b90565b6117e380620002bd6000396000f3fe6080604052600436106100e55763ffffffff7c0100000000000000000000000000000000000000000000000000000000600035041663013cf08b811461012157806308ae4b0c146102155780630b1ca49a146102cf578063237e949214610304578063400e3949146103b157806369bd3436146103d85780638160f0b5146103ed5780638da5cb5b146104025780638f4ffcb114610433578063aa02a90f14610505578063b1050da51461051a578063bcca1fd314610669578063c127c2471461069f578063d3c0715b14610762578063eceb294514610823578063f2fde38b14610906575b6040805133815234602082015281517f3317af6e3247959c45cb6051f9153437a9072683e21eda1f9b52c5bcec0e89c2929181900390910190a1005b34801561012d57600080fd5b5061014b6004803603602081101561014457600080fd5b5035610939565b604051808a600160a060020a0316600160a060020a03168152602001898152602001806020018881526020018715151515815260200186151515158152602001858152602001848152602001838152602001828103825289818151815260200191508051906020019080838360005b838110156101d25781810151838201526020016101ba565b50505050905090810190601f1680156101ff5780820380516001836020036101000a031916815260200191505b509a505050505050505050505060405180910390f35b34801561022157600080fd5b506102486004803603602081101561023857600080fd5b5035600160a060020a0316610a30565b604080518415158152908101829052606060208083018281528551928401929092528451608084019186019080838360005b8381101561029257818101518382015260200161027a565b50505050905090810190601f1680156102bf5780820380516001836020036101000a031916815260200191505b5094505050505060405180910390f35b3480156102db57600080fd5b50610302600480360360208110156102f257600080fd5b5035600160a060020a0316610ae4565b005b6103026004803603604081101561031a57600080fd5b8135919081019060408101602082013564010000000081111561033c57600080fd5b82018360208201111561034e57600080fd5b8035906020019184600183028401116401000000008311171561037057600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250929550610b72945050505050565b3480156103bd57600080fd5b506103c6610dd7565b60408051918252519081900360200190f35b3480156103e457600080fd5b506103c6610ddd565b3480156103f957600080fd5b506103c6610de3565b34801561040e57600080fd5b50610417610de9565b60408051600160a060020a039092168252519081900360200190f35b34801561043f57600080fd5b506103026004803603608081101561045657600080fd5b600160a060020a03823581169260208101359260408201359092169181019060808101606082013564010000000081111561049057600080fd5b8201836020820111156104a257600080fd5b803590602001918460018302840111640100000000831117156104c457600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250929550610df8945050505050565b34801561051157600080fd5b506103c6610f7d565b34801561052657600080fd5b506103c66004803603608081101561053d57600080fd5b600160a060020a038235169160208101359181019060608101604082013564010000000081111561056d57600080fd5b82018360208201111561057f57600080fd5b803590602001918460018302840111640100000000831117156105a157600080fd5b91908080601f01602080910402602001604051908101604052809392919081815260200183838082843760009201919091525092959493602081019350359150506401000000008111156105f457600080fd5b82018360208201111561060657600080fd5b8035906020019184600183028401116401000000008311171561062857600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250929550610f83945050505050565b34801561067557600080fd5b506103026004803603606081101561068c57600080fd5b50803590602081013590604001356111fb565b3480156106ab57600080fd5b50610302600480360360408110156106c257600080fd5b600160a060020a0382351691908101906040810160208201356401000000008111156106ed57600080fd5b8201836020820111156106ff57600080fd5b8035906020019184600183028401116401000000008311171561072157600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250929550611266945050505050565b34801561076e57600080fd5b506103c66004803603606081101561078557600080fd5b81359160208101351515918101906060810160408201356401000000008111156107ae57600080fd5b8201836020820111156107c057600080fd5b803590602001918460018302840111640100000000831117156107e257600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250929550611342945050505050565b34801561082f57600080fd5b506108f26004803603608081101561084657600080fd5b813591600160a060020a03602082013516916040820135919081019060808101606082013564010000000081111561087d57600080fd5b82018360208201111561088f57600080fd5b803590602001918460018302840111640100000000831117156108b157600080fd5b91908080601f0160208091040260200160405190810160405280939291908181526020018383808284376000920191909152509295506114ad945050505050565b604080519115158252519081900360200190f35b34801561091257600080fd5b506103026004803603602081101561092957600080fd5b5035600160a060020a031661157f565b600480548290811061094757fe5b6000918252602091829020600a91909102018054600180830154600280850180546040805161010096831615969096026000190190911692909204601f8101889004880285018801909252818452600160a060020a03909416965090949192918301828280156109f85780601f106109cd576101008083540402835291602001916109f8565b820191906000526020600020905b8154815290600101906020018083116109db57829003601f168201915b50505060038401546004850154600586015460068701546007909701549596929560ff80841696506101009093049092169350919089565b6006602090815260009182526040918290208054600180830180548651600261010094831615949094026000190190911692909204601f810186900486028301860190965285825260ff909216949293909290830182828015610ad45780601f10610aa957610100808354040283529160200191610ad4565b820191906000526020600020905b815481529060010190602001808311610ab757829003601f168201915b5050505050908060020154905083565b600054600160a060020a03163314610afb57600080fd5b600160a060020a03811660009081526006602052604090205460ff161515600114610b2557600080fd5b600160a060020a038116600081815260066020526040808220805460ff19169055519091907f6517f175230e960868c4eb1703331926f5b97569c338fad430493a0dc8896a4f908390a350565b6000600483815481101515610b8357fe5b90600052602060002090600a02019050806003015442118015610bab5750600481015460ff16155b8015610c595750805460018201546040516c01000000000000000000000000600160a060020a0390931692830260208083019182526034830184905286518793605401918401908083835b60208310610c155780518252601f199092019160209182019101610bf6565b6001836020036101000a0380198251168184511680821785525050505050509050019350505050604051602081830303815290604052805190602001208160070154145b8015610c6b5750600154816005015410155b1515610c7657600080fd5b600354600682015412610d685760048101805460ff191660019081179091558154908201546040518451600093600160a060020a031692918691819060208401908083835b60208310610cda5780518252601f199092019160209182019101610cbb565b6001836020036101000a03801982511681845116808217855250505050505090500191505060006040518083038185875af1925050503d8060008114610d3c576040519150601f19603f3d011682016040523d82523d6000602084013e610d41565b606091505b50509050801515610d5157600080fd5b5060048101805461ff001916610100179055610d76565b60048101805461ff00191690555b8060040160019054906101000a900460ff161515837fae062a869cece3620d8e1d6bdade26098d6d636f1e4b673974d8628c7746d2ea83600601548460050154604051808381526020018281526020019250505060405180910390a3505050565b60055481565b60025481565b60015481565b600054600160a060020a031681565b604080517f23b872dd000000000000000000000000000000000000000000000000000000008152600160a060020a03868116600483015230602483015260448201869052915184928316916323b872dd9160648083019260209291908290030181600087803b158015610e6a57600080fd5b505af1158015610e7e573d6000803e3d6000fd5b505050506040513d6020811015610e9457600080fd5b50511515610ea157600080fd5b7f97b01e9ec0ff08aa780226dc673f6ab34661565193002bbd6bd066e7ec01beec858585856040518085600160a060020a0316600160a060020a0316815260200184815260200183600160a060020a0316600160a060020a0316815260200180602001828103825283818151815260200191508051906020019080838360005b83811015610f39578181015183820152602001610f21565b50505050905090810190601f168015610f665780820380516001836020036101000a031916815260200191505b509550505050505060405180910390a15050505050565b60035481565b3360009081526006602052604081205460ff161515600114610fa457600080fd5b6004805490610fb690600183016115c5565b90506000600482815481101515610fc957fe5b6000918252602091829020600a9190910201805473ffffffffffffffffffffffffffffffffffffffff1916600160a060020a03891617815560018101879055855190925061101f916002840191908701906115f6565b508585846040516020018084600160a060020a0316600160a060020a03166c0100000000000000000000000002815260140183815260200182805190602001908083835b602083106110825780518252601f199092019160209182019101611063565b6001836020036101000a0380198251168184511680821785525050505050509050019350505050604051602081830303815290604052805190602001208160070181905550600254603c024201816003018190555060008160040160006101000a81548160ff02191690831515021790555060008160040160016101000a81548160ff021916908315150217905550600081600501819055507f219a63a3e4f718acfd2876fcab493d4ee169abbfa76f61bebfae7e34da9b2038828787876004805490506040518086815260200185600160a060020a0316600160a060020a0316815260200184815260200180602001838152602001828103825284818151815260200191508051906020019080838360005b838110156111ad578181015183820152602001611195565b50505050905090810190601f1680156111da5780820380516001836020036101000a031916815260200191505b50965050505050505060405180910390a15060018101600555949350505050565b600054600160a060020a0316331461121257600080fd5b600183905560028290556003819055604080518481526020810184905280820183905290517f0f265c85e92897f0a14e35afcbfcd67d0e3d9260ce80c5295c8284cf2cab5ec39181900360600190a1505050565b600054600160a060020a0316331461127d57600080fd5b600160a060020a03821660009081526006602052604090205460ff16156112a357600080fd5b60408051606081018252600180825260208083018581524284860152600160a060020a038716600090815260068352949094208351815460ff1916901515178155935180519394936112fc9385019291909101906115f6565b5060409182015160029091015551600190600160a060020a038416907f6517f175230e960868c4eb1703331926f5b97569c338fad430493a0dc8896a4f90600090a35050565b3360009081526006602052604081205460ff16151560011461136357600080fd5b600060048581548110151561137457fe5b600091825260208083203384526009600a90930201918201905260409091205490915060ff16156113a457600080fd5b3360009081526009820160205260409020805460ff19166001908117909155600582018054909101905583156113e45760068101805460010190556113f1565b6006810180546000190190555b33600160a060020a0316857f1545c9065af17d2367991ceb3b7e1986c07a87fdb19be4dba07a03a0f74a19fe8686604051808315151515815260200180602001828103825283818151815260200191508051906020019080838360005b8381101561146657818101518382015260200161144e565b50505050905090810190601f1680156114935780820380516001836020036101000a031916815260200191505b50935050505060405180910390a360050154949350505050565b6000806004868154811015156114bf57fe5b90600052602060002090600a020190508484846040516020018084600160a060020a0316600160a060020a03166c0100000000000000000000000002815260140183815260200182805190602001908083835b602083106115315780518252601f199092019160209182019101611512565b6001836020036101000a038019825116818451168082178552505050505050905001935050505060405160208183030381529060405280519060200120816007015414915050949350505050565b600054600160a060020a0316331461159657600080fd5b6000805473ffffffffffffffffffffffffffffffffffffffff1916600160a060020a0392909216919091179055565b8154818355818111156115f157600a0281600a0283600052602060002091820191016115f19190611674565b505050565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f1061163757805160ff1916838001178555611664565b82800160010185558215611664579182015b82811115611664578251825591602001919060010190611649565b506116709291506116f8565b5090565b6116f591905b8082111561167057805473ffffffffffffffffffffffffffffffffffffffff191681556000600182018190556116b36002830182611712565b60006003830181905560048301805461ffff191690556005830181905560068301819055600783018190556116ec906008840190611759565b50600a0161167a565b90565b6116f591905b8082111561167057600081556001016116fe565b50805460018160011615610100020316600290046000825580601f106117385750611756565b601f01602090049060005260206000209081019061175691906116f8565b50565b508054600082556002029060005260206000209081019061175691906116f591905b8082111561167057805474ffffffffffffffffffffffffffffffffffffffffff1916815560006117ae6001830182611712565b5060020161177b56fea165627a7a7230582065e54dac45c4c72786a6086be2be1d14b164a028836ec9092fb8ef4ea3ead9e30029'
congress_abi = fs.readFileSync('./build/abis/Congress_abi.json', 'utf8')
congress_factory = new ethers.ContractFactory(congress_abi, congress_data, signer)
congress_factory.deploy(2,1,2).then((congress) => {
	//congress_addr = '0x3de0c040705d50d62d1c36bde0ccbad20606515a'
	shelterdao = new ethers.Contract(congress.address, congress_abi, signer)
	//shelterdao = new ethers.Contract(congress_addr, abi, gethProvider)
	shelterdao.owner().then((owner) => console.log("owner: " + owner));
	console.log("shelterdao_addr: " + shelterdao.address)
	shelterdao.addMember('0x6aD31326804482229B356D892e8AD4ae1ab48cbF', 'backup').then(() =>  {
		shelterdao.addMember('0xD1ceA4AB1cDbE7ACad0C93f2Ce8805D468b0388e', 'member3').then(() => {
			shelterdao.addMember('0x272413576b6e57259edB189fa9ac9E2550b07580', 'member4').then(() => {
				shelterdao.transferOwnership(shelterdao.address).then(() => {
					shelterdao.owner().then((newowner) => console.log("newowner: " + newowner));
				})
			})
		})
	})
	signer.sendTransaction({to:shelterdao.address, value:donation}).then((res) => {
		console.log("donation received");
	})
})

