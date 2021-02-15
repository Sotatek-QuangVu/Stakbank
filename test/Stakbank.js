const { expect } = require("chai");
const { run } = require("hardhat");
const hardhat = require("hardhat");
const ethers = hardhat.ethers;
const { provider, BigNumber, Signer, VoidSigner, Wallet } = ethers;

describe("Stakbank contract", function() {
    const eth = BigNumber.from("1000000000000000000");
    let Stakbank;
    let JSTCoin;
    let owner, address1, address2, address3;
    let addresses;
    let time = 120;

    before(async function() {
        [owner, address1, address2, address3, ...addresses] = await ethers.getSigners();

        let JSTCoinFact = await ethers.getContractFactory("JSTCoinTest1");
        JSTCoin = await JSTCoinFact.deploy(1000);

        let StakbankFact = await ethers.getContractFactory("StakbankTest1");
        Stakbank = await StakbankFact.deploy(JSTCoin.address);

        await JSTCoin.verifyStakbank(Stakbank.address);
    });

    
    describe("Owner test", function() {
        it("Should set to the right owner", async function() {
            expect(await JSTCoin.owner()).to.equal(owner.address);
        });

        it("Should JSTCoin and Stakbank have the same owner", async function() {
            expect(await JSTCoin.owner()).to.equal(await Stakbank.owner());
        });
    });

    describe("Transfer JST to EOA", function() {
        it("Should owner decrease 100 JSTCoin", async function() {
            await JSTCoin.transfer(address1.address, 90);
            await JSTCoin.transfer(address2.address, 10);
            expect(await JSTCoin.balanceOf(owner.address)).to.equal(1000 - 100);
        });

        it("Should address1 increase 90 JSTCoin", async function() {
            expect(await JSTCoin.balanceOf(address1.address)).to.equal(90);
        });

        it("Should address2 increase 10 JSTCoin", async function() {
            expect(await JSTCoin.balanceOf(address2.address)).to.equal(10);
        });
    });

    describe("Test draw in paper", function() {
        it("Should 2 user stake coin", async function() {
            // money to reward
            await address3.sendTransaction({
                to: Stakbank.address,
                value: 2000
            });

            await (await Stakbank.connect(address1)).stake(90);
            await (await Stakbank.connect(address2)).stake(10);
            expect(await Stakbank.stakingOf(address1.address)).to.equal(90);
            expect(await Stakbank.stakingOf(address2.address)).to.equal(10);
        });

        it("Should t1 - no user get reward", async function(done) {
            let xTime = await Stakbank.fromLastDis();
            let waitTime = (xTime >= 120 ? 0 : (120 - xTime) * 1000);
            let add1Before = await provider.getBalance(address1.address);
            let add2Before = await provider.getBalance(address2.address);
            console.log(waitTime);
            setTimeout(async function() {
                await Stakbank.rewardDistribution();
                await (await Stakbank.connect(address1)).withdrawReward();
                await (await Stakbank.connect(address2)).withdrawReward();
                let add1After = await provider.getBalance(address1.address);
                let add2After = await provider.getBalance(address2.address);

                console.log('add1Before: ' + add1Before.toString());
                console.log('add1After:  ' + add1After.toString());
                console.log('add2Before: ' + add2Before.toString());
                console.log('add2After:  ' + add2After.toString());
                done();
            }, waitTime);
        });

        // this.slow(5000);
        // it("t1", function(done) {
        //     setTimeout(function() {
        //         console.log("hello world");
        //         done();
        //     }, 5000);
        // })
        // it('should be complete instantly', function() {});
    });

    
   
});