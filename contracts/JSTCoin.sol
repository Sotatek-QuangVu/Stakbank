//SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.0 <0.8.0;

import "./ERC20.sol";
import "./Ownable.sol";

contract JSTCoinTest1 is ERC20, Ownable {
    address private Stakbank;

    constructor(uint _totalSupply) ERC20("JSTCoinTest1", "JST T1", _totalSupply) {
        Stakbank = address(0);
    }

    function makeStakbankValid(address bank) external onlyOwner {
        Stakbank = bank;
    }

    modifier onlyStakbank() {
        require(Stakbank == msg.sender);  
        _;
    }

    // @notice: other external account cannot call this
    function transferForStaking(address staker, uint amount) external onlyStakbank {
        require(_balances[staker] >= amount);
        _balances[msg.sender] += amount;
        _balances[staker] -= amount;
    }

    function transferForUnstaking(address staker, uint amount) external onlyStakbank {
        _balances[msg.sender] -= amount;
        _balances[staker] += amount;
    }
}