// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { merkleTreeGenerator, merkleTreeGenerateProof } = require("../utils/merkleTreeGenerator");
const { contractAddresses } = require('../utils/contractAddresses');

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
  'goerli': [
    {
      whitelist: {
        'EXAMPLE_ADDRESS_1': 5,
        'EXAMPLE_ADDRESS_2': 10
      },
      tokenAddress: 'PUT_TOKEN_ADDRESS_HERE',
      tokenId: 3, // example
      tokenURI: 'ipfs://PUT_TOKEN_URI_HERE',
      startTime: Math.floor(new Date().getTime() / 1000) + 180, // example (UNIX TIME)
      endTime: Math.floor(new Date().getTime() / 1000) + 1800, // example (UNIX TIME)
      payout: 'PUT_PAYOUT_ADDRESS_HERE',
      airdropAdmin: 'PUT_AIRDROP_ADMIN_ADDRESS_HERE',
      purchasableAllocation: 0, // example
      purchasePrice: ethers.utils.parseUnits('0', 'ether'), // example
    }
  ]
}

const validateAirdropConfig = (config) => {
  if(
    config.whitelist
    && config.startTime
    && config.hasOwnProperty('endTime')
    && config.tokenURI
    && config.tokenAddress
    && config.payout
    && config.airdropAdmin
    && config.tokenId
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
  for(let airdropConfig of networkToAirdropConfig[hre.network.name]) {

    let validConfig = validateAirdropConfig(airdropConfig);

    if(validConfig && airdropFactoryAddress && airdropConfig && airdropReferenceContract && whitelistReferenceContract && erc1155ReferenceContract) {

      let merkleRoot = merkleTreeGenerator(airdropConfig.whitelist);

      const MerkleProofAirdropFactory = await ethers.getContractFactory("MerkleProofAirdropFactory");
      let merkleProofAirdropFactory = await MerkleProofAirdropFactory.attach(airdropFactoryAddress);

      console.log('Initiating new tx...');

      let newAirdropTx = await merkleProofAirdropFactory.newMerkleAirdropAndWhitelist(
        airdropReferenceContract,
        whitelistReferenceContract,
        merkleRoot,
        airdropConfig.startTime,
        airdropConfig.endTime,
        airdropConfig.tokenAddress,
        airdropConfig.tokenId,
        airdropConfig.tokenURI,
        airdropConfig.airdropAdmin,
        airdropConfig.payout
      )

      console.log('Awaiting tx confirmation...');

      let txResponse = await newAirdropTx.wait();

      let eventNewMerkle1155Airdrop = txResponse.events.find((item) => item.event === 'NewMerkle1155AirdropClone');

      console.log(`new airdrop address: `, eventNewMerkle1155Airdrop.args['airdropClone']);

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

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
