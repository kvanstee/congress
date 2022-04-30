//const congress_addr = '0x3de0c040705d50d62d1c36bde0ccbad20606515a'; //MAINNET
const congress_addr = '0x1c99193C00969AE96a09C7EF38590BAc54650f9c'; //ganache testnet
//const startBlock = 10215507; //MAINNET
const startBlock = 0; //ganache testnet
let congress_abi=[{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"proposals","outputs":[{"name":"recipient","type":"address"},{"name":"amount","type":"uint256"},{"name":"description","type":"string"},{"name":"minExecutionDate","type":"uint256"},{"name":"executed","type":"bool"},{"name":"proposalPassed","type":"bool"},{"name":"numberOfVotes","type":"uint256"},{"name":"currentResult","type":"int256"},{"name":"proposalHash","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"members","outputs":[{"name":"isMember","type":"bool"},{"name":"name","type":"string"},{"name":"memberSince","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"debatingPeriodInMinutes","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"minimumQuorum","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"majorityMargin","outputs":[{"name":"","type":"int256"}],"payable":false,"stateMutability":"view","type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"name":"proposalID","type":"uint256"},{"indexed":false,"name":"recipient","type":"address"},{"indexed":false,"name":"amount","type":"uint256"},{"indexed":false,"name":"description","type":"string"},{"indexed":false,"name":"numProposals","type":"uint256"}],"name":"LogProposalAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"proposalID","type":"uint256"},{"indexed":false,"name":"position","type":"bool"},{"indexed":true,"name":"voter","type":"address"},{"indexed":false,"name":"justification","type":"string"}],"name":"LogVoted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"proposalID","type":"uint256"},{"indexed":false,"name":"result","type":"int256"},{"indexed":false,"name":"quorum","type":"uint256"},{"indexed":true,"name":"active","type":"bool"}],"name":"LogProposalTallied","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"newMinimumQuorum","type":"uint256"},{"indexed":false,"name":"newDebatingPeriodInMinutes","type":"uint256"},{"indexed":false,"name":"newMajorityMargin","type":"int256"}],"name":"LogChangeOfRules","type":"event"},{"constant":false,"inputs":[{"name":"targetMember","type":"address"},{"name":"memberName","type":"string"}],"name":"addMember","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"targetMember","type":"address"}],"name":"removeMember","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"minimumQuorumForProposals","type":"uint256"},{"name":"minutesForDebate","type":"uint256"},{"name":"marginOfVotesForMajority","type":"int256"}],"name":"changeVotingRules","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"beneficiary","type":"address"},{"name":"weiAmount","type":"uint256"},{"name":"jobDescription","type":"string"},{"name":"transactionBytecode","type":"bytes"}],"name":"newProposal","outputs":[{"name":"proposalID","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"proposalNumber","type":"uint256"},{"name":"beneficiary","type":"address"},{"name":"weiAmount","type":"uint256"},{"name":"transactionBytecode","type":"bytes"}],"name":"checkProposalCode","outputs":[{"name":"codeChecksOut","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"proposalNumber","type":"uint256"},{"name":"supportsProposal","type":"bool"},{"name":"justificationText","type":"string"}],"name":"vote","outputs":[{"name":"voteID","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"proposalNumber","type":"uint256"},{"name":"transactionBytecode","type":"bytes"}],"name":"executeProposal","outputs":[],"payable":true,"stateMutability":"payable","type":"function"}]
let account = null;
let congress;
let minimum_quorum, majority_margin;
let writable = false;

export default window.App = {
  start: async (_provider) => {
		let { Contract } = await import('ethers');
		congress = new Contract(congress_addr, congress_abi, _provider);
		congress.removeAllListeners();
    congress.members(account).then(res => {
			if (!res[0]) return;  //NOT A MEMBER
			//   !!!!MEMBER!!!!
			console.log("MEMBER!")
			const Ids = new Set();
			document.getElementById("forMembers").style = 'display:inline-block';
			//SET MINIMUM_QUORUM AND MAJORITY_MARGIN
			congress.minimumQuorum().then(quorum => minimum_quorum = Number(quorum));
	    congress.majorityMargin().then(margin => majority_margin = Number(margin));
			//WRITE PREVIOUS PROPOSALS
			congress.queryFilter('LogProposalAdded', startBlock).then(proposals => {
				for (let proposal of proposals) {
					let ID = Number(proposal.args.proposalID);
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
			congress.on('LogProposalAdded', (proposalID) => {
				let id = Number(proposalID)
				if (!Ids.has(id))	{
					Ids.add(id);
					App.write_proposal(id);
				}
			})
			// WATCH FOR CHANGE OF RULES
	    congress.on('LogChangeOfRules', (min_quorum, maj_margin) => {
				minimum_quorum = min_quorum.toNumber();
				majority_margin = maj_margin.toNumber();
	    })
			//NEW PROPOSAL ONCLICK
			document.getElementById("new_proposal").onclick = async () => {
			  document.getElementById("new_proposal").disabled = true;
			  let proposal = document.getElementById("proposal_options").value;
			  let transactionBytecode;
			  let beneficiary;
			  let weiAmount;
			  let jobDescription;
			  switch (proposal) {
			    case "SEND_ETH":
						let { BigNumber } = await import('ethers');
			      beneficiary = account; //prompt("address beneficiary?");
			      weiAmount = BigNumber.from(10).pow(18).mul(prompt("amount ether?"));
			      jobDescription = prompt("job description?");
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
					default:
			      return;
			  }
			  congress.newProposal(beneficiary, weiAmount, jobDescription, App.get_bytecode(beneficiary, jobDescription)).then((res) => {
			    console.log("new proposal initiated");
			    document.getElementById('new_proposal').disabled = false;
			  })
			}
		})
  },
	//END OF App.start()

	//WATCH FOR VOTE
	watch_for_vote: (ID) => {
		let filter = congress.filters.LogVoted(ID);
	  congress.on(filter, (id, vote, voter) => {
	    let proposal_elements = document.getElementById(ID).getElementsByTagName("td");
	    congress.proposals(id).then(proposal => {
				proposal_elements[4].innerHTML = proposal[6]; //number of votes
				proposal_elements[5].innerHTML = proposal[7];  //cumulative vote
				if (proposal[6] >= minimum_quorum) proposal_elements[4].style.color = "green";
				if (proposal[7] >= majority_margin) proposal_elements[5].style.color = "green";
		  	if (proposal[6] >= minimum_quorum && proposal[7] >= majority_margin && Date.now()/1e3 > proposal[3]) {
		  	  proposal_elements[6].innerHTML = "<button id='" + proposalID + "ep'>EXECUTE</button>";
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
		congress.once(filter, (id,res,num_votes,active) => {
			if (!active) return
      document.getElementById(proposalID).getElementsByTagName("td")[6].innerHTML = "EXECUTED!"
    })
	},
	//WRITE PROPOSAL
  write_proposal: (proposalID) => {
    congress.proposals(proposalID).then(proposal => {
      if (proposal[4]) return
		  let _proposal = document.createElement("tr")
		  _proposal.innerHTML = '<td class="head" align="center"></td><td></td><td align="center"></td><td></td><td align="center"></td><td align="center"></td><td class="foot" align="center"></td>'
		  _proposal.id = proposalID
		  let proposal_elements = _proposal.getElementsByTagName('td')
		  //WRITE TABLE ROW (PROPOSAL)
	    proposal_elements[0].innerHTML = _proposal.id
	    proposal_elements[1].innerHTML = proposal[0] //recipient
	    proposal_elements[2].innerHTML = proposal[1]/1e18 //amount
	    proposal_elements[3].innerHTML = proposal[2] //description
	    proposal_elements[4].innerHTML = Number(proposal[6]) //number votes
	    proposal_elements[5].innerHTML = Number(proposal[7]) //progressive vote
			//APPEND THE PROPOSAL; COLOUR COUNTS
		  document.getElementById("activeProposals").append(_proposal);
		  (Number(proposal[6]) >= minimum_quorum) ? proposal_elements[4].style.color="green" : proposal_elements[4].style.color="red";
		  (Number(proposal[7]) >= majority_margin) ? proposal_elements[5].style.color="green" : proposal_elements[5].style.color="red";
			if (Number(proposal[6]) < minimum_quorum || Number(proposal[7]) < majority_margin) {
				App.watch_for_vote(proposalID)
				//SEE IF YOU VOTED
				let filter = congress.filters.LogVoted(proposalID, null, account); //indexed variables
				congress.queryFilter(filter, proposal.blockNumber).then(vote => {
		  	  if (vote.length === 0) { //you haven't voted so write vote buttons
		        proposal_elements[6].innerHTML = "<button id='" + proposalID + "cp'>VOTE</button>";
    				App.set_up_click_event(proposalID, "vote", proposal);
		  		} else 	proposal_elements[6].innerHTML = "VOTED!";
		  	})
			}
			//IF CONDITIONS ALLOW EXECUTION write execute button
			else {
	      proposal_elements[6].innerHTML = "<button id='" + proposalID + "ep'>EXECUTE</button>";
				App.set_up_click_event(proposalID, "execute", proposal);
				if (Date.now() < proposal[3]*1e3) document.getElementById(proposalID + "ep").disabled = true;
				else App.watch_for_prop_tallied(proposalID);
			}
		})
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
	                if (vote = "yes") congress.vote(id, true, "");
	                else if (vote = "no") congress.vote(id, false, "");
									document.getElementById(id + vote).disabled = true;
								}
              })
	          } else alert("proposal check returned false");
	        })
	      }
	      break;
	    case "execute":
	      document.getElementById(id + "ep").onclick = () => {
	        congress.executeProposal(id, App.get_bytecode(proposal[0], proposal[2])).then(() => {
		        document.getElementById(id + "ep").disabled = true;
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
		document.getElementById('connect_button').style = 'display:none';
		document.getElementById('read_write').style = 'display:inline-block';
		document.getElementById('read_write').onclick = () => {
			writable = true;
			document.getElementById('read_write').style = 'display:none';
			document.getElementById('new_proposal').disabled = false;
		}
		let { providers }  = await import('ethers');
		const provider =  new providers.Web3Provider(window.ethereum);
		setTimeout(() => {
			document.getElementById('read_write').style = 'display:none';
			ethereum.request({method:'eth_requestAccounts'}).then(accounts => {
			  if (accounts[0] !== account) account = accounts[0];
				if (!writable) {
					document.getElementById('new_proposal').disabled = true;
					App.start(provider); //Initialize app ro
				}
				else if (writable) {
					const signer = provider.getSigner();
					App.start(signer) //Initialize app rw
				}
			}).catch((err) => {
			  console.error(err);
			})
		},2000);
	}
})
