const { expect } = require("chai");
const hardhat = require("hardhat");
const ethers = hardhat.ethers;
const { provider, BigNumber, Signer } = ethers;

function Delay(mili) {
    let start = new Date().getTime();
    while(true) {
        if (new Date().getTime() - start >= mili) break;
    }
}

describe("Oldversion Stakbank contract", function() {
    const eth = BigNumber.from("1000000000000000000");
    let Stakbank;
    let JSTCoin;
    let owner, address1, address2, address3, address4, moneyAddress;
    let addresses;
    let miliTime = 60000;
    let feePerCoin = 100;

    before(async function() {
        [owner, address1, address2, address3, address4, moneyAddress, ...addresses] = await ethers.getSigners();
        let JSTCoinFact = await ethers.getContractFactory("JST");
        JSTCoin = await JSTCoinFact.deploy(1000);
        let StakbankFact = await ethers.getContractFactory("StakBank");
        Stakbank = await StakbankFact.deploy(JSTCoin.address);
        await JSTCoin.verifyStakbank(Stakbank.address);
        console.log(`owner: ${owner.address} | address1: ${address1.address} | address2: ${address2.address} | address3: ${address3.address}`);
    });
    
    describe("Owner test", function() {
        it("Should set to the right owner", async function() {
            expect(await JSTCoin.owner()).to.equal(owner.address);
        });

        it("Should JSTCoin and Stakbank have the same owner", async function() {
            expect(await JSTCoin.owner()).to.equal(await Stakbank.owner());
        });
    });
});