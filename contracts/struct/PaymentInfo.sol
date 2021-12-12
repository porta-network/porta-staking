// SPDX-License-Identifier: AGPL-3.0-or-later

// PaymentInfo.sol -- An struct for holding the settlement information of an address.

pragma solidity ^0.8.0;

struct PaymentInfo {
    // How much to send.
    uint256 amount;
    // Who is the receiver
    address recipient;
    // Payment reference
    uint256 payReference;
}

