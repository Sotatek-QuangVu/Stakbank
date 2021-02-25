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
    const e18 = BigNumber.from("1000000000000000000");
    let stakBank;
    let jstToken;
    let owner, address1, address2, address3, address4, moneyAddress, addresses;
    let periodTime;
    let feeUnitPercent;
    let minAmountToStake;

    before(async function() {
        [owner, address1, address2, address3, address4, moneyAddress, ...addresses] = await ethers.getSigners();
        let JST = await ethers.getContractFactory("JST");
        jstToken = await JST.deploy(ethers.utils.parseUnits("100", 18));
        let StakBank = await ethers.getContractFactory("StakBank");
        stakBank = await StakBank.deploy(jstToken.address);
        console.log(`owner: ${owner.address} | address1: ${address1.address} | address2: ${address2.address} | address3: ${address3.address}`);
        periodTime = await stakBank.periodTime();
        feeUnitPercent = await stakBank.feeUnitPercent();
        minAmountToStake = await stakBank.minAmountToStake();
    });
    
    describe("Owner test and Authorize stakBank", function() {
        it("Should set to the right owner", async function() {
            expect(await jstToken.owner()).to.equal(owner.address);
        });

        it("Should jstToken and stakBank have the same owner", async function() {
            expect(await jstToken.owner()).to.equal(await stakBank.owner());
        });

    });

    describe("Setup JST", function() {
        it("Should user1, 2, 3, 4 get JST", async function() {
            await jstToken.transfer(address1.address, e18.mul(10));
            await jstToken.transfer(address2.address, e18.mul(10));
            await jstToken.transfer(address3.address, e18.mul(10));
            await jstToken.transfer(address4.address, e18.mul(10));
            expect(await jstToken.balanceOf(address1.address)).to.equal(e18.mul(10));
            expect(await jstToken.balanceOf(address2.address)).to.equal(e18.mul(10));
            expect(await jstToken.balanceOf(address3.address)).to.equal(e18.mul(10));
            expect(await jstToken.balanceOf(address4.address)).to.equal(e18.mul(10));
        });

        it("Should setup allowance", async function() {
            await (await jstToken.connect(address1)).approve(stakBank.address, e18.mul(10));
            await (await jstToken.connect(address2)).approve(stakBank.address, e18.mul(10));
            await (await jstToken.connect(address3)).approve(stakBank.address, e18.mul(10));
            await (await jstToken.connect(address4)).approve(stakBank.address, e18.mul(10));        
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

    function calcFee(amount) {
        return (amount * feeUnitPercent) / 100;
    }

    describe("timeline1", function() {
        it("Should user2 stake 60000 after user1 stake 10000 => 20s", async function() {
            await (await stakBank.connect(address1)).stake(10000, {value: calcFee(10000)});
            Delay(20*1000);
            await (await stakBank.connect(address2)).stake(60000, {value: calcFee(60000)});

            expect(await stakBank.stakingOf(address1.address)).to.equal(10000);
            expect(await stakBank.stakingOf(address2.address)).to.equal(60000);
        });
        
        it("Should distribute t1", async function() {
            let before = [];
            before = await balance([stakBank]);

            await address3.sendTransaction({
                to: stakBank.address,
                value: e18.mul(60)
            });

            let after = [];
            after = await balance([stakBank]);
            expect(after[0].sub(before[0])).to.equal(e18.mul(60));

            let countdown = await stakBank.nextDistribution();
            Delay(countdown * 1000);
            await stakBank.rewardDistribution();
        });
        
        it("Should user1-300000coin 5s user2-15000coin 5s user3-70000coin", async function() {
            let before = [];
            before = await balance([owner]);
            await (await stakBank.connect(address1)).stake(300000, {value: calcFee(300000)});
            Delay(5000);
            await (await stakBank.connect(address2)).stake(15000, {value: calcFee(15000)});
            Delay(5000);
            await (await stakBank.connect(address3)).stake(70000, {value: calcFee(70000)});
            
            expect(await stakBank.stakingOf(address1.address)).to.equal(300000 + 10000);
            expect(await stakBank.stakingOf(address2.address)).to.equal(15000 + 60000);
            expect(await stakBank.stakingOf(address3.address)).to.equal(70000);
            let after = [];
            after = await balance([owner]);
            expect(after[0].sub(before[0])).to.equal(calcFee(300000 + 15000 + 70000));
        });

        it("Shoud distribute t2", async function() {
            let before = [];
            before = await balance([stakBank]);

            await moneyAddress.sendTransaction({
                to: stakBank.address,
                value: e18.mul(100)
            });

            let after = [];
            after = await balance([stakBank]);
            expect(after[0].sub(before[0])).to.equal(e18.mul(100));

            let countdown = await stakBank.nextDistribution();
            Delay(countdown * 1000);
            await stakBank.rewardDistribution();
        });

        it("Should user4-stake-unstake && user1-rut2 && user2-rut1", async function() {
            let before = []; before = await balance([owner]);

            await (await stakBank.connect(address4)).stake(20000000, {value: calcFee(20000000)});
            
            let after = []; after = await balance([owner]);

            expect(after[0].sub(before[0])).to.equal(calcFee(20000000));

            await (await stakBank.connect(address4)).unstakeAll();
            await (await stakBank.connect(address1)).unstakeWithId(2);
            await (await stakBank.connect(address2)).unstakeWithId(1);

            expect(await stakBank.stakingOf(address1.address)).to.equal(10000);
            expect(await stakBank.stakingOf(address2.address)).to.equal(15000);
        });

        it("Shoud t3 distribute", async function() {
            await moneyAddress.sendTransaction({
                to: stakBank.address,
                value: e18.mul(80)
            });

            let countdown = await stakBank.nextDistribution();
            Delay(countdown * 1000);
            await stakBank.rewardDistribution();

            await (await (stakBank.connect(address1))).unstakeAll();

            await (await (stakBank.connect(address2))).unstakeAll();

            await (await (stakBank.connect(address3))).withdrawReward();
            await (await (stakBank.connect(address3))).unstakeAll();
        });
    });
});