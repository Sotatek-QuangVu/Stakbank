require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.7.3",
  networks: {
    hardhat: {
    },
    ropsten: {
      url: "https://ropsten.infura.io/v3/3345e1dbef234ad78bbc6a38d5585c6d",
      accounts: [
        "836f8208ae68761fd90bc51f8bc41083d60a486b1848007817a84495cc8d9689"
      ]
    }
  },
  defaultNetwork: "hardhat",
  mocha: {
    timeout: 120001
  },
  etherscan: {
    apiKey: 'FM1VSV1IS2J5NZMIQIYC288K9M51ZPFQ5A'
  }
};
