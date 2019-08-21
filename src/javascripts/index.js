require('../stylesheets/app.css');
//import { default as Web3} from 'web3';
//const congress_addr = '0x3de0c040705d50d62d1c36bde0ccbad20606515a'; //MAINNET
const congress_addr = '0xac4364768626124d1aa0fe8dda0eec7c705a2390'; //goerli test net
//const dai_token_addr = '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359'; //MAINNET DAI TOKEN ADDRESS
const dai_token_addr = '0xbf553b46a4e073085414effa419ad7504d837e03'; //goerli test tokenERC20
//const weth_token_addr = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'; //MAINNET WETH TOKEN ADDRESS
const weth_token_addr = '0x00abd029d639862dd620be7a3337d0c7722ce1a4'; //goerli test weth9 contract
const matching_market_addr = '0x39755357759ce0d7f32dc8dc45414cca409ae24e'; //MAINNET
//ABIs
const congress_abi = require('../../build/abis/Congress_abi.json');
const matching_market_abi= require('../../build/abis/Matching_market_abi.json');
const ERC20_token_abi = require('../../build/abis/ERC20_abi.json');
let account;
let congress;
let dai;
let weth;
let matching_market;
let members = [];
//const startBlock = 8347312; //MAINNET
const startBlock = 1134521; //goerli
let minimum_quorum, majority_margin;

window.App = {
  start: function() {
    //account = _account;
    //create array of members
    /*congress.LogMembershipChanged({},  function(err, change) {
      if (err) return err;
      if (change.args.member === account) {
				if (!change.args.isMember) {
          document.getElementById("forMembers").className = 'hidden';
          console.log("your membership has been revoked");
	  			return;
				} else if (change.args.isMember) {
	  			members.push(change.args.member);
		  		document.getElementById("forMembers").className = 'shown';
	  			console.log("you are a member");
				}
      }
      else {
				if (change.args.isMember) {
	  			members.push(change.args.member);
	  			console.log("new member: " + change.args.member);
				}
				else if (!change.args.isMember)  {
          let i = members.indexOf(change.args.member);
          if(i != -1) {
	    			members.splice(i, 1);
	  			}
        }
      }
    })*/
		document.getElementById("donate_button").onclick = function() {
			document.getElementById("donate_button").className = 'hidden';
			document.getElementById("donate_div").className = 'shown';
		}
		//MEMBERS ONLY
		congress = web3.eth.contract(congress_abi).at(congress_addr);
    congress.members.call(account, (err,res) => {
			switch (res[0]) { //ARE YOU  A MEMBER?
				case false:
					return;
					break;
				case true:
					let Ids = new Set();
					dai = web3.eth.contract(ERC20_token_abi).at(dai_token_addr);
				  weth = web3.eth.contract(ERC20_token_abi).at(weth_token_addr);
					matching_market = web3.eth.contract(matching_market_abi).at(matching_market_addr);
					document.getElementById("forMembers").className = 'shown';
					//BALANCES STRIP
					let _proposal = document.createElement("tr");
					_proposal.innerHTML = "<td id='eth_bal'></td><td id='dai_bal'></td><td id='weth_bal'></td>";
					App.writeBalances();
					document.getElementById("balances").append(_proposal);
					//REMOVE PREVIOUS PROPOSALS
					let writtenProposals =  document.getElementById("activeProposals");
					while (writtenProposals.hasChildNodes()) writtenProposals.removeChild(writtenProposals.lastChild);
					//SET MINIMUM_QUORUM AND MAJORITY_MARGIN
					congress.minimumQuorum.call((err, min_quorum) => minimum_quorum = min_quorum);
			    congress.majorityMargin.call((err, margin) => majority_margin = margin);
					//WRITE PREVIOUS PROPOSALS
					let previousProposals = congress.LogProposalAdded({}, {fromBlock:startBlock});
					previousProposals.get((err, proposals) => {
						for (let proposal of proposals) {
							let proposalID = Number(proposal.args.proposalID);
							congress.LogProposalTallied.call({proposalID:proposalID, active:true}, {fromBlock:proposal.blockNumber}, () => {
								return;
							})
							Ids.add(proposalID);
						}
						for (let Id of Ids) App.writeProposal(Id);
					})
					//WATCH FOR AND WRITE NEW PROPOSAL
					let newProposal = congress.LogProposalAdded({}, {from:account});
					newProposal.watch((err, proposal) => {
						if (err) return;
						let proposalID = Number(proposal.args.proposalID);
						if (Ids.has(proposalID)) return;
						Ids.add(proposalID);
						App.writeProposal(proposalID);
					})
					//DONATION RECEIPTS
			    congress.LogReceivedEther({}, (err, res) => {
						App.writeBalances();
			    })
			    congress.LogReceivedTokens({_token:dai_token_addr}, (err, res) => {
						App.writeBalances();
			    })
			    //WATCH FOR VOTES FOR ANY PROPOSAL FROM NOW ON FROM ANYWHERE
			    congress.LogVoted({}, (err, vote) => {console.log(vote.args.proposalID);
			      if (err) return err;
				    let proposalID = Number(vote.args.proposalID);
			      let proposal_elements = document.getElementById(proposalID).getElementsByTagName("td");
			      congress.proposals.call(proposalID, (err, proposal) => {
							proposal_elements[4].innerHTML = proposal[6]; //number of votes
							if (proposal[6] >= minimum_quorum) proposal_elements[4].style.color = "green";
							proposal_elements[5].innerHTML = proposal[7];  //cumulative vote
							if (proposal[7] >= majority_margin)  proposal_elements[5].style.color = "green";
					  	if (proposal[6] >= minimum_quorum && proposal[7] >= majority_margin && Date.now()/1e3 > proposal[3]) {
					  	  proposal_elements[6].innerHTML = "<button id='" + proposalID + "ep'>EXECUTE</button>";
								App.click_event(proposalID, "execute", proposal);
							} else if (vote.args.voter === account) proposal_elements[6].innerHTML = "VOTED!";
			    	})
					})
					//WATCH FOR PROPOSALTALLIED
			    congress.LogProposalTallied({}, (err, proposal) => {
			      if (err) return err;
			      let status;
			      proposal.args.active ? status="PROPOSAL PASSED!" : status="PROPOSAL FAILED!";
			      document.getElementById(proposal.args.proposalID).getElementsByTagName("td")[6].innerHTML = status;
			      console.log("proposal votes tallied. Proposal ID: " + proposal.args.proposalID);
						App.writeBalances();
			    })
					// WATCH FOR CHANGE OF RULES
			    congress.LogChangeOfRules({}, (err, newrules) => {
			      if (err) return err;
			      majority_margin = newrules.args.newMajorityMargin;
			      minimum_quorum = newrules.args.newMinumumQuorum;
						minutes_for_debate = newrules.args.newMinutesForDebate;
			    })
			}
		})
  },
	//END OF App.start()
  //DONATE
	donate: function() {
    let donation = document.getElementById("donate").value*1e18;
		switch (document.getElementById("crypto_currency").value) {
			case "ETH":
	      web3.eth.sendTransaction({from:account, to:congress_addr, value:donation, gas:4e4}, (err, res) => {
	        if (err) return err;
	        console.log("ether donation initiated");
	      })
				break;
			case "DAI":
	      dai.approveAndCall(congress_addr, donation, "0x", {from:account, gas:1e5}, (err, res) => {
	        if (err) return err;
	        console.log(donation/1e18 + "dai donation initiated");
	      })
    }
  },
	//NEW PROPOSAL
  new_proposal: function() {
    let proposal = document.getElementById("proposal_options").value;
    let transactionBytecode;
    let beneficiary;
    let weiAmount;
    let jobDescription;
    switch (proposal) {
      case "SEND_ETH":
        beneficiary = prompt("address beneficiary?");
        weiAmount = prompt("amount ether?")*1e18;
        jobDescription = prompt("job description?");
				break;
      case  "SEND_DAI":
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
			case "ETH_TO_WETH":
				beneficiary=weth_token_addr; //weth contract
				weiAmount=prompt("amount of weth tokens to buy?")*1e18;
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
			case "UNLOCK_TO_SELL_DAI":
				beneficiary=dai_token_addr;
				weiAmount=0;
				jobDescription="unlock_dai";
				break;
      case "UNLOCK_TO_SELL_WETH":
        beneficiary=weth_token_addr;
        weiAmount=0;
        jobDescription="unlock_weth";
    }
    congress.newProposal(beneficiary, weiAmount, jobDescription, App.get_bytecode(beneficiary, jobDescription), {gas:2e5}, (err, res) => {
      if (err) return err;
      console.log("new proposal initiated" + res);
    })
  },
	//ADD CLICK EVENT
	click_event: function(id, action, proposal) {
		switch (action) {
			case "vote":
			  document.getElementById(id + "cp").onclick = function() {
	        congress.checkProposalCode(id, proposal[0], proposal[1], App.get_bytecode(proposal[0], proposal[2]), (err, code_checks) => {
						if (err) return;
	          if (code_checks) { //write YES/NO buttons if bytecode checks true
	            document.getElementById(id).getElementsByTagName("td")[6].innerHTML = "<button id='" + id + "true'>YES</button><button id='" + id + "false'>NO</button>";
				      document.getElementById(id + "true").onclick = function() {
						    congress.vote(id, true, "", {gas:1e5}, (err, res) => {
									if (err) return err;
				        	document.getElementById(id + "true").disabled = true;
				        	document.getElementById(id + "false").disabled = true;
								})
							}
							document.getElementById(id + "false").onclick = function() {
						    congress.vote(id, false, "", {gas:1e5}, (err, res) => {
							  	if (err) return;
			          	document.getElementById(id + "false").disabled = true;
				        	document.getElementById(id + "true").disabled = true;
								})
			        }
	          } else alert("proposal check returned false");
	        })
				}
				break;
			case "execute":
	      document.getElementById(id + "ep").onclick = function() {
	        congress.executeProposal(id, App.get_bytecode(proposal[0], proposal[2]), {gas:1e6}, function(err, res){
	        	if (err) return err;
	        	console.log("execution initiated");
	        	document.getElementById(id + "ep").disabled = true;
					})
	      }
		}
	},
	//WRITE BALANCES
	writeBalances: function(token) {
		switch (token) {
			case dai_token_addr:
				break;
			case weth_token_addr:
				break;
			default:
				dai.balanceOf.call(congress_addr, (err,dai_bal) => {
					dai.allowance.call(congress_addr, matching_market_addr, (err, allow) => {
						document.getElementById("dai_bal").innerHTML = "DAI: " + (dai_bal/1e18).toFixed(0) + " (" + (allow/1e18).toFixed(0) + ")";
					})
				})
				weth.balanceOf.call(congress_addr, (err,weth_bal) => {
					weth.allowance.call(congress_addr, matching_market_addr, (err, allow) => {
						document.getElementById("weth_bal").innerHTML = "WETH: " + (weth_bal/1e18).toFixed(2) + " (" + (allow/1e18).toFixed(2) + ")";
					})
        })
				web3.eth.getBalance(congress_addr, (err,eth_bal) => document.getElementById("eth_bal").innerHTML = "ETH: " + (eth_bal/1e18).toFixed(2));
		}
	},
  writeProposal: function(proposalID) {
    congress.proposals.call(proposalID, function(err, proposal) {
      if (err) return;
      if (proposal[4]) return;
		  let _proposal = document.createElement("tr");
		  _proposal.innerHTML = '<td align="center"></td><td></td><td align="center"></td><td></td><td align="center"></td><td align="center"></td><td align="center"></td>';
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
				App.click_event(proposalID, "vote", proposal);
			}
			//IF CONDITIONS ALLOW EXECUTION write execute button
			else if (Number(proposal[6]) >= minimum_quorum && Number(proposal[7]) >= majority_margin && Date.now() > proposal[3]*1e3) {
	      proposal_elements[6].innerHTML = "<button id='" + proposalID + "ep'>EXECUTE</button>";
				App.click_event(proposalID, "execute", proposal);
			} else { //SEE IF YOU VOTED
				let voted = congress.LogVoted({proposalID:proposalID, voter:account}, {fromBlock:startBlock});
			  voted.get(function(err, vote) {
			    if (err) return err;
			    if (vote.length === 0) { //you haven't voted so write vote buttons
		        proposal_elements[6].innerHTML = "<button id='" + proposalID + "cp'>VOTE</button>";
						App.click_event(proposalID, "vote", proposal);
		  		} else 	proposal_elements[6].innerHTML = "VOTED!";
				})
			}
		})
	},
	//GET BYTECODE
  get_bytecode: function(contract_addr, job_description) {
    switch(contract_addr) {
			case weth_token_addr:
				switch(job_description) {
					case  "weth_to_eth":
						return weth.withdraw.getData(prompt("amount of eth to withraw?")*1e18);
						break;
					case "eth_to_weth":
						return weth.deposit.getData();
						break;
					case "unlock_weth":
							return weth.approve.getData(matching_market_addr, prompt("amount weth to unlock for matching market?")*1e18);
					default: return "";
				};
			case matching_market_addr:
				matching_market = web3.eth.contract(matching_market_abi).at(matching_market_addr);
        switch(job_description) {
					case "dai_to_weth":
							return matching_market.sellAllAmount.getData(dai_token_addr, prompt("amount $dai to convert to weth?")*1e18, weth_token_addr, 5e15);
						break;
					case "weth_to_dai":
							return matching_market.sellAllAmount.getData(weth_token_addr, Number(prompt("amount weth to convert to dai?"))*1e18, dai_token_addr, 5e15);
					default:
				};
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
      case congress_addr:
        switch(job_description) {
          case "change_voting_rules":
            return congress.changeVotingRules.getData(prompt("new minimum quorum?"), prompt("new minutes for debate?"), prompt("new majority margin?"));
	    			break;
          case "add_member":
            return congress.addMember.getData(prompt("new member address?"), prompt("name of new member?"));
	    			break;
          case "remove_member":
            return congress.removeMember.getData(prompt("address of member to be removed?"));
        };
      default:
        return "";
    }
  }
},

window.addEventListener('load', async  function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (window.ethereum) {
    window.web3 = new Web3(ethereum);
    try {
      // Request account access if needed
      account = await ethereum.enable();
			App.start();
      console.log("using ethereum.enable. Acccounts now exposed");
    } catch (error) {
      console.log("access denied" + error);
    }
  }
  window.web3.version.getNetwork((err, netId) => {
    switch (netId) {
      case "1":
        console.log('This is mainnet')
        break
      default:
        console.log('This is an unknown network.')
    }
  })
	//web3.eth.getAccounts((err, accounts) => App.start(accounts[0]));
  //ethereum.on('accountsChanged', (accounts) => App.start(accounts[0]));
});
