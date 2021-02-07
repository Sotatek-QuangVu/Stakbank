const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`deploying with the account ${deployer.address}...`);

    const balance = await deployer.getBalance();
    console.log(`balance of deployer: ${balance.toString()}`);

    const Bank = await ethers.getContractFactory('StakbankTest0');
    const Stakbank = await Bank.deploy(50000000000);
    console.log(`my contract address: ${Stakbank.address}`);
}

main()
.then(() => process.exit(0))
.catch((err) => {
    console.log(err);
    process.exit(1);
});