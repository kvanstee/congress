pragma solidity >=0.4.22 <0.6.0;

contract ERC20 {
	event  Deposit(address indexed dst, uint wad);
  event  Withdrawal(address indexed src, uint wad);
  event Approval(address indexed src, address indexed guy, uint wad);
  event Transfer(address indexed src, address indexed dst, uint wad);
	function balanceOf(address guy) public returns (uint); //mapping (address => uint256) public balanceOf;
  function allowance(address guy, address wad) public returns (uint); //mapping (address => mapping (address => uint256)) public allowance;  
  function approve(address guy, uint wad) public returns (bool);
  function transfer(address dst, uint wad) public returns (bool);
	function deposit() public payable;
	function withdraw(uint wad) public;
}
