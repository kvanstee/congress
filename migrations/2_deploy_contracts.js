var Congress = artifacts.require("./Congress.sol");

module.exports = function(deployer) {
  deployer.deploy(Congress, 2, 5, 1);
};

