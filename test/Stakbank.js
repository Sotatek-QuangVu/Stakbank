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

describe("Stakbank contract", function() {
    const eth = BigNumber.from("1000000000000000000");
    let Stakbank;
    let JSTCoin;
    let owner, address1, address2, address3, address4, moneyAddress;
    let addresses;
    let miliTime = 60000;
    let feePerCoin = 100;

    before(async function() {
        [owner, address1, address2, address3, address4, moneyAddress, ...addresses] = await ethers.getSigners();
        let JSTCoinFact = await ethers.getContractFactory("JSTCoinTest2");
        JSTCoin = await JSTCoinFact.deploy(1000);
        let StakbankFact = await ethers.getContractFactory("StakbankTest2");
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

    describe("Set up JST token", function() {
        it("Should user1, 2, 3 get the JST token", async function() {
            await JSTCoin.transfer(address1.address, 200);
            await JSTCoin.transfer(address2.address, 200);
            await JSTCoin.transfer(address3.address, 200);
            await JSTCoin.transfer(address4.address, 200);
            expect(await JSTCoin.balanceOf(address1.address)).to.equal(200);
            expect(await JSTCoin.balanceOf(address2.address)).to.equal(200);
            expect(await JSTCoin.balanceOf(address3.address)).to.equal(200);
            expect(await JSTCoin.balanceOf(address4.address)).to.equal(200);
        });
    });

    async function balance(arr) {
        let ret = [];
        for (let i = 0; i < arr.length; i++) {
            let obj = arr[i];
            let balance = await provider.getBalance(obj.address);
            ret.push(balance);
        }
        return ret;
    }    

    describe("timeline1", function() {
        it("Should user2 stake 50 after user1 stake 10 => 20s && Should owner increase balance and user1, 2 decrease", async function() {
            let feeUser1 = 10 * feePerCoin;
            let feeUser2 = 50 * feePerCoin;
            let before = [], after = [];
            before = await balance([owner, address1, address2]);
            await (await Stakbank.connect(address1)).stake(10, {value: feeUser1});
            Delay(20*1000);
            await (await Stakbank.connect(address2)).stake(50, {value: feeUser2});
            after = await balance([owner, address1, address2]);
            console.log('Balance user1 increase: ' + (after[1].sub(before[1])));            
            console.log('Balance user2 increase: ' + (after[2].sub(before[2])));
            expect(await Stakbank.stakingOf(address1.address)).to.equal(10);
            expect(await Stakbank.stakingOf(address2.address)).to.equal(50);
        });
        
        it("Should moneyaddress transfer money to the Stakbank", async function() {
            let before = [];
            before = await balance([Stakbank]);
            await address3.sendTransaction({
                to: Stakbank.address,
                value: eth.mul(60)
            });
            let after = [];
            after = await balance([Stakbank]);
            expect(after[0].sub(before[0])).to.equal(eth.mul(60));
        });

        it("Should distribute t1", async function() {
            let before = [], after = [];
            before = await balance([address1, address2]);
            let countdown = await Stakbank.nextDistribution();
            Delay(countdown * 1000);
            await Stakbank.rewardDistribution();
            await (await Stakbank.connect(address1)).withdrawReward();
            await (await Stakbank.connect(address2)).withdrawReward();
            after = await balance([address1, address2]);
        });
        
        it("Should user1-30coin 5s user2-10coin 5s user3-60coin", async function() {
            await moneyAddress.sendTransaction({
                to: Stakbank.address,
                value: eth.mul(100)
            });
            let before = [];
            before = await balance([owner]);
            await (await Stakbank.connect(address1)).stake(30, {value: 30 * feePerCoin});
            Delay(5000);
            await (await Stakbank.connect(address2)).stake(10, {value: 10 * feePerCoin});
            Delay(5000);
            await (await Stakbank.connect(address3)).stake(60, {value: 60 * feePerCoin});
            expect(await Stakbank.stakingOf(address1.address)).to.equal(40);
            expect(await Stakbank.stakingOf(address2.address)).to.equal(60);
            expect(await Stakbank.stakingOf(address3.address)).to.equal(60);
            let after = [];
            after = await balance([owner]);
            expect(after[0].sub(before[0])).to.equal((30 + 10 + 60) * feePerCoin);
        });

        it("Shoud distribute t2", async function() {
            let before = [];
            before = await balance([address1, address2, address3]);
            let countdown = await Stakbank.nextDistribution();
            Delay(countdown * 1000);
            await Stakbank.rewardDistribution();
            let after = [];
            after = await balance([address1, address2, address3]);
            // await (await Stakbank.connect(address1)).withdrawReward();
            // await (await Stakbank.connect(address2)).withdrawReward();
            // await (await Stakbank.connect(address3)).withdrawReward();
        });

        it("Should user4-stake-unstake && user1-rut1 && user2-rut0", async function() {
            let before = []
            before = await balance([owner]);
            await (await Stakbank.connect(address4)).stake(20, {value: 20 * feePerCoin});
            let after = [];
            after = await balance([owner]);
            expect(after[0].sub(before[0])).to.equal(20 * feePerCoin);
            await (await Stakbank.connect(address4)).unstakeAll();
            await (await Stakbank.connect(address1)).unstakeWithId(2);
            await (await Stakbank.connect(address2)).unstakeWithId(1);
            expect(await Stakbank.stakingOf(address1.address)).to.equal(10);
            expect(await Stakbank.stakingOf(address2.address)).to.equal(10);
        });

        it("Shoud t3 distribute", async function() {
            await moneyAddress.sendTransaction({
                to: Stakbank.address,
                value: eth.mul(80)
            });
            let before = [];
            before = balance([address1, address2, address3, address4]);
            let countdown = await Stakbank.nextDistribution();
            Delay(countdown * 1000);
            await Stakbank.rewardDistribution();
            await (await (Stakbank.connect(address1))).unstakeAll();
            await (await (Stakbank.connect(address2))).unstakeAll();
            await (await (Stakbank.connect(address3))).unstakeAll();
            let after = [];
            after = await balance([address1, address2, address3, address4]);
        });
    });


});



