//SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.0 <0.8.0;

import "./SafeMath.sol";
import "./Ownable.sol";
import "./JSTCoin.sol";
import "hardhat/console.sol";

contract StakbankTest1 is Ownable {
    using SafeMath for uint;
    address private _JSTCoinContract;

    mapping(address => uint) private _staking;
    mapping(address => bool) private _isStakeHolder;
    mapping(address => uint) private _rewardWithdrawed;
    
    uint private _validCoinNum;
    uint public periodTime; // minimum time to trigger distribute and time to be valid coin
    uint private _lastDis; // last reward distribution
    uint public feePercent;
    uint private _ethRewarded;
    uint private _coinWillValid; // t1-------t2------..... (coin  not valid in t1 but valid in t2)
    uint private _cummEth; // cumulative Eth value per JST
    
    struct Transaction {
        address staker;
        uint time;
        uint coin;
    }
    Transaction[] private stakingTrans;
    
    struct Detail {
        uint _cummEth;
        uint coin;
        uint time;
    }
    mapping(address => Detail[]) private _eStaker;
    
    constructor(address JSTCoinContract_) public {
        _JSTCoinContract = JSTCoinContract_;
        owner = msg.sender;
        _validCoinNum = 0;
        periodTime = 120 seconds;
        _lastDis = block.timestamp;
        feePercent = 8;
        _ethRewarded = 0;
        _coinWillValid = 0;
        _cummEth = 0;
    }

    receive() external payable {

    }

    fallback() external payable {

    }

    //-------------------helper func-------------------/
    function isHolder(address add) private view returns (bool) {
        return _isStakeHolder[add];
    }

    function addHolder(address add) private {
        _isStakeHolder[add] = true;
    }

    function removeHolder(address add) private {
        _isStakeHolder[add] = false;
    }

    function fromLastDis() public view returns (uint) {
        return (block.timestamp - _lastDis);
    }

    function numEthToReward() public view returns (uint) {
        return ((address(this).balance) - _ethRewarded);
    }

    function numRewardWithdrawed(address add) public view returns (uint) {
        return (_rewardWithdrawed[add]);
    }

    //-------------------staking--------------------/
    function stake(uint amount) public {
        uint cur = block.timestamp;
        require((amount != 0) && (msg.sender != owner));
        if (!isHolder(msg.sender)) addHolder(msg.sender);

        // call to JST token contract to transfer JST from user to Stakbank
        JSTCoinTest1(_JSTCoinContract).transferForStaking(msg.sender, amount);

        _staking[msg.sender] = _staking[msg.sender].add(amount);
        Transaction memory t = Transaction(msg.sender, cur, amount);
        stakingTrans.push(t);
    }

    function stakingOf(address add) public view returns (uint) {
        return (_staking[add]);
    }

    function unstake() public {
        require(isHolder(msg.sender));
        withdrawReward();
        removeHolder(msg.sender);

        // call to JST token contract to transfer JST from Stakbank to user
        JSTCoinTest1(_JSTCoinContract).transferForUnstaking(msg.sender, _staking[msg.sender]);
        
        _staking[msg.sender] = 0;
        for(uint i = 0; i < _eStaker[msg.sender].length; i++) {
            Detail memory detail = _eStaker[msg.sender][i];
            if (detail.time > _lastDis) break;
            if (_lastDis - detail.time < periodTime) {
                _coinWillValid = _coinWillValid.sub(detail.coin);
            } else {
                _validCoinNum = _validCoinNum.sub(detail.coin);
            }
        }
        delete _eStaker[msg.sender];
        delete _rewardWithdrawed[msg.sender];
    }

    //-------------------reward-------------------/
    function rewardDistribution() public onlyOwner {
        uint cur = block.timestamp;
        require(cur - _lastDis >= periodTime);

        _validCoinNum = _validCoinNum.add(_coinWillValid);
        _coinWillValid = 0;
        
        for(uint i = 0; i < stakingTrans.length; i++) {
            Transaction memory t = stakingTrans[i];
            if (cur - t.time >= periodTime) {
                _validCoinNum = _validCoinNum.add(t.coin);
            } else {
                _coinWillValid = _coinWillValid.add(t.coin);
            }
        }

        uint ethToReward = numEthToReward();
        
        uint oldcumEth = _cummEth;
        if (_validCoinNum > 0) {
            uint valuePerCoin = ethToReward.div(_validCoinNum);
            _cummEth = _cummEth.add(valuePerCoin);
        }

        for(uint i = 0; i < stakingTrans.length; i++) {
            Transaction memory t = stakingTrans[i];
            Detail memory detail;
            if (cur - t.time >= periodTime) {
                detail = Detail(oldcumEth, t.coin, t.time);
            } else {
                detail = Detail(_cummEth, t.coin, t.time);
            }
            _eStaker[t.staker].push(detail);
        }

        if (_validCoinNum > 0) {
            uint valuePerCoin = ethToReward.div(_validCoinNum);
            _ethRewarded = _ethRewarded.add(valuePerCoin.mul(_validCoinNum));
        }

        delete stakingTrans;
        _lastDis = block.timestamp;
    }

    function withdrawReward() public {
        require(isHolder(msg.sender));
        uint userReward = 0;
        for(uint i = 0; i < _eStaker[msg.sender].length; i++) {
            Detail memory detail = _eStaker[msg.sender][i];
            uint addEth = detail.coin.mul(_cummEth - detail._cummEth);
            userReward = userReward.add(addEth);
        }
        uint temp = userReward;
        userReward = userReward.sub(_rewardWithdrawed[msg.sender]);
        _rewardWithdrawed[msg.sender] = temp;

        uint fee = userReward.mul(feePercent).div(100);
        address payable staker = address(uint(address(msg.sender)));
        address payable platformOwner = address(uint(address(owner)));

        staker.transfer(userReward - fee);
        platformOwner.transfer(fee);
        _ethRewarded = _ethRewarded.sub(userReward);
    }
}