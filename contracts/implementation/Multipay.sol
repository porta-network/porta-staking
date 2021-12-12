// SPDX-License-Identifier: APGL-3.0-or-later

pragma solidity ^0.8.0;

// Multipay.sol -- An ownable smart contract to help payments to multiple addresses in one tx

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../struct/PaymentInfo.sol";


contract Multipay is Ownable {

    /***********\
    |  Storage  |
    \***********/

    mapping(address => mapping(uint256 => bool)) public processedPayments;

    /**************\
    |  Public API  |
    \**************/

    function transferMany(address token, PaymentInfo[] calldata payments) external onlyOwner {
        IERC20 tokenContract = IERC20(token);

        for (uint16 i = 0; i < payments.length; i++) {
            require(!isPaymentProcessed(payments[i].recipient, payments[i].payReference),
                "Multipay: Payment reference is not unique");
            _flagPayReference(payments[i].recipient, payments[i].payReference);

            tokenContract.transfer(payments[i].recipient, payments[i].amount);
        }
    }

    function isPaymentProcessed(address recipient, uint256 payReference) public view returns (bool) {
        return processedPayments[recipient][payReference];
    }

    /***************\
    |  Private API  |
    \***************/

    function _flagPayReference(address recipient, uint256 payReference) internal {
        processedPayments[recipient][payReference] = true;
    }
}
