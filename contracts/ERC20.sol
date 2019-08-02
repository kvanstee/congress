pragma solidity >=0.4.22 <0.6.0;

contract ERC20 {
	event  Deposit(address indexed dst, uint wad);
  event  Withdrawal(address indexed src, uint wad);
  event Approval(address indexed src, address indexed guy, uint wad);
  event Transfer(address indexed src, address indexed dst, uint wad);
  function balanceOf(address guy) public view returns (uint);
  function approve(address guy, uint wad) public returns (bool);
  function transfer(address dst, uint wad) public returns (bool);
  //function transferFrom(address src, address dst, uint wad) public returns (bool);
	function deposit() public payable;
	function withdraw(uint wad) public;
}
