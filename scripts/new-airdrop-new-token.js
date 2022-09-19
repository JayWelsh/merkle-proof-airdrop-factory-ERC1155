// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { ethers } = require("hardhat");
const { merkleTreeGenerator, merkleTreeGenerateProof } = require("../utils/merkleTreeGenerator");
const { contractAddresses } = require('../utils/contractAddresses');
const { config } = require("dotenv");

const etherscanChainIdsAndNames = [
    1, // Mainnet
    3, // Ropsten
    4, // Rinkeby
    5, // Goerli
    11155111, // Sepolia
    'mainnet',
    'ropsten',
    'rinkeby',
    'goerli',
    'sepolia'
]

let networkToAirdropConfig = {
  'goerli': {
    whitelist: {
      'EXAMPLE_ADDRESS_1': 5,
      'EXAMPLE_ADDRESS_2': 10
    },
    payout: 'PUT_PAYOUT_ADDRESS_HERE',
    tokenAdmin: 'PUT_TOKEN_ADMIN_ADDRESS_HERE',
    tokenName: 'PUT_TOKEN_NAME_HERE',
    tokenSymbol: 'PUT_TOKEN_SYMBOL_HERE',
    tokenURI: 'ipfs://PUT_TOKEN_URI_HERE',
    purchasableAllocation: 20, // example
    purchasePrice: ethers.utils.parseUnits('0.0001', 'ether'), // example
    startTime: Math.floor(new Date().getTime() / 1000) + 180, // example (UNIX TIME)
    endTime: Math.floor(new Date().getTime() / 1000) + 1800, // example (UNIX TIME)
  }
}

const validateAirdropConfig = (config) => {
  if(
    config.whitelist
    && config.startTime
    && config.hasOwnProperty('endTime')
    && config.tokenName
    && config.tokenSymbol
    && config.tokenURI
    && config.tokenAdmin
    && config.payout
  ) {
    return true;
  } else {
    return false;
  }
}

async function main() {
  
  let [deployerAddress] = await hre.ethers.getSigners();

  let airdropFactoryAddress = contractAddresses['MerkleProofAirdropFactory'][hre.network.name];
  let airdropReferenceContract = contractAddresses['ClonableMerkleAirdropMinimalERC1155'][hre.network.name];
  let whitelistReferenceContract = contractAddresses['ClonableMerkleWhitelist'][hre.network.name];
  let erc1155ReferenceContract = contractAddresses['ClonableERC1155'][hre.network.name];
  let airdropConfig = networkToAirdropConfig[hre.network.name];

  let validConfig = validateAirdropConfig(airdropConfig);

  if(validConfig && airdropFactoryAddress && airdropConfig && airdropReferenceContract && whitelistReferenceContract && erc1155ReferenceContract) {

    // newMerkleAirdropAndWhitelistAndERC1155(
    //   address _airdropReferenceContract,
    //   address _whitelistReferenceContract,
    //   address _erc1155ReferenceContract,
    //   bytes32 _merkleRoot,
    //   uint256 _startTime,
    //   uint256 _endTime,
    //   string memory _tokenName,
    //   string memory _tokenSymbol,
    //   string memory _tokenURI,
    //   address _tokenAdmin
    // )

    let merkleRoot = merkleTreeGenerator(airdropConfig.whitelist);

    const MerkleProofAirdropFactory = await ethers.getContractFactory("MerkleProofAirdropFactory");
    let merkleProofAirdropFactory = await MerkleProofAirdropFactory.attach(airdropFactoryAddress);

    console.log('Initiating new tx...');

    let newAirdropTx = await merkleProofAirdropFactory.newMerkleAirdropAndWhitelistAndERC1155(
      airdropReferenceContract,
      whitelistReferenceContract,
      erc1155ReferenceContract,
      merkleRoot,
      airdropConfig.startTime,
      airdropConfig.endTime,
      airdropConfig.tokenName,
      airdropConfig.tokenSymbol,
      airdropConfig.tokenURI,
      deployerAddress.address,
      airdropConfig.payout
    )

    console.log('Awaiting tx confirmation...');

    let txResponse = await newAirdropTx.wait();

    let eventNewMerkle1155Airdrop = txResponse.events.find((item) => item.event === 'NewMerkle1155AirdropClone');
    let eventNewERC1155 = txResponse.events.find((item) => item.event === 'NewERC1155Clone');

    console.log(`new airdrop address: `, eventNewMerkle1155Airdrop.args['airdropClone']);
    console.log(`new ERC1155 address: `, eventNewERC1155.args['erc1155Clone']);

    // Transfer token ownership from deployer to tokenAdmin
    const TokenERC1155 = await ethers.getContractFactory("ClonableERC1155");
    let tokenERC1155 = await TokenERC1155.attach(eventNewERC1155.args['erc1155Clone']);

    let initialOwner = await tokenERC1155.owner();

    console.log({initialOwner})

    console.log('Transferring token ownership to tokenAdmin...');

    let transferTokenOwnershipTx = await tokenERC1155.transferOwnership(airdropConfig.tokenAdmin);

    console.log('Awaiting tx to transfer token ownership to tokenAdmin...');

    await transferTokenOwnershipTx.wait();

    let newOwner = await tokenERC1155.owner();

    console.log({newOwner})

    // If there is any sale config, set it now
    if(airdropConfig.purchasableAllocation || airdropConfig.purchasePrice) {
      console.log("Setting up sale config");
      const Airdrop = await ethers.getContractFactory("ClonableMerkleAirdropMinimalERC1155");
      let airdrop = await Airdrop.attach(eventNewMerkle1155Airdrop.args['airdropClone']);
      let saleConfigAirdropTx = await airdrop.setSaleConfig(airdropConfig.purchasableAllocation, airdropConfig.purchasePrice);
      console.log(`awaiting saleConfigAirdropTx...`);
      await saleConfigAirdropTx.wait();
      console.log(`Sale config success`);
    }

  }

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
