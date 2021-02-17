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
    let owner, address1, address2, address3;
    let addresses;
    let miliTime = 120000;
    
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
        it("Should owner decrease 200 JSTCoin", async function() {
            await JSTCoin.transfer(address1.address, 190);
            await JSTCoin.transfer(address2.address, 10);
            expect(await JSTCoin.balanceOf(owner.address)).to.equal(1000 - 200);
        });

        it("Should address1 increase 190 JSTCoin", async function() {
            expect(await JSTCoin.balanceOf(address1.address)).to.equal(190);
        });

        it("Should address2 increase 10 JSTCoin", async function() {
            expect(await JSTCoin.balanceOf(address2.address)).to.equal(10);
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

    describe("Test draw in paper", function() {
        it("Should 2 user stake coin", async function() {
            // money to reward
            await address3.sendTransaction({
                to: Stakbank.address,
                value: eth.mul(60)
            });
            await (await Stakbank.connect(address1)).stake(90);
            await (await Stakbank.connect(address2)).stake(10);
            expect(await Stakbank.stakingOf(address1.address)).to.equal(90);
            expect(await Stakbank.stakingOf(address2.address)).to.equal(10);
        });

        it("Should 2 user get no coin in t1", async function() {
            let before = [];
            let after = [];
            before = await balance([address1, address2])
            let fromlastDis = await Stakbank.fromLastDis();
            Delay(Math.max(0, miliTime - fromlastDis*1000));
            await Stakbank.rewardDistribution();
            await (await Stakbank.connect(address1)).withdrawReward();
            await (await Stakbank.connect(address2)).withdrawReward();
            after = await balance([address1, address2])
            console.log('address1 increase: ' + (after[0] - before[0]));
            console.log('address2 increase: ' + (after[1] - before[1]));
        }); 

        it("Should 2 user get coin in t2", async function() {
            console.log('Coin for rewarding: ' + (await Stakbank.numEthToReward()));
            let before = [];
            let after = [];
            before = await balance([owner, address1, address2])
            let fromlastDis = await Stakbank.fromLastDis();
            Delay(Math.max(0, miliTime - fromlastDis*1000));
            await Stakbank.rewardDistribution();
            await (await Stakbank.connect(address1)).withdrawReward();
            await (await Stakbank.connect(address2)).unstake();
            expect(await Stakbank.stakingOf(address2.address)).to.equal(0);
            after = await balance([owner, address1, address2])
            console.log('owner increase   : ' + (after[0] - before[0]));
            console.log('address1 increase: ' + (after[1] - before[1]));
            console.log('address2 increase: ' + (after[2] - before[2]));
        });

        it("Should address1 get all coin in t3", async function() {
            await (await Stakbank.connect(address2)).stake(10);
            expect(await Stakbank.stakingOf(address2.address)).to.equal(10);
            await address3.sendTransaction({
                to: Stakbank.address,
                value: eth
            });
            console.log('Coin for rewarding: ' + (await Stakbank.numEthToReward()));
            let before = [];
            let after = [];
            before = await balance([owner, address1, address2]);
            let fromlastDis = await Stakbank.fromLastDis();
            Delay(Math.max(0, miliTime - fromlastDis*1000));
            await Stakbank.rewardDistribution();
            await (await Stakbank.connect(address1)).withdrawReward();
            await (await Stakbank.connect(address2)).withdrawReward();
            after = await balance([owner, address1, address2]);
            console.log('owner increase   : ' + (after[0] - before[0]));
            console.log('address1 increase: ' + (after[1] - before[1]));
            console.log('address2 increase: ' + (after[2] - before[2]));
        });

        it("Should address1 get all coin in t4", async function() {
            console.log((await Stakbank.stakingOf(address2.address)).toString());

            await (await Stakbank.connect(address2)).unstake();
            expect(await Stakbank.stakingOf(address2.address)).to.equal(0);
            console.log(await Stakbank.stakingOf(address2.address));
            await address3.sendTransaction({
                to: Stakbank.address,
                value: eth
            });
            console.log('Coin for rewarding: ' + (await Stakbank.numEthToReward()));
            let before = [];
            let after = [];
            before = await balance([owner, address1, address2]);
            let fromlastDis = await Stakbank.fromLastDis();
            Delay(Math.max(0, miliTime - fromlastDis*1000));
            await Stakbank.rewardDistribution();
            console.log("done reward distribution");
            await (await Stakbank.connect(address1)).withdrawReward();
            //await (await Stakbank.connect(address2)).withdrawReward();
            after = await balance([owner, address1, address2]);
            console.log('owner increase   : ' + (after[0] - before[0]));
            console.log('address1 increase: ' + (after[1] - before[1]));
            console.log('address2 increase: ' + (after[2] - before[2]));
        });

        it("Should address1 get all coin in t5", async function() {
            await (await Stakbank.connect(address2)).stake(10);
            expect(await Stakbank.stakingOf(address2.address)).to.equal(10);
            await (await Stakbank.connect(address1)).stake(100);
            expect(await Stakbank.stakingOf(address1.address)).to.equal(190);
            await address3.sendTransaction({
                to: Stakbank.address,
                value: eth
            });
            console.log('Coin for rewarding: ' + (await Stakbank.numEthToReward()));
            let before = [];
            let after = [];
            before = await balance([owner, address1, address2]);
            let fromlastDis = await Stakbank.fromLastDis();
            Delay(Math.max(0, miliTime - fromlastDis*1000));
            await Stakbank.rewardDistribution();
            await (await Stakbank.connect(address1)).withdrawReward();
            await (await Stakbank.connect(address2)).withdrawReward();
            after = await balance([owner, address1, address2]);
            console.log('owner increase   : ' + (after[0] - before[0]));
            console.log('address1 increase: ' + (after[1] - before[1]));
            console.log('address2 increase: ' + (after[2] - before[2]));
        });

        it("Should 100 coin of address1 valid", async function() {
            expect(await Stakbank.stakingOf(address1.address)).to.equal(190);
            expect(await Stakbank.stakingOf(address2.address)).to.equal(10);
            await address3.sendTransaction({
                to: Stakbank.address,
                value: eth.mul(60)
            });
            console.log('Coin for rewarding: ' + (await Stakbank.numEthToReward()));
            let before = [];
            let after = [];
            before = await balance([owner, address1, address2]);
            let fromlastDis = await Stakbank.fromLastDis();
            Delay(Math.max(0, miliTime - fromlastDis*1000));
            await Stakbank.rewardDistribution();
            await (await Stakbank.connect(address1)).withdrawReward();
            await (await Stakbank.connect(address2)).withdrawReward();
            after = await balance([owner, address1, address2]);
            console.log('owner increase   : ' + (after[0] - before[0]));
            console.log('address1 increase: ' + (after[1] - before[1]));
            console.log('address2 increase: ' + (after[2] - before[2]));
        });
    });
});


/*
Stakbank contract
Owner test
  ✓ Should set to the right owner
  ✓ Should JSTCoin and Stakbank have the same owner
Transfer JST to EOA
  ✓ Should owner decrease 200 JSTCoin (56ms)
  ✓ Should address1 increase 190 JSTCoin
  ✓ Should address2 increase 10 JSTCoin
Test draw in paper
  ✓ Should 2 user stake coin (126ms)
address1 increase: -290688000327680
address2 increase: -290688000327680
  ✓ Should 2 user get no coin in t1 (114132ms)
Coin for rewarding: 60000000000000000000
owner increase   : 4799262544000713000
address1 increase: 49679414440000225000
address2 increase: 5519406072000938000
  ✓ Should 2 user get coin in t2 (118184ms)
Coin for rewarding: 1000000000000000000
owner increase   : 78860383999229950
address1 increase: 919654440001077200
address2 increase: -290688000327680
  ✓ Should address1 get all coin in t3 (116188ms)
10
BigNumber { _hex: '0x00', _isBigNumber: true }
Coin for rewarding: 1000000000000000010
done reward distribution
owner increase   : 79449744000155650
address1 increase: 919654439998980100
address2 increase: 0
  ✓ Should address1 get all coin in t4 (116153ms)
Coin for rewarding: 1000000000000000020
owner increase   : 78458215999733760
address1 increase: 919609216000327700
address2 increase: -290687998230528
  ✓ Should address1 get all coin in t5 (116208ms)
Coin for rewarding: 60000000000000000030
owner increase   : 4799502544000778000
address1 increase: 52439489216000295000
address2 increase: 2759534439999471600
  ✓ Should 100 coin of address1 valid (117107ms)


12 passing (12m)

*/