import { Contract, BigNumber, utils, providers } from 'ethers';
require('../stylesheets/app.css');
//ADDRESSES
//const congress_addr = '0x3de0c040705d50d62d1c36bde0ccbad20606515a'; //MAINNET
const congress_addr = '0xB9aD58717DcCCa67093be988c4E337b63780Ea24'; //ganache testnet
//const dai_token_addr = '0x6b175474e89094c44da98b954eedeac495271d0f'; //MAINNET
//const weth_token_addr = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'; //MAINNET WETH TOKEN ADDRESS
//const matching_market_addr = '0x39755357759ce0d7f32dc8dc45414cca409ae24e'; //MAINNET
//const startBlock = 10215507; //MAINNET
const startBlock = 0; //ganache testnet
//ABIs
const congress_abi = require('../../build/abis/Congress_abi.json');
//const matching_market_abi= require('../../build/abis/Matching_market_abi.json');
const ERC20_token_abi = require('../../build/abis/ERC20_abi.json');

let account = null;
let congress;
let dai;
//let weth;
//let matching_market;
//let members = [];
let minimum_quorum, majority_margin;

window.App = {
  start: async (_provider) => {
		//DONATE BUTTONS ONCLICK
		document.getElementById("donate_button").onclick = () => {
			document.getElementById("donate_button").className = 'hidden';
			document.getElementById("donate_div").className = 'shown';
		}
		document.getElementById("donate").onclick = () => {
			document.getElementById("donate").disabled = true;
    	let donation = BigNumber.from(10).pow(18).mul(document.getElementById("donation").value);
			switch (document.getElementById("crypto_currency").value) {
				case "ETH":
					_provider.sendTransaction({from:account, to:congress_addr, value:donation}).then(() => {
	        	console.log("ether donation initiated, value = " + donation);
					})
					break;
				case "DAI":
					//dai = web3.eth.contract(ERC20_token_abi).at(dai_token_addr);
					dai = new Contract(dai_token_addr, ERC20_token_abi, _provider);
		      dai.approveAndCall(congress_addr, donation, "0x").then(( res) => {
		        console.log("dai donation initiated, value = " + donation + "DAI");
		      })
				default:
					return;
	    }
		}
		congress = new Contract(congress_addr, congress_abi, _provider);
		congress.removeAllListeners();
		//DONATION RECEIPTS
    congress.on("LogReceivedEther", () => {
			document.getElementById("donate").disabled = false;
			App.writeBalances(congress_addr)
    })
    congress.on("LogReceivedTokens", (a,b,addr) => {
			if (addr.toLowerCase() !== dai_token_addr.toLowerCase()) return;
			document.getElementById("donate").disabled = false;
			//App.writeBalances(dai_token_addr);
    })
    congress.members(account).then((res) => {
			switch (res[0]) { //ARE YOU  A MEMBER?
				case false: //NOT A MEMBER
					return;
					break;
				case true: //MEMBERS ONLY
					const Ids = new Set();
					//weth = new ethers.Contract(weth_token_addr, ERC20_token_abi, _provider);
					//matching_market = new ethers.Contract(matching_market_addr, matching_market_abi, _provider);
					document.getElementById("forMembers").className = 'shown';
					//BALANCES STRIP
					const _balances = document.createElement("tr");
					_balances.innerHTML = "<td id='eth_bal'></td>"; //<td id='dai_bal'></td><td id='weth_bal'></td>*/";
					App.writeBalances();
					document.getElementById("balances").append(_balances);
					//SET MINIMUM_QUORUM AND MAJORITY_MARGIN
					congress.minimumQuorum().then((quorum) => minimum_quorum = quorum.toNumber());
			    congress.majorityMargin().then((margin) => majority_margin = margin.toNumber());
					//WRITE PREVIOUS PROPOSALS
					congress.queryFilter('LogProposalAdded', startBlock).then((proposals) => {
						for (let proposal of proposals) {
							let proposalID = Number(proposal.args.proposalID);
              let filter = congress.filters.LogProposalTallied(proposalID);
							congress.queryFilter(filter ,proposal.blockNumber, 'latest').then((prop_tallied) => {
								if (prop_tallied.length !== 0) return;
              	Ids.add(proposalID);
								App.write_proposal(proposalID);
							})
						}
					})
					//WATCH FOR AND WRITE NEW PROPOSAL
					congress.on('LogProposalAdded', (proposalID) => {
						let id = proposalID.toNumber()
						if (Ids.has(id)) return;
						Ids.add(id);
						App.write_proposal(id);
					})
					// WATCH FOR CHANGE OF RULES
			    congress.on('LogChangeOfRules', (min_quorum, maj_margin) => {
						minimum_quorum = min_quorum.toNumber();
						majority_margin = maj_margin.toNumber();
			    })
					//NEW PROPOSAL ONCLICK
				  document.getElementById("new_proposal").onclick = () => {
						document.getElementById("new_proposal").disabled = true;
				    let proposal = document.getElementById("proposal_options").value;
				    let transactionBytecode;
				    let beneficiary;
				    let weiAmount;
				    let jobDescription;
				    switch (proposal) {
				      case "SEND_ETH":
				        beneficiary = prompt("address beneficiary?");
								weiAmount = BigNumber.from(10).pow(18).mul(prompt("amount ether?"));
				        jobDescription = prompt("job description?");
								break;
				      case "SEND_DAI":
								weiAmount=0;
				        beneficiary = dai_token_addr; //dai token
				        jobDescription = "send_dai";
								break;
				      case "ADD_MEMBER":
								beneficiary=congress_addr; //congress
								weiAmount=0;
								jobDescription="add_member";
								break;
				      case "REMOVE_MEMBER":
								beneficiary=congress_addr; //congress
								weiAmount=0;
								jobDescription="remove_member";
								break;
				      case "NEW_RULES":
				        beneficiary=congress_addr; //congress contract
				        weiAmount=0;
				        jobDescription="change_voting_rules";
								break;
							/*case "ETH_TO_WETH":
								beneficiary=weth_token_addr; //weth contract
								weiAmount=ethers.BigNumber.from(10).pow(18).mul(prompt("amount of weth tokens to buy?"));
								jobDescription="eth_to_weth";
								break;
							case "WETH_TO_ETH":
								beneficiary=weth_token_addr; //weth contract
				        weiAmount=0;
				        jobDescription="weth_to_eth";
								break;
							case "WETH_TO_DAI":
								beneficiary=matching_market_addr; //matching market contract
								weiAmount=0;
				        jobDescription="weth_to_dai";
								break;
							case "DAI_TO_WETH":
								beneficiary=matching_market_addr; //matching market contract
								weiAmount=0;
				        jobDescription="dai_to_weth";
								break;
							case "UNLOCK_TO_SELL_DAI":
								beneficiary=dai_token_addr;
								weiAmount=0;
								jobDescription="unlock_dai";
								break;
				      case "UNLOCK_TO_SELL_WETH":
				        beneficiary=weth_token_addr;
				        weiAmount=0;
				        jobDescription="unlock_weth";
								break;*/
							default:
								return;
				    }
						congress.newProposal(beneficiary, weiAmount, jobDescription, App.get_bytecode(beneficiary, jobDescription)).then(() => {
							document.getElementById('new_proposal').disabled = 'false';
				      console.log("new proposal initiated");
				    })
				  }
			}
		})
  },
	//END OF App.start()

	//WATCH FOR PROPOSALTALLIED
	watch_for_prop_tallied: (proposalID) => {
		let filter = congress.filters.LogProposalTallied(proposalID);
		congress.on(filter, (id,res,num_votes,active) => {
			if (!active) return;
			App.writeBalances();
      document.getElementById(proposalID).getElementsByTagName("td")[6].innerHTML = "PROPOSAL EXECUTED!";
    });
	},
	//WATCH FOR VOTE
	watch_for_vote: (proposalID) => {
		let filter = congress.filters.LogVoted(proposalID);
	  congress.on(filter, (id, vote, voter) => {
	    let proposal_elements = document.getElementById(proposalID).getElementsByTagName("td");
	    congress.proposals(id).then((proposal) => {
				proposal_elements[4].innerHTML = proposal[6]; //number of votes
				if (proposal[6] >= minimum_quorum) proposal_elements[4].style.color = "green";
				proposal_elements[5].innerHTML = proposal[7];  //cumulative vote
				if (proposal[7] >= majority_margin)  proposal_elements[5].style.color = "green";
		  	if (proposal[6] >= minimum_quorum && proposal[7] >= majority_margin && Date.now()/1e3 > proposal[3]) {
		  	  proposal_elements[6].innerHTML = "<button id='" + proposalID + "ep'>EXECUTE</button>";
					App.set_up_click_event(id, "execute", proposal);
				} else if (voter.toLowerCase() === account.toLowerCase()) {
					proposal_elements[6].innerHTML = "VOTED!";
				}
	  	})
		})
	},
	//ADD CLICK EVENT
	set_up_click_event: (id, action, proposal) => {
		switch (action) {
			case "vote":
			  document.getElementById(id + "cp").onclick = () => {
	        congress.checkProposalCode(id, proposal[0], proposal[1], App.get_bytecode(proposal[0], proposal[2])).then((code_checks) => {
	          if (code_checks) { //write YES/NO buttons if bytecode checks true
	            document.getElementById(id).getElementsByTagName("td")[6].innerHTML = "<button id='" + id + "true'>YES</button><button id='" + id + "false'>NO</button>";
							for (const vote of ["true", "false"]) {
					      document.getElementById(id + vote).onclick = () => {
				          App.watch_for_vote(id);
					        document.getElementById(id + "true").disabled = true;
					        document.getElementById(id + "false").disabled = true;
							    congress.vote(id, vote, "").then((res) => {
										console.log("voted " + res);
									})
								}
							}
	          } else alert("proposal check returned false");
	        })
				}
				break;
			case "execute":
	      document.getElementById(id + "ep").onclick = () => {
					App.watch_for_prop_tallied(id)
	        document.getElementById(id + "ep").disabled = true;
	        congress.executeProposal(id, App.get_bytecode(proposal[0], proposal[2])).then((res) => {
	        	console.log(res);
					})
	      }
		}
	},
	//WRITE BALANCES
	writeBalances: (addr) => {
		switch (addr) {
			/*case congress_addr:
				_provider.getBalance(congress_addr).then((eth_balance) => document.getElementById("eth_bal").innerHTML = "ETH: " + eth_balance/1e18); //ethers.BigNumber.from(10).pow(18).toNumber().toFixed(2);
        break;
			case dai_token_addr:
			  _provider.getBalance(congress_addr).then((eth_bal) => document.getElementById("eth_bal").innerHTML = "ETH: " + (eth_bal/1e18).toFixed(2));
				dai.balanceOf(congress_addr).then((dai_bal) => {
					dai.allowance(congress_addr, matching_market_addr).then((allow) => {
						document.getElementById("dai_bal").innerHTML = "DAI: " + (dai_bal/1e18).toFixed(0); //+ " (" + (allow/1e18).toFixed(0) + ")";
          })
        })
		    break;
			/*case weth_token_addr:
			  _provider.getBalance(congress_addr).then((eth_bal) => document.getElementById("eth_bal").innerHTML = "ETH: " + (eth_bal/1e18).toFixed(2));
				weth.balanceOf(congress_addr).then((weth_bal) => {
					weth.allowance(congress_addr, matching_market_addr).then((allow) => {
						document.getElementById("weth_bal").innerHTML = "WETH: " + (weth_bal/1e18).toFixed(2) + " (" + (allow/1e18).toFixed(2) + ")";
					})
        })
				break;*/
      default:
				ethereum.request({method:"eth_getBalance", params:[congress_addr]}).then((bal) => {
					document.getElementById("eth_bal").innerHTML = "ETH: " + (bal/1e18).toFixed(2);
				/*dai = new Contract(dai_token_addr, ERC20_token_abi, _provider);
				dai.balanceOf(congress_addr).then((dai_bal) => {
					dai.allowance(congress_addr, matching_market_addr).then((allow) => {
						document.getElementById("dai_bal").innerHTML = "DAI: " + (dai_bal/1e18).toFixed(0); // + " (" + (allow/1e18).toFixed(0) + ")";
					})
				})
				weth.balanceOf(congress_addr).then((weth_bal) => {
					weth.allowance.call(congress_addr, matching_market_addr).then((allow) => {
						document.getElementById("weth_bal").innerHTML = "WETH: " + (weth_bal/1e18).toFixed(2) + " (" + (allow/1e18).toFixed(2) + ")";
					})*/
        })
		}
	},
  write_proposal: (proposalID) => {
    congress.proposals(proposalID).then((proposal) => {
      if (proposal[4]) return;
		  let _proposal = document.createElement("tr");
		  _proposal.innerHTML = '<td class="head" align="center"></td><td></td><td align="center"></td><td></td><td align="center"></td><td align="center"></td><td class="foot" align="center"></td>';
		  _proposal.id = proposalID;
		  let proposal_elements = _proposal.getElementsByTagName('td');
		  //WRITE TABLE ROW (PROPOSAL)
	    proposal_elements[0].innerHTML = _proposal.id;
	    proposal_elements[1].innerHTML = proposal[0]; //recipient
	    proposal_elements[2].innerHTML = proposal[1]/1e18; //amount
	    proposal_elements[3].innerHTML = proposal[2]; //description
	    proposal_elements[4].innerHTML = Number(proposal[6]); //number votes
	    proposal_elements[5].innerHTML = Number(proposal[7]); //progressive vote
			//APPEND THE PROPOSAL; COLOUR COUNTS
		  document.getElementById("activeProposals").append(_proposal);
		  (Number(proposal[6]) >= minimum_quorum) ? proposal_elements[4].style.color="green" : proposal_elements[4].style.color="red";
		  (Number(proposal[7]) >= majority_margin) ? proposal_elements[5].style.color="green" : proposal_elements[5].style.color="red";
			//IF NEW PROPOSAL WRITE VOTE BUTTON
			if (Number(proposal[6]) === 0) { //no votes
		    proposal_elements[6].innerHTML = "<button id='" + proposalID + "cp'>VOTE</button>";
				App.set_up_click_event(proposalID, "vote", proposal);
			}
			//IF CONDITIONS ALLOW EXECUTION write execute button
			else if (Number(proposal[6]) >= minimum_quorum && Number(proposal[7]) >= majority_margin && Date.now() > proposal[3]*1e3) {
	      proposal_elements[6].innerHTML = "<button id='" + proposalID + "ep'>EXECUTE</button>";
				App.set_up_click_event(proposalID, "execute", proposal);
				//App.watch_for_prop_tallied(proposalID);
			} else { //SEE IF YOU VOTED
				let filter = congress.filters.LogVoted(proposalID, null, account);
				congress.queryFilter(filter, proposal.blockNumber).then((vote) => {
			    //if (err) return err;
			    if (vote.length === 0) { //you haven't voted so write vote buttons
		        proposal_elements[6].innerHTML = "<button id='" + proposalID + "cp'>VOTE</button>";
    				App.set_up_click_event(proposalID, "vote", proposal);
		  		} else 	proposal_elements[6].innerHTML = "VOTED!";
				})
			}
		})
	},
	//GET BYTECODE
  get_bytecode: (contract_addr, job_description) => {
    switch(contract_addr) {
			/*case weth_token_addr:
				switch(job_description) {
					case  "weth_to_eth":
						return weth.withdraw.getData(prompt("amount of eth to withraw?")*1e18);
						//return iface.encodeFunctionData("
						break;
					case "eth_to_weth":
						return weth.deposit.getData();
						break;
					case "unlock_weth":
							return weth.approve.getData(matching_market_addr, prompt("amount weth to unlock for matching market?")*1e18);
					default: console.log(job_description);
				};
				break;
			case matching_market_addr:
				matching_market = web3.eth.contract(matching_market_abi).at(matching_market_addr);
        switch(job_description) {
					case "dai_to_weth":
						return matching_market.sellAllAmount.getData(dai_token_addr, prompt("amount $dai to convert to weth?")*1e18, weth_token_addr, 5e15);
						break;
					case "weth_to_dai":
						return matching_market.sellAllAmount.getData(weth_token_addr, Number(prompt("amount weth to convert to dai?"))*1e18, dai_token_addr, 5e15);
						break;
					default: console.log(job_description);
				};
				break;
      case dai_token_addr:
      	switch(job_description) {
					case "send_dai":
      			return dai.transfer.getData(prompt("dai recipient?"), prompt("amount $dai?")*1e18);
      			break;
					case "unlock_dai":
						return dai.approve.getData(matching_market_addr, prompt("amount $dai for instant trade?")*1e18);
						break;
					default: console.log(job_description);
				};
				break;*/
      case congress_addr:
				let congr_iface = new utils.Interface(congress_abi);
        switch(job_description) {
          case "change_voting_rules":
            //return congress.changeVotingRules.getData(prompt("new minimum quorum?"), prompt("new minutes for debate?"), prompt("new majority margin?"));
						return congr_iface.encodeFunctionData("changeVotingRules", [prompt("new minimum quorum?"), prompt("new minutes for debate?"), prompt("new majority margin?")]);
	    			break;
          case "add_member":
            // return congress.addMember.getData(prompt("new member address?"), prompt("name of new member?"));
						return congr_iface.encodeFunctionData("addMember", [prompt("new member address?"), prompt("name of new member?")]);
	    			break;
          case "remove_member":
            //return congress.removeMember.getData(prompt("address of member to be removed?"));
						return congr_iface.encodeFunctionData("removeMember", [prompt("address of member to be removed?")]);
        };
				break;
      default:
        return "0x";
    }
  },
},
window.addEventListener('load', () => {
	const provider =  new providers.Web3Provider(window.ethereum);
	const signer = provider.getSigner();
	document.getElementById('connect_button').onclick = () => {
		document.getElementById('connect_button').className = 'hidden';
		ethereum.request({method:'eth_requestAccounts'}).then((accounts) => {
			// For now, 'eth_accounts' will continue to always return an array
		  if (accounts.length == 0) {
		    // MetaMask is locked or the user has not connected any accounts
		    console.log('Please connect to MetaMask.');
		  } else if (accounts[0] !== account) {
		    account = accounts[0];
			  App.start(signer); // Initialize your app
			} else console.log('Please install MetaMask!');
		}).catch((err) => {
		  console.error(err);
		});
		//ethereum.on('accountsChanged', (accounts) => {if (accounts[0] !== account) account = accounts[0]});
	}
})
