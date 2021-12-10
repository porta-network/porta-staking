// SPDX-License-Identifier: APGL-3.0-or-later

pragma solidity ^0.8.0;

// Multipay.sol -- An ownable smart contract to help payments to multiple addresses in one tx

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../struct/PaymentInfo.sol";


contract Multipay is Ownable {
    function transferMany(address token, PaymentInfo[] calldata payments) external onlyOwner {
        IERC20 tokenContract = IERC20(token);

        for (uint16 i = 0; i < payments.length; i++) {
            tokenContract.transfer(payments[i].recipient, payments[i].amount);
        }
    }
}
