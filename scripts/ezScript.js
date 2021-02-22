const { ethers } = require("hardhat");

async function main() {
    let JST = await ethers.getContractFactory("JST");
    let jstToken = await JST.deploy(ethers.utils.parseUnits("100000", 18));
    await jstToken.deployed();
    console.log(jstToken.address);
    let StakBank = await ethers.getContractFactory("StakBank");
    let stakBank = await StakBank.deploy(jstToken.address);
    await stakBank.deployed();
    console.log(stakBank.address);
}

main()
.then(() => process.exit(0))
.catch((err) => {
    console.log(err);
    process.exit(1);
});