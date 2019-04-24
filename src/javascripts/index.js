import {default as Web3} from 'web3';
//var Web3 = require('web3');
require('../stylesheets/app.css');

const congress_abi = require('../../build/contracts/Congress.json').abi;
const congress_addr = '0x47752CFc94765150A2dccc7a71B06890ACc03D49';
const dai_token_addr = '0xE346ab923aD7ec6D606E700802669B802Ef8469c';
const dai_token_abi = require('../../build/contracts/TokenERC20_min.json').abi;
let account;
let congress;
let dai;
var members = [];

window.App = {
  start: function(_account) {
    account = _account;
    //var self = this;
    congress.LogMembershipChanged({}, {fromBlock:0}, function(err, change) {
      if (err) return err;
      if (change.args.member === account) {
	if (change.args.isMember === false) {
          document.getElementById("forMembers").className = 'hidden';
          console.log("your membership has been revoked");
	  return;
	} else if (change.args.isMember === true) {
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
	if (change.args.isMember === true) {
	  members.push(change.args.member);
	  console.log("new member: " + change.args.member);
	}
	else if (change.args.isMember === false)  {
          var i = members.indexOf(change.args.member);
          if(i != -1) {
	    members.splice(i, 1);
	  }
        }
      }
    })
    congress.LogProposalAdded({fromBlock:0}, function(err, res) {
      if (err) return err;
      console.log("new proposal added " + res);
    })
    congress.LogProposalTallied({fromBlock:0}, function(err, proposal) {
      if (err) return err;
      console.log("proposal votes tallied. Result: " + proposal.args);
    })
    congress.LogVoted({fromBlock:0}, function(err, res) {
      if (err) return err;
      console.log("member voted! " + res); //uint indexed proposalID, bool position, address voter, string justification)
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
    var _beneficiary = document.getElementById("beneficiary").value;
    var _weiAmount = document.getElementById("amount").value*1e18;
    var _jobDescription = document.getElementById("jobDescription").value;
    var _transactionBytecode = document.getElementById("bytecode").value;
    congress.newProposal(_beneficiary, _weiAmount, _jobDescription, _transactionBytecode, {from:account, gas:1e6}, function(err, res) {
      if (err) return err;
      //console.log("new proposal " + res.args.proposalID);
    })
  },
  vote: function() {
    var _proposalNumber = document.getElementById("proposalNumber").value;
    var _supportsProposal = document.getElementById("supportsProposal").value;
    var _justificationText = document.getElementById("justificationText").value;
    congress.vote(_proposalNumber, _supportsProposal, _justificationText, {from:account}, function(err, res) {
      if (err) return err,
      console.log(res.args);
    })
  },
  execute_proposal: function() {
    var  _proposalNumber = document.getElementById("proposalNumber2").value;
    var _transactionBytecode = document.getElementById("bytecode1").value;
    congress.executeProposal(_proposalNumber, _transactionBytecode, {from:account}, function(err, res) {
      if (err) return err;
      console.log("proposal executed!");
    })
  },
  proposals: function() {
    var proposalNumber = document.getElementById("proposalNumber3").value;
    console.log(proposalNumber);
    var proposal = congress.proposals.call(proposalNumber, {from:account});
    console.log(proposal);
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
  congress = web3.eth.contract(congress_abi).at(congress_addr);
  dai = web3.eth.contract(dai_token_abi).at(dai_token_addr);
  console.log(congress.address, dai.address);
  App.start(web3.eth.accounts[0]);
});
