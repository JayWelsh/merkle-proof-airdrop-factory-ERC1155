// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { merkleTreeGenerator, merkleTreeGenerateProof } = require("../utils/merkleTreeGenerator");

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

async function main() {
  
  let [deployerAddress] = await hre.ethers.getSigners();

  let testWhitelist = {};
  testWhitelist[deployerAddress.address] = 5;

  let merkleRoot = merkleTreeGenerator(testWhitelist);

  // Reference ClonableERC1155
  const ClonableERC1155 = await ethers.getContractFactory("ClonableERC1155");
  let referenceClonableERC1155 = await ClonableERC1155.deploy();
  await referenceClonableERC1155.deployed();
  console.log("ClonableERC1155 deployed to:", referenceClonableERC1155.address);
  await referenceClonableERC1155.initialize(
    'reference', //   string memory _tokenName,
    'REF', //   string memory _tokenSymbol,
    'ipfs://', //   string memory _tokenURI,
    deployerAddress.address, //   address _admin,
    deployerAddress.address, //   address _factory,
    deployerAddress.address, //   address _minter
  );

  // Reference ClonableMerkleAirdropMinimalERC1155
  const ClonableMerkleAirdropMinimalERC1155 = await ethers.getContractFactory("ClonableMerkleAirdropMinimalERC1155");
  let referenceClonableMerkleAirdropMinimalERC1155 = await ClonableMerkleAirdropMinimalERC1155.deploy();
  await referenceClonableMerkleAirdropMinimalERC1155.deployed();
  console.log("ClonableMerkleAirdropMinimalERC1155 deployed to:", referenceClonableMerkleAirdropMinimalERC1155.address);
  await referenceClonableMerkleAirdropMinimalERC1155.initialize(
    deployerAddress.address, // address _merkleProofWhitelist,
    referenceClonableERC1155.address, // address _tokenContract,
    1, // uint256 _tokenId,
    Math.floor(new Date().getTime() / 1000), // uint256 _startTime,
    Math.floor(new Date().getTime() / 1000), // uint256 _endTime
    deployerAddress.address,
    deployerAddress.address,
  );

  // Reference ClonableMerkleWhitelist
  const ClonableMerkleWhitelist = await ethers.getContractFactory("ClonableMerkleWhitelist");
  referenceClonableMerkleWhitelist = await ClonableMerkleWhitelist.deploy();
  await referenceClonableMerkleWhitelist.deployed();
  console.log("ClonableMerkleWhitelist deployed to:", referenceClonableMerkleWhitelist.address);
  await referenceClonableMerkleWhitelist.initialize(
    merkleRoot // bytes32 _merkleRoot
  );

  const MerkleProofAirdropFactory = await ethers.getContractFactory("MerkleProofAirdropFactory");
  let merkleProofAirdropFactory = await MerkleProofAirdropFactory.deploy(
    referenceClonableERC1155.address, // address _clonableERC1155,
    referenceClonableMerkleAirdropMinimalERC1155.address, // address _clonableMerkleAirdrop,
    referenceClonableMerkleWhitelist.address // address _clonableMerkleWhitelist);
  );
  await merkleProofAirdropFactory.deployed();
  console.log("MerkleProofAirdropFactory deployed to:", merkleProofAirdropFactory.address);

  // We run verification on Etherscan
  // If there is an official Etherscan instance of this network we are deploying to
  if(etherscanChainIdsAndNames.indexOf(hre.network.name) > -1) {
    console.log('Deploying to a network supported by Etherscan, running Etherscan contract verification')
    
    // First we pause for a minute to give Etherscan a chance to update with our newly deployed contracts
    console.log('First waiting a minute to give Etherscan a chance to update...')
    await new Promise((resolve) => setTimeout(resolve, 60000));

    // We can now run Etherscan verification of our contracts

    try {
      await hre.run('verify:verify', {
        address: referenceClonableERC1155.address,
        constructorArguments: []
      });
    } catch (err) {
      console.log(`Contract verify error: ${err}`);
    }

    try {
      await hre.run('verify:verify', {
        address: referenceClonableMerkleAirdropMinimalERC1155.address,
        constructorArguments: []
      });
    } catch (err) {
      console.log(`Contract verify error: ${err}`);
    }

    try {
      await hre.run('verify:verify', {
        address: referenceClonableMerkleWhitelist.address,
        constructorArguments: []
      });
    } catch (err) {
      console.log(`Contract verify error: ${err}`);
    }

    try {
      await hre.run('verify:verify', {
        address:  merkleProofAirdropFactory.address,
        constructorArguments: [
          referenceClonableERC1155.address, // address _clonableERC1155,
          referenceClonableMerkleAirdropMinimalERC1155.address, // address _clonableMerkleAirdrop,
          referenceClonableMerkleWhitelist.address // address _clonableMerkleWhitelist);
        ]
      });
    } catch (err) {
      console.log(`Contract verify error: ${err}`);
    }
  } else {
    console.log('Not deploying to a network supported by Etherscan, skipping Etherscan contract verification');
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
