import {default as Web3} from 'web3';
//var Web3 = require('web3');
require('../stylesheets/app.css');

const congress_abi = require('../../build/contracts/Congress.json').abi;
const congress_addr = '0x89b093C067Dce8B9286d557e5d6041b2021925C9';
const dai_token_addr = '0x9B555b5781Ed95E723F20dDc3B796B85c6106FdF';
const dai_token_abi = require('../../build/contracts/TokenERC20_min.json').abi;
let account;
let congress;
let dai;
var members = [];

window.App = {
  start: function(_account) {
    account = _account;
    congress.LogMembershipChanged({}, {fromBlock:0}, function(err, change) {
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
          congress.owner.call({from:account}, function(err, owner) {
 	    if (owner === account) {
	      document.getElementById("forOwner").className = 'shown';
	      console.log("you are owner");
	    }
          })
	}
      }
      else {
	if (change.args.isMember) {
	  members.push(change.args.member);
	  console.log("new member: " + change.args.member);
	}
	else if (!change.args.isMember)  {
          var i = members.indexOf(change.args.member);
          if(i != -1) {
	    members.splice(i, 1);
	  }
        }
      }
    })
    congress.LogProposalAdded({}, {fromBlock:0}, function(err, res) {
      if (err) return err;
      congress.proposals.call(res.args.proposalID, {from:account}, function(err, proposal) {
	if (err) return err;
        var _proposal = document.createElement("tr");
        _proposal.innerHTML = '<td align="right"></td><td align="right"></td><td align="right"></td><td align="right"></td><td align="right"></td><td align="right"></td><td align="right"></td>';
        _proposal.id = res.args.proposalID;
        var proposal_elements = _proposal.getElementsByTagName('td');
        if (proposal[4]) return;
        proposal_elements[0].innerHTML = res.args.proposalID;
        proposal_elements[1].innerHTML = proposal[0]; //recipient
        proposal_elements[2].innerHTML = proposal[1]; //amount
        proposal_elements[3].innerHTML = proposal[2]; //description
        proposal_elements[4].innerHTML = Number(proposal[6]); //number votes
	proposal_elements[5].innerHTML = Number(proposal[7]); //progressive vote
	var voted = congress.LogVoted({proposalID:_proposal.id ,voter:account}, {fromBlock:res.blockNumber, from:account});
	voted.get(function(err, res) {
	  if (err) return err;
	  if (res.length === 0) proposal_elements[6].innerHTML = "<button onclick= 'App.vote(" + _proposal.id + ")' href='#'>VOTE</button><input type='radio' name='vote' value='true'><label for='true'>YES</label><input type='radio' name='vote' value='false'><label for='false'>NO</label><input id='justification' placeholder='justificationText'>";
       	  else  proposal_elements[6].innerHTML = "you have voted";
	})
	document.getElementById("activeProposals").append(_proposal);
        congress.LogVoted({proposalID:_proposal.id}, {from:account}, function(err, vote) {
          if (err) return err;
       	  var number_votes = proposal[6];
          number_votes++;
	  proposal_elements[4].innerHTML = number_votes;
  	  var progressive_vote = Number(proposal_elements[5].innerHTML);
          if (vote.args.position) progressive_vote++;
          else if (!vote.args.position) progressive_vote--;
	  proposal_elements[5].innerHTML = progressive_vote;
          if (vote.args.voter == account) proposal_elements[6].innerHTML = "you have voted"; 
        })
      })
    })
    congress.LogProposalTallied({fromBlock:0}, function(err, proposal) {
      if (err) return err;
      console.log("proposal votes tallied. Result: " + proposal.args);
    })
    var changeOfRules = congress.LogChangeOfRules();
    changeOfRules.watch(function(err, newrules) {
      if (err) return err;
      changeOfRules.stopWatching();
      console.log(newrules.args); //write latest rules
    })
  },
  donate: function() {
    var donation = document.getElementById("donate").value*1e18;
    if (document.getElementById("crypto_currency").value == "ETH") {
      web3.eth.sendTransaction({from:account, to:congress_addr, value:donation}, function(err, res) {
        if (err) return err;
        console.log("ether donation successfull!");
      })
    }
    if (document.getElementById("crypto_currency").value == "DAI") {;
      dai.approveAndCall(congress_addr, donation, '0x', {from:account}, function(err, res) {
        if (err) return err;
        console.log(donation/1e18 + "dai donation successfull!");
      })
    }
  },
  add_member: function() {
    var newMember = document.getElementById("newMemberAddress").value;
    var name = document.getElementById("newMemberName").value;
    congress.addMember(newMember, name, {from:account}, function(err, res) {
      if (err) return err;
      console.log("member added");
    })
  },
  remove_member: function() {
    var exmember = document.getElementById("removeMember").value;
    congress.removeMember(exmember, {from:account}, function(err, res) {
      if (err) return err;
      console.log('member removed');
    })
  },
  change_voting_rules: function() {
    var minQuorum = document.getElementById("minQuorum").value;
    var minutesForDebate = document.getElementById("minutesForDebate").value;
    var majorityMargin = document.getElementById("majorityMargin").value;
    congress.changeVotingRules(minQuorum, minutesForDebate, majorityMargin, {from:account}, function(err, newrules) {
      if (err) return err;
      console.log("success!");
    })
  },
  change_ownership: function() {
    var new_owner = document.getElementById("newOwner").value;
    congress.transferOwnership(new_owner, {from:account}, function(err, res) {
      if (err) return err;
      console.log("ownership changed to " + new_owner);
    })
  },
  new_proposal: function() {
    var beneficiary = document.getElementById("beneficiary").value;
    var jobDescription = document.getElementById("jobDescription").value;
    var weiAmount = 0;
    var transactionBytecode = '';
    if (document.getElementById("crypto_curr").value == "ETH") {
      weiAmount = document.getElementById("Amount").value*1e18;
    } else if (document.getElementById("crypto_curr").value == "DAI") {
      var daiAmount = document.getElementById("Amount").value*1e18;
      transactionBytecode = dai.transfer.getData(beneficiary, daiAmount);
      beneficiary = dai_token_addr;
    }
    congress.newProposal(beneficiary, weiAmount, jobDescription, transactionBytecode, {from:account, gas:1e6}, function(err, res) {
      if (err) return err;
      console.log("new proposal " + res);
    })
  },
  supportsProposal: function() {
    if (document.querySelector('input[name="vote"]:checked').value == "false") return false;
    else return true;
  },
  vote: function(proposalNumber) {
    var _justificationText = document.getElementById("justificationText").value;
    congress.vote(proposalNumber, this.supportsProposal(), _justificationText, {from:account}, function(err, res) {
      if (err) return err;
    })
  },
  check_proposal: function() {
    var proposalNumber = document.getElementById("proposalNumber1").value;
    var beneficiary = document.getElementById("beneficiary1").value;
    var daiAmount = document.getElementById("amount1").value*1e18;
    var bytecode = dai.transfer.getData(beneficiary, daiAmount);
    document.getElementById("bytecode2").innerHTML = bytecode;
    beneficiary = dai_token_addr;
    congress.checkProposalCode(proposalNumber, beneficiary, 0, bytecode, {from:account}, function(err, res) {
      if (err) return err;
      console.log(res);
    })
  },
  execute_proposal: function() {
    var  _proposalNumber = document.getElementById("proposalNumber2").value;
    var _transactionBytecode = document.getElementById("bytecode1").value;
    congress.executeProposal(_proposalNumber, _transactionBytecode, {from:account, gas:1e6}, function(err, res) {
      if (err) return err;
      console.log("proposal executed!" + dai.balanceOf(congress_addr));
    })
  },
},

window.addEventListener('load', async function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (window.ethereum) {
    window.web3 = new Web3(ethereum);
    try {
      // Request account access if needed
      await ethereum.enable();
      console.log("using ethereum.enable" + web3.eth.accounts + ".  Acccounts now exposed");
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
   window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
   console.log("localhost:8545");
  }
    // Non-dapp browsers...
  /*else {
    console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
  }
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn("No web3 detected. Falling back to http://localhost:8545.");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  }*/
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
  /*document.getElementById("crypto_curr").onchange = function() {console.log(this.value);
    if (this.value == "ETH") {
      document.getElementById("daiAmount").className = "hidden";
      document.getElementById("ethAmount").className = "shown";
    } else if (this.value == "DAI") {
      document.getElementById("daiAmount").className = "shown";
      document.getElementById("ethAmount").className = "hidden";
    }
  }*/
  congress = web3.eth.contract(congress_abi).at(congress_addr);
  dai = web3.eth.contract(dai_token_abi).at(dai_token_addr);
  App.start(web3.eth.accounts[0]);
});
