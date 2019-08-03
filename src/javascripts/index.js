require('../stylesheets/app.css');

const congress_abi = require('../../build/contracts/Congress_abi.json');
//const congress_addr = '0x3de0c040705d50d62d1c36bde0ccbad20606515a'; //MAINNET
const congress_addr = '0xac4364768626124d1aa0fe8dda0eec7c705a2390'; //goerli test net
//const dai_token_addr = '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359'; //MAINNET DAI TOKEN ADDRESS
const dai_token_addr = '0xbf553b46a4e073085414effa419ad7504d837e03'; //goerli test tokenERC20
const dai_token_abi = require('../../build/contracts/TokenERC20_min_abi.json');
let account;
let congress;
let dai;
let members = [];
//const startBlock = 8184105; //MAINNET
const startBlock = 750000;  //goerli test net
let minimum_quorum, majority_margin;

window.App = {
  start: function(_account) {
    account = _account;
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
		let writtenProposals =  document.getElementById("activeProposals");
		while (writtenProposals.hasChildNodes()) writtenProposals.removeChild(writtenProposals.lastChild);
		congress.minimumQuorum.call(function(err, min_quorum) {
      if (err) return;
      minimum_quorum = min_quorum;
    })
    congress.majorityMargin.call(function(err, margin) {
      if (err) return;
      majority_margin = margin;
    })
		//SHOW PROPOSALS IF MEMBER
    congress.members.call(account, function(err,res) {
      if (res[0]) document.getElementById("forMembers").className = 'shown';
      else document.getElementById("forMembers").className = 'hidden';
    })
    //PROPOSALS ADDED PREVIIOUSLY
    let previousProposals = congress.LogProposalAdded({}, {fromBlock:startBlock});
    previousProposals.get(function(err, proposals) {
      if (err) return;
      for (let p=0; p<proposals.length; p++) {
        let proposalID = Number(proposals[p].args.proposalID);
        App.writeProposal(proposalID);
      }
    })
		//PROPOSALS FROM NOW ON
		let Ids = new Set();
		let newProposal = congress.LogProposalAdded({}, {fromBlock:'latest'});
		newProposal.watch(function(err, proposal) {
			if (err) return;
			let proposalID = Number(proposal.args.proposalID);
			if (Ids.has(proposalID)) return;
			else Ids.add(proposalID);
			App.writeProposal(proposalID);
		})
		//DONATION RECEIPTS
    congress.LogReceivedEther({}, function(err, res) {
      console.log(res.args);
    })
    congress.LogReceivedTokens({}, function(err, res) {
      console.log(res.args);
    })
    //WATCH FOR VOTES FOR ANY PROPOSAL FROM NOW ON FROM ANYWHERE
    congress.LogVoted({}, function(err, vote) {
      if (err) return err;
	    let proposalID = Number(vote.args.proposalID);
      let proposal_elements = document.getElementById(proposalID).getElementsByTagName("td");
      congress.proposals.call(proposalID, function(err, proposal) {
        if (err) return err;
				proposal_elements[4].innerHTML = proposal[6]; //number of votes
				if (proposal[6] >= minimum_quorum) proposal_elements[4].style.color = "green";
				proposal_elements[5].innerHTML = proposal[7];  //cumulative vote
				if (proposal[7] >= majority_margin) proposal_elements[5].style.color = "green";
		  	if (proposal[6] >= minimum_quorum && proposal[7] >= majority_margin && Date.now()/1e3 > proposal[3]) {
		  	  proposal_elements[6].innerHTML = "<button id='" + proposalID + "ep'>EXECUTE</button>";
          document.getElementById(proposalID + "ep").onclick = function() {
            congress.executeProposal(proposalID, App.get_bytecode(proposal[0], proposal[2]), {gas:1e6}, function(err, res) {
				      if (err) return err;
					    console.log("execution initated");
				  	  document.getElementById(proposalID + "ep").disabled = true;
			    	})
			  	}
				} else if (vote.args.voter === account) proposal_elements[6].innerHTML = "voted";
      })
    })
    congress.LogProposalTallied({}, function(err, proposal) {console.log(proposal.args.active);
      if (err) return err;
      let status;

      proposal.args.active ? status="proposal passed" : status="proposal failed";
      document.getElementById(proposal.args.proposalID).getElementsByTagName("td")[ 6].innerHTML = status; console.log(status);
      console.log("proposal votes tallied. Result: " + proposal.args);
    })
    congress.LogChangeOfRules(function(err, newrules) {
      if (err) return err;
      majority_margin = newrules.args.newMajorityMargin;
      minimum_quorum = newrules.args.newMinumumQuorum;
    })
  },
  donate: function() {
    let donation = document.getElementById("donate").value*1e18;
    if (document.getElementById("crypto_currency").value == "ETH") {
      web3.eth.sendTransaction({from:account, to:congress_addr, value:donation, gas:4e4},  function(err, res) {
        if (err) return err;
        console.log("ether donation initiated");
      })
    }
    if (document.getElementById("crypto_currency").value == "DAI") {;
      dai.transfer(congress_addr, donation, {from:account, gas:1e5},  function(err, res) {
        if (err) return err;
        console.log(donation/1e18 + "dai donation initiated");
      })
    }
  },
  new_proposal: function() {
    let proposal = document.getElementById("proposal_options").value;
    let transactionBytecode;
    let beneficiary;
    let weiAmount;
    let jobDescription;
    switch (proposal) {
      case "ETH":
        beneficiary = prompt("address beneficiary?");
        weiAmount = prompt("amount ether?")*1e18;
        jobDescription = prompt("job description?");
				break;
      case  "DAI":
				weiAmount=0;
        beneficiary = dai_token_addr; //dai token
        jobDescription = "send dai";
				break;
      case "ADD_MEMBER":
				beneficiary=congress_addr; //this contract
				weiAmount=0;
				jobDescription="add member";
				break;
      case "REMOVE_MEMBER":
				beneficiary=congress_addr; //this contract
				weiAmount=0;
				jobDescription="remove member";
				break;
      case "NEW_RULES":
        beneficiary=congress_addr; //this contract
        weiAmount=0;
        jobDescription="change voting rules";
    }
    congress.newProposal(beneficiary, weiAmount, jobDescription, App.get_bytecode(beneficiary, jobDescription), {gas:2e5}, function(err, res) {
      if (err) return err;
      console.log("new proposal initiated" + res);
    })
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
			//APPEND PROPOSAL
		  document.getElementById("activeProposals").append(_proposal);
		  (Number(proposal[6]) >= minimum_quorum) ? proposal_elements[4].style.color="green" : proposal_elements[4].style.color="red";
		  (Number(proposal[7]) >= majority_margin) ? proposal_elements[5].style.color="green" : proposal_elements[5].style.color="red";
			//IF CONDITIONS ALLOW EXECUTION write execute button
			if (Number(proposal[6]) >= minimum_quorum && Number(proposal[7]) >= majority_margin && Date.now() > proposal[3]*1e3) {
	      proposal_elements[6].innerHTML = "<button id='" + _proposal.id + "ep'>EXECUTE</button>";
	      document.getElementById(_proposal.id + "ep").onclick = function() {
	        congress.executeProposal(_proposal.id, App.get_bytecode(proposal[0], proposal[2]), {gas:1e6}, function(err, res ){
	        	if (err) return err;
	        	console.log("execution initiated");
	        	document.getElementById(_proposal.id + "ep").disabled = true;
					})
	      }
			} else { //SEE IF YOU VOTED
				let voted = congress.LogVoted({proposalID:proposalID, voter:account}, {fromBlock:startBlock});
			  voted.get(function(err, vote) {
			    if (err) return err;
			    if (vote.length === 0) { //you haven't voted so write vote buttons
		        if (proposal[1] > 0) { //ether transaction, write straight yes/no buttons
			        proposal_elements[6].innerHTML = "<button onclick = 'App.vote(" + _proposal.id + "," + true + ")' href='#'>YES</button><button onclick= 'App.vote(" + _proposal.id + "," + false + ")' href='#'>NO</button>";    //<input type='radio' name='vote' value='true'><label for='true'>YES</label><input type='radio' name='vote' value='false'><label for='false'>NO</label>"
		        } else  { //contract proposal interaction, write vote button to trigger bytecode check
			        proposal_elements[6].innerHTML = "<button id='" + _proposal.id + "cp'>VOTE</button>";
			        document.getElementById(_proposal.id + "cp").onclick = function() {
			          congress.checkProposalCode(_proposal.id, proposal[0], 0, App.get_bytecode(proposal[0], proposal[2]), function(err, code_checks) {
		              if (code_checks) {
				            proposal_elements[6].innerHTML = "<button onclick='App.vote(" + _proposal.id + "," + true + ")'>YES</button><button onclick='App.vote(" + _proposal.id + "," + false + ")'>NO</button>";
					  	      document.getElementById(proposalID ).disabled = true;
				          } else alert("proposal check returned false");
			          })
			        }
			      } //ELSE YOU HAVE VOTED so write execute button or "voted"
			  	} else 	proposal_elements[6].innerHTML = "voted";
				})
			}
		})
	},
  vote: function(proposalNumber,vote) {
    let _justificationText = "";
    congress.vote(proposalNumber, vote, _justificationText, {from:account, gas:1e5}, function(err, res) {
      if (err) return err;
    })
  },
  get_bytecode: function(contract_addr, job_description) {
    switch(contract_addr) {
      case dai_token_addr:
        return dai.transfer.getData(prompt("dai recipient"), prompt("amount $dai")*1e18);
        break;
      case congress_addr:
        switch(job_description) {
          case "change voting rules":
            return congress.changeVotingRules.getData(prompt("new minimum quorum?"), prompt("new minutes for debate?"), prompt("new majority margin?"));
	    break;
          case "add member":
            return congress.addMember.getData(prompt("new member address?"), prompt("name of new member?"));
	    break;
          case "remove member":
            return congress.removeMember.getData(prompt("address of member to be removed?"));
	    break;
        }
      default:
        return "";
    }
  },
},

window.addEventListener('load', async  function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (window.ethereum) {
    window.web3 = new Web3(ethereum);
    try {
      // Request account access if needed
      await ethereum.enable();
      console.log("using ethereum.enable. Acccounts now exposed");
    } catch (error) {
      console.log("access denied" + error);
    }
  }
  // Legacy dapp browsers...
  else if (window.web3) {
    window.web3 = new Web3(web3.currentProvider);
    console.log("legacy" + web3.eth.accounts + ".  Acccounts always exposed");
  }
  else  {
    console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
  }
  window.web3.version.getNetwork((err, netId) => {
    switch (netId) {
      case "1":
        console.log('This is mainnet')
        break
      case "3":
        console.log('This is the ropsten test network.')
        break
      case "4":
        console.log('This is the rinkeby test network.')
        break
      default:
        console.log('This is an unknown network.')
    }
  })
  congress = web3.eth.contract(congress_abi).at(congress_addr);
  dai = web3.eth.contract(dai_token_abi).at(dai_token_addr);
  App.start(web3.eth.accounts[0]);
  ethereum.on('accountsChanged', function (accounts) {
    App.start(web3.eth.accounts[0]);
  })
});
