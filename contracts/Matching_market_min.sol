/// matching_market.sol

pragma solidity ^0.5.0;

import "./ERC20.sol";

contract MatchingMarket {
  event LogTrade(
		uint pay_amt,
		address indexed pay_gem, 
		uint buy_amt, 
		address indexed buy_gem
	);
	event LogTake(
    bytes32           id,
    bytes32  indexed  pair,
    address  indexed  maker,
    ERC20             pay_gem,
    ERC20             buy_gem,
    address  indexed  taker,
    uint128           take_amt,
    uint128           give_amt,
    uint64            timestamp
  );
  function sellAllAmount(ERC20 pay_gem, uint pay_amt, ERC20 buy_gem, uint min_fill_amount)
    public
    returns (uint fill_amt);

  function buyAllAmount(ERC20 buy_gem, uint buy_amt, ERC20 pay_gem, uint max_fill_amount)
    public
    returns (uint fill_amt);
}
