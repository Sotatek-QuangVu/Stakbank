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
    uint private _cummEth; // cumulative Eth value per JST
    uint public lastDis; // last reward distribution
    
    struct Transaction {
        address staker;
        uint time;
        uint coin;
    }
    Transaction[] private stakingTrans;
    
    constructor(uint _totalSupply) ERC20("JST Test0", "JST T0", _totalSupply) public {
        owner = msg.sender;
        _periodTime = 120 seconds;
        lastDis = block.timestamp;
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

    function transferForStaking(address sender, address receiver, uint amount) private {
        _balances[sender] = _balances[sender].sub(amount);
        _balances[receiver] = _balances[receiver].add(amount);
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
        removeHolder(msg.sender);
        transferForStaking(address(this), msg.sender, _staking[msg.sender]);
    }
    


}