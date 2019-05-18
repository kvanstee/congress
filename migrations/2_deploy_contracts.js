const Congress = artifacts.require("./Congress.sol");
//const TokenERC20_min = artifacts.require("./tokenERC20_min.sol");

module.exports = async function(deployer) {
  await deployer.deploy(Congress, 2, 5, 1);
};

