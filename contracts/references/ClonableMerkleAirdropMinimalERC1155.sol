//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

interface IMerkleTreeWhitelist {
    function isValidMerkleProof(bytes32[] calldata _merkleProof, address _minter, uint96 _amount) external view returns (bool);
}

interface ITokenContract {
  function mint(address _recipient, uint256 _tokenId, uint96 _quantity) external;
}

contract ClonableMerkleAirdropMinimalERC1155 is OwnableUpgradeable {
  
  IMerkleTreeWhitelist public merkleProofWhitelist;
  ITokenContract public tokenContract;
  uint256 public tokenId;
  uint256 public startTime;
  uint256 public endTime;
  uint256 public whitelistVersion;
  mapping(uint256 => mapping(address => bool)) public whitelistVersionToClaimantToClaimStatus;

  // TODO add functionality for admin address to update startTime / endTime / whitelist

  function initialize(
    address _merkleProofWhitelist,
    address _tokenContract,
    uint256 _tokenId,
    uint256 _startTime,
    uint256 _endTime
  ) external {
    require(address(merkleProofWhitelist) == address(0), "ALREADY_INITIALIZED");
    merkleProofWhitelist = IMerkleTreeWhitelist(_merkleProofWhitelist);
    tokenContract = ITokenContract(_tokenContract);
    tokenId = _tokenId;
    startTime = _startTime;
    endTime = _endTime;
    whitelistVersion = 1;
  }

  function mintMerkleWhitelist(
    bytes32[] calldata _merkleProof,
    uint16 _quantity,
    address _claimant,
    address _recipient
  ) external {
    require(block.timestamp >= startTime, "MINTING_NOT_STARTED");
    if(endTime > 0) {
      require(block.timestamp <= endTime, "MINTING_HAS_ENDED");
    }
    if(_claimant == _recipient) {
      require(!whitelistVersionToClaimantToClaimStatus[whitelistVersion][_claimant], 'MERKLE_CLAIM_ALREADY_MADE');
      require(merkleProofWhitelist.isValidMerkleProof(_merkleProof, _claimant, _quantity), 'INVALID_MERKLE_PROOF');
      whitelistVersionToClaimantToClaimStatus[whitelistVersion][_claimant] = true;
    } else {
      require(!whitelistVersionToClaimantToClaimStatus[whitelistVersion][msg.sender], 'MERKLE_CLAIM_ALREADY_MADE');
      require(merkleProofWhitelist.isValidMerkleProof(_merkleProof, msg.sender, _quantity), 'INVALID_MERKLE_PROOF');
      whitelistVersionToClaimantToClaimStatus[whitelistVersion][msg.sender] = true;
    }

    tokenContract.mint(_recipient, tokenId, _quantity);
  }

}