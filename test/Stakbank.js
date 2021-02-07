const { expect } = require("chai");
const { ethers } = require("ethers");


describe("Stakbank contract", function() {
    let Stakbank;
    let owner;
    let address1;
    let address2;
    let addresses;

    before(async function() {
        let Bank = await ethers.getContractFactory('StakbankTest0');
        [owner, address1, address2, ...addresses] = await ethers.getSigners();
        Stakbank = await Bank.deploy(1000);
    });

    describe("")

})