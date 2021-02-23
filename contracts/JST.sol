//SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.0 <0.8.0;

import "./ERC20.sol";
import "./Ownable.sol";

contract JST is ERC20, Ownable {
    address public StakBank;

    constructor(uint _totalSupply) ERC20("Jig Stack", "JST", _totalSupply) {
        StakBank = address(0);
    }

    function verifyStakBank(address bank) external onlyOwner {
        StakBank = bank;
    }

    modifier onlyStakBank() {
        require(StakBank == msg.sender);  
        _;
    }
}