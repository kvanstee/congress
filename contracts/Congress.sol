pragma solidity >=0.4.22 <0.6.0;

contract owned {
    address public owner;
    constructor()  public {
        owner = msg.sender;
    }
    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }
    function transferOwnership(address newOwner) onlyOwner  public {
        owner = newOwner;
    }
}
contract tokenRecipient {
    event LogReceivedEther(address sender, uint amount);
    event LogReceivedTokens(address _from, uint256 _value, address _token, bytes _extraData);
    function receiveApproval(address _from, uint256 _value, address _token, bytes memory _extraData) public {
        Token t = Token(_token);
        require(t.transferFrom(_from, address(this), _value));
        emit LogReceivedTokens(_from, _value, _token, _extraData);
    }
    function () payable  external {
        emit LogReceivedEther(msg.sender, msg.value);
    }
}
interface Token {
    function transferFrom(address _from, address _to, uint256 _value) external returns (bool success);
}
contract Congress is owned, tokenRecipient {
    uint public minimumQuorum;
    uint public debatingPeriodInMinutes;
    int public majorityMargin;
    Proposal[] public proposals;
    uint public numProposals;
    mapping (address => Member) public members;

    /**events**/
    event LogProposalAdded(uint proposalID, address recipient, uint amount, string description, uint numProposals);
    event LogVoted(uint indexed proposalID, bool position, address indexed voter, string justification);
    event LogProposalTallied(uint indexed proposalID, int result, uint quorum, bool indexed active);
    event LogMembershipChanged(address indexed member, bool indexed isMember);
    event LogChangeOfRules(uint newMinimumQuorum, uint newDebatingPeriodInMinutes, int newMajorityMargin);

    /**proposal**/
    struct Proposal {
        address recipient;
        uint amount;
        string description;
        uint minExecutionDate;
        bool executed;
        bool proposalPassed;
        uint numberOfVotes;
        int currentResult;
        bytes32 proposalHash;
        //Vote[] votes;
        mapping (address => bool) voted;
    }
    struct Member {
	bool isMember;
        string name;
        uint memberSince;
    }
    struct Vote {
        bool inSupport;
        address voter;
        string justification;
    }
    modifier onlyMembers {
        require(members[msg.sender].isMember == true);
        _;
    }

    /**constructor**/
    constructor (
        uint minimumQuorumForProposals,
        uint minutesForDebate,
        int marginOfVotesForMajority
    )  payable public {
        changeVotingRules(minimumQuorumForProposals, minutesForDebate, marginOfVotesForMajority);
        addMember(owner, 'Keith Van Steenwyk');
    }
    function addMember(address targetMember, string memory memberName) onlyOwner public {
	require(members[targetMember].isMember == false);
        members[targetMember] = Member({isMember: true, memberSince: now, name: memberName});
        emit LogMembershipChanged(targetMember, true);
    }

    function removeMember(address targetMember) onlyOwner public {
        require(members[targetMember].isMember == true);
	members[targetMember].isMember == false;
	emit LogMembershipChanged(targetMember, false);
    }
    /**
     * Change voting rules
     * Make so that proposals need to be discussed for at least `minutesForDebate/60` hours,
     * have at least `minimumQuorumForProposals` votes, and have 50% + `marginOfVotesForMajority` votes to be executed
     * @param minimumQuorumForProposals how many members must vote on a proposal for it to be executed
     * @param minutesForDebate the minimum amount of delay between when a proposal is made and when it can be executed
     * @param marginOfVotesForMajority the proposal needs to have 50% plus this number
     */
    function changeVotingRules(
        uint minimumQuorumForProposals,
        uint minutesForDebate,
        int marginOfVotesForMajority
    ) onlyOwner public {
        minimumQuorum = minimumQuorumForProposals;
        debatingPeriodInMinutes = minutesForDebate;
        majorityMargin = marginOfVotesForMajority;
        emit LogChangeOfRules(minimumQuorum, debatingPeriodInMinutes, majorityMargin);
    }
    /**
     * Add Proposal
     * Propose to send `weiAmount / 1e18` ether to `beneficiary` for `jobDescription`. `transactionBytecode ? Contains : Does not contain` code.
     * @param beneficiary who to send the ether to
     * @param weiAmount amount of ether to send, in wei
     * @param jobDescription Description of job
     * @param transactionBytecode bytecode of transaction
     */
    function newProposal(
        address beneficiary,
        uint weiAmount,
        string memory jobDescription,
        bytes memory transactionBytecode
    )
        onlyMembers public
        returns (uint proposalID)
    {
        proposalID = proposals.length++;
        Proposal storage p = proposals[proposalID];
        p.recipient = beneficiary;
        p.amount = weiAmount;
        p.description = jobDescription;
        p.proposalHash = keccak256(abi.encodePacked(beneficiary, weiAmount, transactionBytecode));
        p.minExecutionDate = now + debatingPeriodInMinutes * 1 minutes;
        p.executed = false;
        p.proposalPassed = false;
        p.numberOfVotes = 0;
        emit LogProposalAdded(proposalID, beneficiary, weiAmount, jobDescription, proposals.length);
	numProposals = proposalID+1;
        return proposalID;
    }
    /**
     * Check if a proposal code matches
     * @param proposalNumber ID number of the proposal to query
     * @param beneficiary who to send the ether to
     * @param weiAmount amount of ether to send
     * @param transactionBytecode bytecode of transaction
     */
    function checkProposalCode(
        uint proposalNumber,
        address beneficiary,
        uint weiAmount,
        bytes memory transactionBytecode
    )
        view public
        returns (bool codeChecksOut)
    {
        Proposal storage p = proposals[proposalNumber];
        return p.proposalHash == keccak256(abi.encodePacked(beneficiary, weiAmount, transactionBytecode));
    }
    /**
     * Log a vote for a proposal
     * Vote `supportsProposal? in support of : against` proposal #`proposalNumber`
     * @param proposalNumber number of proposal
     * @param supportsProposal either in favor or against it
     * @param justificationText optional justification text
     */
    function vote(
        uint proposalNumber,
        bool supportsProposal,
        string memory justificationText
    )
        onlyMembers public
        returns (uint voteID)
    {
        Proposal storage p = proposals[proposalNumber]; // Get the proposal
        require(!p.voted[msg.sender]);                  // If has already voted, cancel
        p.voted[msg.sender] = true;                     // Set this voter as having voted
        p.numberOfVotes++;                              // Increase the number of votes
        if (supportsProposal) {                         // If they support the proposal
            p.currentResult++;                          // Increase score
        } else {                                        // If they don't
            p.currentResult--;                          // Decrease the score
        }
        emit LogVoted(proposalNumber,  supportsProposal, msg.sender, justificationText);
        return p.numberOfVotes;
    }
    /**
     * Finish vote
     *
     * Count the votes proposal #`proposalNumber` and execute it if approved
     *
     * @param proposalNumber proposal number
     * @param transactionBytecode optional: if the transaction contained a bytecode, you need to send it
     */
    function executeProposal(uint proposalNumber, bytes memory transactionBytecode) public payable {
        Proposal storage p = proposals[proposalNumber];
        require(now > p.minExecutionDate  
            && !p.executed
            && p.proposalHash == keccak256(abi.encodePacked(p.recipient, p.amount, transactionBytecode))
            && p.numberOfVotes >= minimumQuorum);
        if (p.currentResult > majorityMargin) {
            /** Proposal passed; execute the transaction **/
            p.executed = true; // Avoid recursive calling
            (bool success, ) = p.recipient.call.value(p.amount)(transactionBytecode);
            require(success);
            p.proposalPassed = true;
        } else {
            /** Proposal failed **/
            p.proposalPassed = false;
        }
        emit LogProposalTallied(proposalNumber, p.currentResult, p.numberOfVotes, p.proposalPassed);
    }
}
