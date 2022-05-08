//const congress_addr = '0x3de0c040705d50d62d1c36bde0ccbad20606515a'; //MAINNET
const congress_addr = '0x1c99193C00969AE96a09C7EF38590BAc54650f9c'; //ganache testnet
//const startBlock = 14e6; //MAINNET
const startBlock = 0; //ganache testnet
let congress_abi=[{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"proposals","outputs":[{"name":"recipient","type":"address"},{"name":"amount","type":"uint256"},{"name":"description","type":"string"},{"name":"minExecutionDate","type":"uint256"},{"name":"executed","type":"bool"},{"name":"proposalPassed","type":"bool"},{"name":"numberOfVotes","type":"uint256"},{"name":"currentResult","type":"int256"},{"name":"proposalHash","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"members","outputs":[{"name":"isMember","type":"bool"},{"name":"name","type":"string"},{"name":"memberSince","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"debatingPeriodInMinutes","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"minimumQuorum","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"majorityMargin","outputs":[{"name":"","type":"int256"}],"payable":false,"stateMutability":"view","type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"name":"ID","type":"uint256"},{"indexed":false,"name":"recipient","type":"address"},{"indexed":false,"name":"amount","type":"uint256"},{"indexed":false,"name":"description","type":"string"},{"indexed":false,"name":"numProposals","type":"uint256"}],"name":"LogProposalAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"proposalID","type":"uint256"},{"indexed":false,"name":"position","type":"bool"},{"indexed":true,"name":"voter","type":"address"},{"indexed":false,"name":"justification","type":"string"}],"name":"LogVoted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"proposalID","type":"uint256"},{"indexed":false,"name":"result","type":"int256"},{"indexed":false,"name":"quorum","type":"uint256"},{"indexed":true,"name":"active","type":"bool"}],"name":"LogProposalTallied","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"newMinimumQuorum","type":"uint256"},{"indexed":false,"name":"newDebatingPeriodInMinutes","type":"uint256"},{"indexed":false,"name":"newMajorityMargin","type":"int256"}],"name":"LogChangeOfRules","type":"event"},{"constant":false,"inputs":[{"name":"targetMember","type":"address"},{"name":"memberName","type":"string"}],"name":"addMember","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"targetMember","type":"address"}],"name":"removeMember","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"minimumQuorumForProposals","type":"uint256"},{"name":"minutesForDebate","type":"uint256"},{"name":"marginOfVotesForMajority","type":"int256"}],"name":"changeVotingRules","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"beneficiary","type":"address"},{"name":"weiAmount","type":"uint256"},{"name":"jobDescription","type":"string"},{"name":"transactionBytecode","type":"bytes"}],"name":"newProposal","outputs":[{"name":"proposalID","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"proposalNumber","type":"uint256"},{"name":"beneficiary","type":"address"},{"name":"weiAmount","type":"uint256"},{"name":"transactionBytecode","type":"bytes"}],"name":"checkProposalCode","outputs":[{"name":"codeChecksOut","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"proposalNumber","type":"uint256"},{"name":"supportsProposal","type":"bool"},{"name":"justificationText","type":"string"}],"name":"vote","outputs":[{"name":"voteID","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"proposalNumber","type":"uint256"},{"name":"transactionBytecode","type":"bytes"}],"name":"executeProposal","outputs":[],"payable":true,"stateMutability":"payable","type":"function"}];
let account, congress;

window.App = {
  start: async (_provider) => {
		let { Contract } = await import('ethers');
		congress = new Contract(congress_addr, congress_abi, _provider);
		congress.removeAllListeners();
    congress.members(account).then(res => {
			if (!res[0]) return;  //NOT A MEMBER
			//   !!!!MEMBER!!!!
			console.log("MEMBER!")
			const Ids = new Set();
			document.getElementById("forMembers").style.display = 'inline-block';
			//SET MINIMUM_QUORUM AND MAJORITY_MARGIN
			//WRITE PREVIOUS PROPOSALS
			congress.queryFilter('LogProposalAdded', startBlock).then(proposals => {
				for (let proposal of proposals) {
					let ID = Number(proposal.args.ID);
          let filter = congress.filters.LogProposalTallied(ID);
					congress.queryFilter(filter ,proposal.blockNumber, 'latest').then(prop_tallied => {
						if (prop_tallied.length !== 0) return;
          	if (!Ids.has(ID)) {
          		Ids.add(ID);
							App.write_proposal(ID);
						}
					})
				}
			})
			//WATCH FOR AND WRITE NEW PROPOSAL
			congress.on('LogProposalAdded', (ID) => {
				let id = Number(ID);
				if (!Ids.has(id))	{
					Ids.add(id);
					App.write_proposal(id);
				}
			})
			// WATCH FOR CHANGE OF RULES
	    congress.on('LogChangeOfRules', (min_quorum, maj_margin) => {
				minimum_quorum = Number(min_quorum);
				majority_margin = Number(maj_margin);
	    })
			//NEW PROPOSAL ONCLICKS
			document.getElementById("send_eth").onclick = async () => {
				let { BigNumber } = await import('ethers');
			  document.getElementById("send_eth").disabled = true;
			  let beneficiary = account; //prompt("address beneficiary?",account);
				let amount = prompt("amount ether?");
				if (amount == null) {document.getElementById("send_eth").disabled = false; return;}
			  let weiAmount = BigNumber.from(10).pow(18).mul(Number(amount));
			  let jobDescription = prompt("job description?");
				App.new_proposal(beneficiary, weiAmount, jobDescription);
				document.getElementById("send_eth").disabled = false;
			}
			document.getElementById("left").onclick = () => {
				document.getElementById("contract").style.display = "none";
				document.getElementById("right").style.display = "inline-block";
				document.getElementById("left").style.display = "none";
			}
			document.getElementById("right").onclick = () => {
				document.getElementById("contract").style.display = "inline-block";
				document.getElementById("right").style.display = "none";
				document.getElementById("left").style.display = "inline-block";
				document.getElementById("add_member").onClick = () => {
				  document.getElementById("add_member").disabled = true;
					let beneficiary=congress_addr;
				  let weiAmount=0;
				  let jobDescription="add_member";
					App.new_proposal(beneficiary, weiAmount, jobDescription);
				}
				document.getElementById("rem_member").onclick = () => {
				  document.getElementById("rem_member").disabled = true;
				 	let beneficiary=congress_addr;
				  let weiAmount=0;
				  let jobDescription="remove_member";
				  App.new_proposal(beneficiary, weiAmount, jobDescription);
				}
				document.getElementById("new_rules").onclick = () => {
				  document.getElementById("new_rules").disabled = true;
				  let beneficiary=congress_addr;
				  let weiAmount=0;
				  let jobDescription="change_voting_rules";
				  App.new_proposal(beneficiary, weiAmount, jobDescription);
				}
			}
		})
  },
	//END OF App.start()
	//NEW PROPOSAL
	new_proposal: (recip, amt, desc) => {
	  congress.newProposal(recip, amt, desc, App.get_bytecode(recip, desc)).then(() => {
	    console.log("new proposal initiated");
	  })
	},
	//WATCH FOR VOTE
	watch_for_vote: (ID,minimum_quorum,majority_margin) => {
		let filter = congress.filters.LogVoted(ID);
	  congress.on(filter, (id, null, voter) => {
	    let proposal_elements = document.getElementById(ID).getElementsByTagName("td");
	    congress.proposals(id).then(proposal => {
				let num_votes = Number(proposal[6]);
				let cum_vote = Number(proposal[7]);
				proposal_elements[4].innerHTML = num_votes; //number of votes
				proposal_elements[5].innerHTML = cum_vote;  //cumulative vote
				if (num_votes >= minimum_quorum) proposal_elements[4].style.color = "green";
				if (cum_vote >= majority_margin) proposal_elements[5].style.color = "green";
		  	if (num_votes >= minimum_quorum && cum_vote >= majority_margin && Date.now()/1e3 > proposal[3]) {
		  	  proposal_elements[6].innerHTML = "<button id='" + ID + "ep'>EXECUTE</button>";
					App.set_up_click_event(id, "execute", proposal);
					App.watch_for_prop_tallied(ID);
					congress.off(filter);
				} else if (voter.toLowerCase() === account.toLowerCase()) {
					proposal_elements[6].innerHTML = "VOTED!";
				}
	  	})
		})
	},
	//WATCH FOR PROPOSALTALLIED
	watch_for_prop_tallied: (ID) => {
		let filter = congress.filters.LogProposalTallied(ID)
		congress.once(filter, (null,null,null,active) => {
			if (!active) return
      document.getElementById(ID).getElementsByTagName("td")[6].innerHTML = "EXECUTED!"
    })
	},
	//WRITE PROPOSAL
  write_proposal: async (ID) => {
    let proposal = await congress.proposals(ID);
    if (proposal[4]) return;
	  let _proposal = document.createElement("tr");
	  _proposal.innerHTML = '<td class="head" align="center"></td><td></td><td align="center"></td><td></td><td align="center"></td><td align="center"></td><td class="foot" align="center"></td>';
	  _proposal.id = ID;
	  let proposal_elements = _proposal.getElementsByTagName('td');
	  //WRITE TABLE ROW (PROPOSAL)
		let num_votes = Number(proposal[6]);
		let cum_vote = Number(proposal[7]);
    proposal_elements[0].innerHTML = _proposal.id;
    proposal_elements[1].innerHTML = proposal[0]; //recipient
    proposal_elements[2].innerHTML = Number(proposal[1])/1e18; //amount
    proposal_elements[3].innerHTML = proposal[2]; //description
    proposal_elements[4].innerHTML = num_votes;
    proposal_elements[5].innerHTML = cum_vote;
		//APPEND THE PROPOSAL
	  document.getElementById("activeProposals").append(_proposal);
		//colour vote counts
		let min_quor = Number(await congress.minimumQuorum());
		let maj_mar = Number(await congress.majorityMargin());
	  (num_votes >= min_quor) ? proposal_elements[4].style.color="green" : proposal_elements[4].style.color="red";
	  (cum_vote >= maj_mar) ? proposal_elements[5].style.color="green" : proposal_elements[5].style.color="red";
		if (num_votes < min_quor || cum_vote < maj_mar) {
			App.watch_for_vote(ID,min_quor,maj_mar)
			//SEE IF YOU VOTED
			let filter = congress.filters.LogVoted(ID, null, account); //indexed variables
			congress.queryFilter(filter, proposal.blockNumber).then(vote => {
	  	  if (vote.length === 0) { //account has NOT voted so write vote button which checks proposal
	        proposal_elements[6].innerHTML = "<button id='" + ID + "cp'>VOTE</button>"; //cp=check proposal
  				App.set_up_click_event(ID, "vote", proposal);
	  		} else 	proposal_elements[6].innerHTML = "VOTED!";
	  	})
		} else {			 //must be executable so write execute button
      proposal_elements[6].innerHTML = "<button id='" + ID + "ep'>EXECUTE</button>";
			App.set_up_click_event(ID, "execute", proposal);
			if (Date.now() < proposal[3]*1e3) document.getElementById(ID + "ep").disabled = false;
			else App.watch_for_prop_tallied(ID);
		}
	},
	//ADD CLICK EVENT
	set_up_click_event: (id, action, proposal) => {
	  switch (action) {
	    case "vote":
	      document.getElementById(id + "cp").onclick = () => {
	        congress.checkProposalCode(id, proposal[0], proposal[1], App.get_bytecode(proposal[0], proposal[2])).then((code_checks) => {
	          if (code_checks) { //write YES/NO buttons if bytecode checks true
	            document.getElementById(id).getElementsByTagName("td")[6].innerHTML = "<button id='" + id + "yes'>YES</button>   <button id='" + id + "no'>NO</button>";
              ["yes","no"].forEach(vote => {
              	document.getElementById(id + vote).onclick = () => {
	                if (vote == "yes") congress.vote(id, true, "").catch(err => console.error(err));
	                else if (vote == "no") congress.vote(id, false, "").catch(err => console.error(err));
									document.getElementById(id + vote).disabled = true;
								}
              })
	          } else alert("proposal check returned false");
	        })
	      }
	      break;
	    case "execute":
	      document.getElementById(id + "ep").onclick = () => {
	        document.getElementById(id + "ep").disabled = true;
	        congress.executeProposal(id, App.get_bytecode(proposal[0], proposal[2])).then(() => {
	          console.log("proposal being executed!");
	        })
	      }
	  }
	},
	//GET BYTECODE
	get_bytecode: async (contract_addr, job_description) => {
	  let { utils } = await import('ethers');
	  switch(contract_addr) {
	    case congress_addr:
	      let congr_iface = new utils.Interface(congress_abi);
	      switch(job_description) {
	        case "change_voting_rules":
	          return congr_iface.encodeFunctionData("changeVotingRules", [prompt("new minimum quorum?"), prompt("new minutes for debate?"), prompt("new majority margin?")]);
	          break;
	        case "add_member":
	          return congr_iface.encodeFunctionData("addMember", [prompt("new member address?"), prompt("name of new member?")]);
	          break;
	        case "remove_member":
	          return congr_iface.encodeFunctionData("removeMember", [prompt("address of member to be removed?")]);
	      };
	      break;
	    default:
	      return "0x";
	  }
	}
}
window.addEventListener('load', () => {
	document.getElementById('connect_button').onclick = async () => {
		document.getElementById('connect_button').style.display = 'none';
		let { providers }  = await import('ethers');
		const provider =  new providers.Web3Provider(window.ethereum);
		ethereum.request({method:'eth_requestAccounts'}).then(accounts => {
		  account = accounts[0];
			const signer = provider.getSigner();
			App.start(signer) //Initialize app rw
			//App.start(provider) //Initialize app ro
		})
	}
})
