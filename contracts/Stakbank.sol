//SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.0 <0.8.0;

import "./libraries/ERC20.sol";
import "./libraries/SafeMath.sol";
import "./libraries/Ownable.sol";

contract StakbankTest0 is ERC20, Ownable {
    using SafeMath for uint;

    mapping(address => uint) private _staking;
    mapping(address => bool) private _isStakeHolder;
    
    uint private _validCoinNum;
    uint private _periodTime; // minimum time to trigger distribute and time to be valid coin
    uint public lastDis; // last reward distribution
    uint public feePercent;

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
    }
    mapping(address => Detail[]) private _eStaker;

    constructor(uint _totalSupply) ERC20("JST Test0", "JST T0", _totalSupply) public {
        owner = msg.sender;
        _periodTime = 120 seconds;
        lastDis = block.timestamp;
        feePercent = 8;
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

    function transferForStaking(address sender, address recipient, uint amount) private {
        _balances[sender] = _balances[sender].sub(amount);
        _balances[recipient] = _balances[recipient].add(amount);
    }


    //-------------------staking--------------------/
    function stake(uint amount) public {
        require(amount != 0);
        if (!isHolder(msg.sender)) addHolder(msg.sender);
        transferForStaking(msg.sender, address(this), amount);
        _staking[msg.sender] = _staking[msg.sender].add(amount);
        Transaction memory t = Transaction(msg.sender, block.timestamp, amount);
        stakingTrans.push(t);
    }

    function unstake() public {
        require(isHolder(msg.sender));
        withdrawReward();
        removeHolder(msg.sender);
        transferForStaking(address(this), msg.sender, _staking[msg.sender]);
    }
    

    //-------------------reward-------------------/
    function rewardDistribution() public {
        uint cur = block.timestamp;
        require(cur - lastDis >= 120 seconds);

        for(uint i = 0; i < stakingTrans.length; i++) {
            Transaction memory t = stakingTrans[i];
            if (cur - t.time >= 120 seconds) {
                _validCoinNum = _validCoinNum.add(t.coin);
            } else {
                Detail memory detail = Detail(_cummEth, t.coin);
                _eStaker[t.staker].push(detail);
            }
        }

        uint ethToReward = address(this).balance;
        _cummEth = _cummEth.add(ethToReward.div(_validCoinNum));
        for(uint i = 0; i < stakingTrans.length; i++) {
            Transaction memory t = stakingTrans[i];
            if (cur - t.time < 120 seconds) break;
            Detail memory detail = Detail(_cummEth, t.coin);
            _eStaker[t.staker].push(detail);
        }

        delete stakingTrans;
    }

    function withdrawReward() public {
        require(isHolder(msg.sender));
        uint userReward = 0;
        for(uint i = 0; i < _eStaker[msg.sender].length; i++) {
            Detail memory detail = _eStaker[msg.sender][i];
            uint addEth = detail.coin.mul(_cummEth - detail._cummEth);
            userReward = userReward.add(addEth);
        }
        uint fee = userReward.mul(feePercent).div(100);

        address payable staker = address(uint(address(msg.sender)));
        address payable platfromOwner = address(uint(address(owner)));

        staker.transfer(userReward - fee);
        platfromOwner.transfer(fee);
    } 
}