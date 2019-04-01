const Congress = artifacts.require("./Congress.sol");

module.exports = async function(deployer) {
  await deployer.deploy(Congress, 2, 5, 1);
};

