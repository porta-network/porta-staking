// SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.0;

// CreatorOwnable.sol -- An ownable abstraction with creator source

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Context.sol";

// @title CreatorOwnable
// @author Alisina Bahadori
// @dev Ownable abstraction which follows the ownable of the immutable creator.
abstract contract CreatorOwnable is Context {
    Ownable private immutable _creator;

    /**
     * @dev Initializes the contract setting the deployer as the creator.
     */
    constructor() {
        _creator = Ownable(_msgSender());
    }

    /**
     * @dev Returns the address of the current owner based on creators owner.
     */
    function owner() public view virtual returns (address) {
        return _creator.owner();
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
        _;
    }
}
