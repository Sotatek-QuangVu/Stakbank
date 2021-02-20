//SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.0 <0.8.0;

import "./SafeMath.sol";
import "./Ownable.sol";
import "./JSTCoin.sol";
import "hardhat/console.sol";

contract StakbankTest2 is Ownable {
    using SafeMath for uint;
    address private _JSTCoinContract;

    mapping(address => uint) private _staking;
    
    uint public periodTime; // minimum time to trigger distribution
    uint private _lastDis; // last reward distribution
    uint public feePerCoin;
    uint private _ethRewarded;
    uint private _cummEth; // cumulative Eth value per JST
    uint private _oldCoin;
    
    struct Transaction {
        address staker;
        uint time;
        uint coin;
        uint detailId;
    }
    Transaction[] private stakingTrans;
    
    struct Detail {
        uint detailId;
        uint coin;
        uint time;
        uint firstReward;
        uint lastWithdraw;
        bool isOldCoin;
    }
    mapping(address => Detail[]) private _eStaker;
    mapping(address => mapping(uint => uint)) private _posDetail;
    mapping(address => uint) private _numberStake;
    
    constructor(address JSTCoinContract_) public {
        _JSTCoinContract = JSTCoinContract_;
        owner = msg.sender;
        periodTime = 60 seconds;
        _lastDis = block.timestamp;
        feePerCoin = 100;
        _ethRewarded = 0;
        _cummEth = 0;
        _oldCoin = 0;
    }

    receive() external payable {

    }

    fallback() external payable {

    }

    //------------------ setter func-------------------/
    function setPeriodTime(uint time) external onlyOwner {
        periodTime = time;
    }

    function setFeePerCoin(uint value) external onlyOwner {
        feePerCoin = value;
    }

    //-------------------helper func-------------------/
    function isHolder(address add) private view returns (bool) {
        return (_staking[add] != 0);
    }

    function nextDistribution() public view returns (uint) {
        uint cur = block.timestamp;
        if (cur >= _lastDis + periodTime) return 0;
        return (periodTime - (cur - _lastDis));
    }

    function numEthToReward() public view returns (uint) {
        return ((address(this).balance) - _ethRewarded);
    }
   
    function createNewTransaction(address user, uint current, uint amount) private {
        _numberStake[user] ++;
        Detail memory d = Detail(_numberStake[user], amount, current, 0, 0, false);
        _eStaker[user].push(d);
        _posDetail[user][_numberStake[user]] = _eStaker[user].length;
        Transaction memory t = Transaction(user, current, amount, _numberStake[user]);
        stakingTrans.push(t);
        debug(user, _numberStake[user]);
    }

    function isUnstaked(address user, uint idStake) private view returns (bool) {
        return (_posDetail[user][idStake] == 0 ? true : false);
    }

    //-------------------staking--------------------/
    function stake(uint amount) public payable {
        uint current = block.timestamp;
        require(amount != 0, "Stake amount must be positive");
        require(msg.sender != owner, "Owner cannot be staker");
        uint platformFee = feePerCoin.mul(amount);
        //require(msg.sender.balance >= platformFee); --> this will be checked by frontend because eth sent!
        JSTCoinTest2(_JSTCoinContract).transferForStaking(msg.sender, amount);
        _staking[msg.sender] = _staking[msg.sender].add(amount);
        createNewTransaction(msg.sender, current, amount);
        address payable admin = address(uint(address(owner)));
        admin.transfer(platformFee);
    }

    function stakingOf(address add) public view returns (uint) {
        return (_staking[add]);
    }

    function unstakeId(address sender, uint idStake) private {
        uint _posIdStake = _posDetail[sender][idStake] - 1;
        Detail memory d = _eStaker[sender][_posIdStake];
        uint coinNum = d.coin;
        JSTCoinTest2(_JSTCoinContract).transferForUnstaking(sender, coinNum);
        _staking[sender] -= coinNum;
        _eStaker[sender][_posIdStake] = _eStaker[sender][_eStaker[sender].length - 1];
        _posDetail[sender][_eStaker[sender][_posIdStake].detailId] = _posIdStake + 1;
        _eStaker[sender].pop();
        delete _posDetail[sender][idStake];
    }

    function unstakeWithId(uint idStake) public {
        require(isHolder(msg.sender), "Not a Staker");
        require(_eStaker[msg.sender].length > 1, "Cannot unstake the last with this method");
        require(!isUnstaked(msg.sender, idStake), "idStake unstaked");
        uint _posIdStake = _posDetail[msg.sender][idStake] - 1;
        Detail memory d = _eStaker[msg.sender][_posIdStake];
        if (d.isOldCoin) {
            _oldCoin = _oldCoin.sub(d.coin);
            uint reward = _cummEth.sub(d.lastWithdraw);
            reward = reward.mul(d.coin);
            reward = reward.add(d.firstReward);
            address payable staker = address(uint160(address(msg.sender)));
            staker.transfer(reward);
            _ethRewarded = _ethRewarded.sub(reward);
            console.log("reward unstake | user: %s | money: %s", msg.sender, reward);
            console.log("       main reward: %s | first reward: %s", (_cummEth.sub(d.lastWithdraw)).mul(d.coin), d.firstReward);
        }
        unstakeId(msg.sender, idStake);
    }

    function unstakeAll() public {
        require(isHolder(msg.sender), "Not a Staker");
        withdrawReward();
        for(uint i = 0; i < _eStaker[msg.sender].length; i++) {
            unstakeId(msg.sender, _eStaker[msg.sender][i].detailId);
        }
        delete _eStaker[msg.sender];
        delete _numberStake[msg.sender];
    }

    //-------------------reward-------------------/
    function rewardDistribution() public onlyOwner {
        uint current = block.timestamp;  console.log("Time distribution: %s", current);
        uint timelast = current - _lastDis;
        require(timelast >= periodTime, "Too soon to trigger reward distribution");
        uint totalTime = timelast.mul(_oldCoin);
        for(uint i = 0; i < stakingTrans.length; i++) {
            Transaction memory t = stakingTrans[i];
            if (!isHolder(t.staker) || isUnstaked(t.staker, t.detailId)) continue;
            uint newTime = (current.sub(t.time)).mul(t.coin);
            totalTime = totalTime.add(newTime);
        }
        uint ethToReward = numEthToReward(); console.log("Eth to reward: %s | timelast: %s | totaltime: %s", ethToReward, timelast, totalTime);
        if (totalTime > 0) {
            uint unitValue = ethToReward/(totalTime);
            _cummEth = _cummEth.add(unitValue.mul(timelast));
            for(uint i = 0; i < stakingTrans.length; i++) {
                Transaction memory t = stakingTrans[i];
                if (!isHolder(t.staker) || isUnstaked(t.staker, t.detailId)) continue;
                uint _posIdStake = _posDetail[t.staker][t.detailId] - 1;
                _eStaker[t.staker][_posIdStake].lastWithdraw = _cummEth;
                uint firstTime = current - t.time; 
                _eStaker[t.staker][_posIdStake].firstReward = unitValue.mul(firstTime).mul(t.coin);
                console.log("unitvalue: %s | firsttime: %s | coin: %s", unitValue, firstTime, t.coin);
                _oldCoin = _oldCoin.add(t.coin);
                _eStaker[t.staker][_posIdStake].isOldCoin = true;
            }
            delete stakingTrans;
            _ethRewarded = _ethRewarded.add(unitValue.mul(totalTime));
        }
        _lastDis = block.timestamp;
    }

    function withdrawReward() public {
        require(isHolder(msg.sender), "Not a Staker");
        console.log("user: %s", msg.sender);
        uint userReward = 0;
        for(uint i = 0; i < _eStaker[msg.sender].length; i++) {
            Detail memory detail = _eStaker[msg.sender][i];
            if (!detail.isOldCoin) continue;
            uint addEth = (detail.coin).mul(_cummEth.sub(detail.lastWithdraw));
            console.log("   main reward: %s | firstReward", addEth, detail.firstReward);
            addEth = addEth.add(detail.firstReward);
            userReward = userReward.add(addEth);
            _eStaker[msg.sender][i].firstReward = 0;
            _eStaker[msg.sender][i].lastWithdraw = _cummEth;
        }
        // console.log(userReward);
        address payable staker = address(uint(address(msg.sender)));
        console.log("%s | get draw reward: %s | while stakbank have: %s", msg.sender, userReward, (address(this).balance));
        staker.transfer(userReward);
        _ethRewarded = _ethRewarded.sub(userReward);
    }

    ///////////////////////////
    function debug(address user, uint idStake) private view {
        uint _pos = _posDetail[user][idStake] - 1;
        console.log("User: %s | idStake: %s | Time Stake: %s", user, idStake, _eStaker[user][_pos].time);
    }
}