import { Contract,utils,providers,BigNumber } from 'ethers';
const congress_addr = '0x3de0c040705d50d62d1c36bde0ccbad20606515a'; //MAINNET
//const congress_addr = '0x1c99193C00969AE96a09C7EF38590BAc54650f9c'; //ganache testnet
const startBlock = 187e5; //MAINNET
//const startBlock = 0; //ganache testnet
const congress_abi=[{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"proposals","outputs":[{"name":"recipient","type":"address"},{"name":"amount","type":"uint256"},{"name":"description","type":"string"},{"name":"minExecutionDate","type":"uint256"},{"name":"executed","type":"bool"},{"name":"proposalPassed","type":"bool"},{"name":"numberOfVotes","type":"uint256"},{"name":"currentResult","type":"int256"},{"name":"proposalHash","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"members","outputs":[{"name":"isMember","type":"bool"},{"name":"name","type":"string"},{"name":"memberSince","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"debatingPeriodInMinutes","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"minimumQuorum","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"majorityMargin","outputs":[{"name":"","type":"int256"}],"payable":false,"stateMutability":"view","type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"name":"ID","type":"uint256"},{"indexed":false,"name":"recipient","type":"address"},{"indexed":false,"name":"amount","type":"uint256"},{"indexed":false,"name":"description","type":"string"},{"indexed":false,"name":"numProposals","type":"uint256"}],"name":"LogProposalAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"proposalID","type":"uint256"},{"indexed":false,"name":"position","type":"bool"},{"indexed":true,"name":"voter","type":"address"},{"indexed":false,"name":"justification","type":"string"}],"name":"LogVoted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"proposalID","type":"uint256"},{"indexed":false,"name":"result","type":"int256"},{"indexed":false,"name":"quorum","type":"uint256"},{"indexed":true,"name":"active","type":"bool"}],"name":"LogProposalTallied","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"newMinimumQuorum","type":"uint256"},{"indexed":false,"name":"newDebatingPeriodInMinutes","type":"uint256"},{"indexed":false,"name":"newMajorityMargin","type":"int256"}],"name":"LogChangeOfRules","type":"event"},{"constant":false,"inputs":[{"name":"targetMember","type":"address"},{"name":"memberName","type":"string"}],"name":"addMember","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"targetMember","type":"address"}],"name":"removeMember","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"minimumQuorumForProposals","type":"uint256"},{"name":"minutesForDebate","type":"uint256"},{"name":"marginOfVotesForMajority","type":"int256"}],"name":"changeVotingRules","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"beneficiary","type":"address"},{"name":"weiAmount","type":"uint256"},{"name":"jobDescription","type":"string"},{"name":"transactionBytecode","type":"bytes"}],"name":"newProposal","outputs":[{"name":"proposalID","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"proposalNumber","type":"uint256"},{"name":"beneficiary","type":"address"},{"name":"weiAmount","type":"uint256"},{"name":"transactionBytecode","type":"bytes"}],"name":"checkProposalCode","outputs":[{"name":"codeChecksOut","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"proposalNumber","type":"uint256"},{"name":"supportsProposal","type":"bool"},{"name":"justificationText","type":"string"}],"name":"vote","outputs":[{"name":"voteID","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"proposalNumber","type":"uint256"},{"name":"transactionBytecode","type":"bytes"}],"name":"executeProposal","outputs":[],"payable":true,"stateMutability":"payable","type":"function"}];
let congress;
let min_quor;
let maj_mar;

window.App = {
  start: async (account,_provider) => {
		congress = new Contract(congress_addr, congress_abi, _provider);
		congress.removeAllListeners();
		min_quor = Number(await congress.minimumQuorum());
		maj_mar = Number(await congress.majorityMargin());
    congress.members(account).then(res => {
			if (!res[0]) return;  //NOT A MEMBER
			//   !!!!MEMBER!!!!
			document.getElementById("forMembers").style.display = 'inline-block';
			//WRITE PREVIOUS PROPOSALS
			function watch_for_votes() {
				congress.on('LogVoted', (id,vote,voter) => {
					let voted = false;
					if (voter.toLowerCase() === account.toLowerCase()) voted = true;
					App.write_proposal(id,voted);
				})
			}
			congress.queryFilter('LogProposalAdded', startBlock, 'latest').then(proposals => {
				if (proposals.length === 0) return;
				watch_for_votes();
				proposals.forEach(proposal => {
					const ID = Number(proposal.args.ID);
          const prop_tallied = congress.filters.LogProposalTallied(ID);
					congress.queryFilter(prop_tallied ,proposal.blockNumber, 'latest').then(tallied => {
						if (tallied.length !== 0) return; //proposal tallied
	      		const filter = congress.filters.LogVoted(ID,null,account);
						congress.queryFilter(filter,proposal.blockNumber,'latest').then(res => { //have you voted?
							if (res.length === 1)	App.write_proposal(ID,true);
							else App.write_proposal(ID,false);
						})
					})
				})
			})
			//WATCH FOR AND WRITE NEW PROPOSAL
			congress.on('LogProposalAdded', (ID) => {
				const id = Number(ID);
				if (congress.listenerCount("LogVoted") === 0) watch_for_votes();
				App.write_proposal(id,false);
			})
			//NEW PROPOSAL ONCLICKS
			document.getElementById("send_eth").onclick = async () => {
			  document.getElementById("send_eth").disabled = true;
			  const beneficiary = account; //prompt("address beneficiary?",account);
				const amount = prompt("amount ether?");
				if (amount === null) {send_eth.disabled = false; return;}
			  const weiAmount = BigNumber.from(10).pow(18).mul(Number(amount));
			  const jobDescription = prompt("job description?");
				congress.newProposal(beneficiary, weiAmount, jobDescription, "0x");
				document.getElementById("send_eth").disabled = false;
			}
			//contract functions: add_member remove_member, change_voting_rules
			document.getElementById("left").onclick = () => {
				document.getElementById("contract").style.display = "none"; //remove contract function buttons
				document.getElementById("right").style.display = "inline-block";
				document.getElementById("left").style.display = "none";
			}
			document.getElementById("right").onclick = () => {
				document.getElementById("contract").style.display = "inline-block"; //display contract function buttons
				document.getElementById("right").style.display = "none";
				document.getElementById("left").style.display = "inline-block";
				["add_member","remove_member","change_voting_rules"].forEach(action => {
					document.getElementById(action).onclick = () => {
					  congress.newProposal(congress_addr,0,action,App.get_bytecode(action));
					}
				})
			}
		})
  },
	//END OF App.start()
	//WRITE PROPOSAL
  write_proposal: async (id,voted) => {
		const ID = Number(id);
    const proposal = await congress.proposals(ID);
    if (proposal[4]) return;
		let proposal_elements;
		if (document.getElementById(ID) === null) { //unwritten proposal
		  const _proposal = document.createElement("tr");
		  _proposal.innerHTML = '<td class="head" align="center"></td><td></td><td align="center"></td><td></td><td align="center"></td><td align="center"></td><td class="foot" align="center"></td>';
		  _proposal.id = ID;
		  //WRITE TABLE ROW (PROPOSAL)
			proposal_elements = _proposal.getElementsByTagName('td');
	    proposal_elements[0].innerText = _proposal.id;
	    proposal_elements[1].innerText = proposal[0]; //recipient
	    proposal_elements[2].innerText = Number(proposal[1])/1e18; //amount
	    proposal_elements[3].innerText = proposal[2]; //description
		  activeProposals.append(_proposal);
		} else { //proposal already written
			proposal_elements = document.getElementById(ID).getElementsByTagName('td');
			if (["voted","voting","EXECUTE"].includes(proposal_elements[6].innerText)) voted = true;
		}
    let bytecode = "0x";
		let num_votes = Number(proposal[6]);
		let cum_vote = Number(proposal[7]);
		proposal_elements[4].innerText = num_votes;
		proposal_elements[5].innerText = cum_vote;
		(num_votes >= min_quor) ? proposal_elements[4].style.color="green" : proposal_elements[4].style.color="red";
	  (cum_vote >= maj_mar) ? proposal_elements[5].style.color="green" : proposal_elements[5].style.color="red";
		if (cum_vote >= maj_mar && num_votes >= min_quor) { //set up listeners
			if (congress.listenerCount("LogProposalTallied") === 0) App.watch_for_proposal_tallied();
			if (proposal[2] === "change_voting_rules") App.watch_for_change_of_rules();
		}
		if (!voted) { //have NOT voted so set up vote button. If executable, vote could make proposal unexecutable
			if (proposal_elements[6].innerText === "VOTE") return; //no point rewriting vote button
	  	proposal_elements[6].innerHTML = "<button id=" + ID + "cp>VOTE</button>";
      document.getElementById(ID + "cp").onclick = () => { //check if member knows proposal
				if (["change_voting_rules","add_member","remove_member"].includes(proposal[2])) bytecode = App.get_bytecode(proposal[2]);
        congress.checkProposalCode(ID,proposal[0],proposal[1],bytecode).then((code_checks) => {
          if (code_checks) { //write YES/NO buttons if bytecode checks true
            document.getElementById(ID).getElementsByTagName("td")[6].innerHTML = "<button id='" + ID + "yes'>YES</button>   <button id='" + ID + "no'>NO</button>";
            ["yes","no"].forEach(vote => {
            	document.getElementById(ID + vote).onclick = () => {
                if (vote === "yes") congress.vote(ID, true, "");
                else if (vote === "no") congress.vote(ID, false, "");
								proposal_elements[6].innerText = "voting";
							}
            })
          } else alert("proposal check returned false; input/s wrong");
        })
      }
		} else { //have voted
			if (num_votes >= min_quor && cum_vote >= maj_mar) { //if executable at end of debating period
				function write_exe_butt() {
				  proposal_elements[6].innerHTML = "<button id=" + ID + "ep>EXECUTE</button>";
		      document.getElementById(ID + "ep").onclick = () => {
						document.getElementById(ID + "ep").disabled = true;
						if (["change_voting_rules","add_member","remove_member"].includes(proposal[2])) bytecode = App.get_bytecode(proposal[2]);
		        congress.executeProposal(ID,bytecode);
		      }
				}
				if (proposal[3]*1e3 > Date.now()) { //still debating time left
					setTimeout(() => write_exe_butt(),(proposal[3]*1e3 - Date.now()));
					proposal_elements[6].innerText = "voted";
			  } else write_exe_butt(); //debating time finished, write execute button
			} else { //not executable like this at end of debating period
				if (proposal_elements[6].innerText === "voted") return;
				proposal_elements[6].innerText = "voted";
			}
		}
	},
	//WATCH FOR PROPOSAL TALLIED
	watch_for_proposal_tallied: () => {
		congress.on("LogProposalTallied", (ID) => {
			if (document.getElementById(ID) === null) return;
			document.getElementById(ID).getElementsByTagName("td")[6].innerText = "executed";
		})
	},
	//WATCH FOR CHANGE OF RULES
	watch_for_change_of_rules: () => {
		congress.on('LogChangeOfRules', (new_quor,new_deb,new_mar) => {
			min_quor = new_quor;
			maj_mar = new_mar;
			Array.from(activeProposals.children).forEach(prop => App.write_proposal(prop.id,false));
		})
	},
	//GET BYTECODE
	get_bytecode: async (job_description) => {
    const congr_iface = new utils.Interface(congress_abi);
    switch(job_description) {
      case "change_voting_rules":
        return congr_iface.encodeFunctionData("changeVotingRules", [prompt("new minimum quorum?"), prompt("new minutes for debate?"), prompt("new majority margin?")]);
        break;
      case "add_member":
        return congr_iface.encodeFunctionData("addMember", [prompt("new member address?"), prompt("name of new member?")]);
        break;
      case "remove_member":
        return congr_iface.encodeFunctionData("removeMember", [prompt("address of member to be removed?")]);
  	}
  }
}
window.addEventListener('load', () => {
	document.getElementById("connect_button").onclick = () => {
		document.getElementById("connect_button").style.display = 'none';
		const provider =  new providers.Web3Provider(window.ethereum);
		ethereum.request({method:'eth_requestAccounts'}).then(accounts => {
		  const account = accounts[0];
			const signer = provider.getSigner();
			App.start(account, signer) //Initialize app rw
		})
	}
})
