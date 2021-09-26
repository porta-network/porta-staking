// SPDX-License-Identifier: Unlicense

// MockedERC20Token.sol -- A Mocked ERC20 Token for testing.

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title ERC20 Mock Token
/// @author Alisina Bahadori
/// @notice This is a simple ERC20 Token for testing.
contract MockedERC20Token is ERC20 {

    constructor(uint256 initSupply) ERC20("Kianite MOCK", "KIAN") {
        _mint(msg.sender, initSupply);
    }

    function faucet(uint256 amount) public {
        _mint(msg.sender, amount);
    }

}
