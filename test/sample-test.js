const { expect } = require("chai");
const { ethers } = require("hardhat");
const { merkleTreeGenerator, merkleTreeGenerateProof } = require("../utils/merkleTreeGenerator");

// Public functions:

// newMerkleAirdrop
// newMerkleWhitelist
// newERC1155
// newMerkleAirdropAndWhitelist
// newMerkleAirdropAndWhitelistAndERC1155
// setClonableAirdropReferenceValidity
// setClonableWhitelistReferenceValidity
// setClonableERC1155ReferenceValidity

describe("MerkleProofAirdropFactory", function () {
  let deployerAddress;
  let signerAddresses;
  let miscAddress;
  let whitelistAddress1;
  let whitelistAddress2;
  let merkleProofAirdropFactory;
  let referenceClonableERC1155;
  let additionalReferenceClonableERC1155;
  let referenceClonableMerkleAirdropMinimalERC1155;
  let additionalReferenceClonableMerkleAirdropMinimalERC1155;
  let referenceClonableMerkleWhitelist;
  let additionalReferenceClonableMerkleWhitelist;
  let testWhitelist = {};
  let merkleRoot;
  let lastAirdropContractAddress;
  let lastERC1155ContractAddress;
  let lastWhitelistContractAddress;
  beforeEach(async function () {

    [deployerAddress, miscAddress, payoutAddress, whitelistAddress1, whitelistAddress2, ...signerAddresses] = await hre.ethers.getSigners();

    testWhitelist[whitelistAddress1.address] = 5;
    testWhitelist[whitelistAddress2.address] = 10;

    merkleRoot = merkleTreeGenerator(testWhitelist);

    // Reference ClonableERC1155
    const ClonableERC1155 = await ethers.getContractFactory("ClonableERC1155");
    referenceClonableERC1155 = await ClonableERC1155.deploy();
    await referenceClonableERC1155.initialize(
      'reference', //   string memory _tokenName,
      'REF', //   string memory _tokenSymbol,
      'ipfs://', //   string memory _tokenURI,
      deployerAddress.address, //   address _admin,
      deployerAddress.address, //   address _factory,
      miscAddress.address, //   address _minter
    );

    // Additional Reference ClonableERC1155
    additionalReferenceClonableERC1155 = await ClonableERC1155.deploy();
    await referenceClonableERC1155.initialize(
      'reference', //   string memory _tokenName,
      'REF', //   string memory _tokenSymbol,
      'ipfs://', //   string memory _tokenURI,
      deployerAddress.address, //   address _admin,
      deployerAddress.address, //   address _factory,
      miscAddress.address, //   address _minter
    );

    // Reference ClonableMerkleAirdropMinimalERC1155
    const ClonableMerkleAirdropMinimalERC1155 = await ethers.getContractFactory("ClonableMerkleAirdropMinimalERC1155");
    referenceClonableMerkleAirdropMinimalERC1155 = await ClonableMerkleAirdropMinimalERC1155.deploy();
    await referenceClonableMerkleAirdropMinimalERC1155.initialize(
      miscAddress.address, // address _merkleProofWhitelist,
      referenceClonableERC1155.address, // address _tokenContract,
      1, // uint256 _tokenId,
      Math.floor(new Date().getTime() / 1000), // uint256 _startTime,
      Math.floor(new Date().getTime() / 1000), // uint256 _endTime
      deployerAddress.address,
      payoutAddress.address,
    );

    // Additional Reference ClonableMerkleAirdropMinimalERC1155
    additionalReferenceClonableMerkleAirdropMinimalERC1155 = await ClonableMerkleAirdropMinimalERC1155.deploy();
    await additionalReferenceClonableMerkleAirdropMinimalERC1155.initialize(
      miscAddress.address, // address _merkleProofWhitelist,
      referenceClonableERC1155.address, // address _tokenContract,
      1, // uint256 _tokenId,
      Math.floor(new Date().getTime() / 1000), // uint256 _startTime,
      Math.floor(new Date().getTime() / 1000), // uint256 _endTime
      deployerAddress.address,
      payoutAddress.address
    );

    // Reference ClonableMerkleWhitelist
    const ClonableMerkleWhitelist = await ethers.getContractFactory("ClonableMerkleWhitelist");
    referenceClonableMerkleWhitelist = await ClonableMerkleWhitelist.deploy();
    await referenceClonableMerkleWhitelist.initialize(
      merkleRoot // bytes32 _merkleRoot
    );

    // Additional Reference ClonableMerkleWhitelist
    additionalReferenceClonableMerkleWhitelist = await ClonableMerkleWhitelist.deploy();
    await additionalReferenceClonableMerkleWhitelist.initialize(
      merkleRoot // bytes32 _merkleRoot
    );

    const MerkleProofAirdropFactory = await ethers.getContractFactory("MerkleProofAirdropFactory");
    merkleProofAirdropFactory = await MerkleProofAirdropFactory.deploy(
      referenceClonableERC1155.address, // address _clonableERC1155,
      referenceClonableMerkleAirdropMinimalERC1155.address, // address _clonableMerkleAirdrop,
      referenceClonableMerkleWhitelist.address // address _clonableMerkleWhitelist);
    );

  });
  context("function newMerkleAirdropAndWhitelistAndERC1155", async function () {
    it("Should allow a new merkle airdrop, whitelist & ERC1155 to be deployed", async function () {
      // function newMerkleAirdropAndWhitelistAndERC1155(
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
      await expect(merkleProofAirdropFactory.newMerkleAirdropAndWhitelistAndERC1155(
        referenceClonableMerkleAirdropMinimalERC1155.address,
        referenceClonableMerkleWhitelist.address,
        referenceClonableERC1155.address,
        merkleRoot,
        Math.floor(new Date().getTime() / 1000), // uint256 _startTime,
        0,
        'Testoken', //   string memory _tokenName,
        'TEST', //   string memory _tokenSymbol,
        'ipfs://',
        deployerAddress.address,
        payoutAddress.address
      )).to.emit(merkleProofAirdropFactory, "NewMerkle1155AirdropClone");
    });
  });
  context("function newMerkleAirdropAndWhitelist", async function () {
    it("Should allow an existing airdrop token address to be reused on a new airdrop", async function () {

      let txWithNewToken = await merkleProofAirdropFactory.newMerkleAirdropAndWhitelistAndERC1155(
        referenceClonableMerkleAirdropMinimalERC1155.address,
        referenceClonableMerkleWhitelist.address,
        referenceClonableERC1155.address,
        merkleRoot,
        Math.floor(new Date().getTime() / 1000), // uint256 _startTime,
        0,
        'Testoken', //   string memory _tokenName,
        'TEST', //   string memory _tokenSymbol,
        'ipfs://',
        deployerAddress.address,
        payoutAddress.address
      );

      let txWithNewTokenResponse = await txWithNewToken.wait();

      let eventNewERC1155Clone = txWithNewTokenResponse.events.find((item) => item.event === 'NewERC1155Clone');
      let eventNewMerkle1155AirdropCloneFirst = txWithNewTokenResponse.events.find((item) => item.event === 'NewMerkle1155AirdropClone');

      lastERC1155ContractAddress = eventNewERC1155Clone.args.erc1155Clone;
      lastAirdropContractAddress = eventNewMerkle1155AirdropCloneFirst.args.airdropClone;

      const NewAirdropFirst = await ethers.getContractFactory("ClonableMerkleAirdropMinimalERC1155");
      let newAirdropFirst = await NewAirdropFirst.attach(lastAirdropContractAddress);

      let merkleProofFirst = await merkleTreeGenerateProof(testWhitelist, whitelistAddress1.address, testWhitelist[whitelistAddress1.address]);

      let mintTxFirst = await newAirdropFirst.mintMerkleWhitelist(
        merkleProofFirst,
        testWhitelist[whitelistAddress1.address],
        whitelistAddress1.address,
        whitelistAddress1.address
      );

      mintTxResponse = await mintTxFirst.wait();

      const ClonableERC1155First = await ethers.getContractFactory("ClonableERC1155");
      const clonableERC1155First = await ClonableERC1155First.attach(lastERC1155ContractAddress);

      await expect(await clonableERC1155First.balanceOf(whitelistAddress1.address, 1)).to.equal(testWhitelist[whitelistAddress1.address]);

      // address _airdropReferenceContract,
      // address _whitelistReferenceContract,
      // bytes32 _merkleRoot,
      // uint256 _startTime,
      // uint256 _endTime,
      // address _tokenContract,
      // uint256 _tokenId
      let tx = await merkleProofAirdropFactory.newMerkleAirdropAndWhitelist(
        referenceClonableMerkleAirdropMinimalERC1155.address,
        referenceClonableMerkleWhitelist.address,
        merkleRoot,
        Math.floor(new Date().getTime() / 1000), // uint256 _startTime,
        0,
        lastERC1155ContractAddress,
        2,
        'ipfs://',
        deployerAddress.address,
        payoutAddress.address
      );

      let txResponse = await tx.wait();

      let eventNewMerkle1155AirdropClone = txResponse.events.find((item) => item.event === 'NewMerkle1155AirdropClone');

      lastAirdropContractAddress = eventNewMerkle1155AirdropClone.args.airdropClone;

      const NewAirdrop = await ethers.getContractFactory("ClonableMerkleAirdropMinimalERC1155");
      let newAirdrop = await NewAirdrop.attach(lastAirdropContractAddress);

      let merkleProof = await merkleTreeGenerateProof(testWhitelist, whitelistAddress1.address, testWhitelist[whitelistAddress1.address]);

      let mintTx = await newAirdrop.mintMerkleWhitelist(
        merkleProof,
        testWhitelist[whitelistAddress1.address],
        whitelistAddress1.address,
        whitelistAddress1.address
      );

      mintTxResponse = await mintTx.wait();

      const ClonableERC1155 = await ethers.getContractFactory("ClonableERC1155");
      const clonableERC1155 = await ClonableERC1155.attach(lastERC1155ContractAddress);

      await expect(await clonableERC1155.balanceOf(whitelistAddress1.address, 2)).to.equal(testWhitelist[whitelistAddress1.address]);
    });
    it("Should not allow an invalid airdrop reference contract to be used", async function () {

      let txWithNewToken = await merkleProofAirdropFactory.newMerkleAirdropAndWhitelistAndERC1155(
        referenceClonableMerkleAirdropMinimalERC1155.address,
        referenceClonableMerkleWhitelist.address,
        referenceClonableERC1155.address,
        merkleRoot,
        Math.floor(new Date().getTime() / 1000), // uint256 _startTime,
        0,
        'Testoken', //   string memory _tokenName,
        'TEST', //   string memory _tokenSymbol,
        'ipfs://',
        deployerAddress.address,
        payoutAddress.address
      );

      let txWithNewTokenResponse = await txWithNewToken.wait();

      let eventNewERC1155Clone = txWithNewTokenResponse.events.find((item) => item.event === 'NewERC1155Clone');
      let eventNewMerkle1155AirdropCloneFirst = txWithNewTokenResponse.events.find((item) => item.event === 'NewMerkle1155AirdropClone');

      lastERC1155ContractAddress = eventNewERC1155Clone.args.erc1155Clone;
      lastAirdropContractAddress = eventNewMerkle1155AirdropCloneFirst.args.airdropClone;

      const NewAirdropFirst = await ethers.getContractFactory("ClonableMerkleAirdropMinimalERC1155");
      let newAirdropFirst = await NewAirdropFirst.attach(lastAirdropContractAddress);

      let merkleProofFirst = await merkleTreeGenerateProof(testWhitelist, whitelistAddress1.address, testWhitelist[whitelistAddress1.address]);

      let mintTxFirst = await newAirdropFirst.mintMerkleWhitelist(
        merkleProofFirst,
        testWhitelist[whitelistAddress1.address],
        whitelistAddress1.address,
        whitelistAddress1.address
      );

      mintTxResponse = await mintTxFirst.wait();

      const ClonableERC1155First = await ethers.getContractFactory("ClonableERC1155");
      const clonableERC1155First = await ClonableERC1155First.attach(lastERC1155ContractAddress);

      await expect(await clonableERC1155First.balanceOf(whitelistAddress1.address, 1)).to.equal(testWhitelist[whitelistAddress1.address]);

      await expect(merkleProofAirdropFactory.newMerkleAirdropAndWhitelist(
        additionalReferenceClonableMerkleAirdropMinimalERC1155.address,
        referenceClonableMerkleWhitelist.address,
        merkleRoot,
        Math.floor(new Date().getTime() / 1000), // uint256 _startTime,
        0,
        lastERC1155ContractAddress,
        2,
        'ipfs://',
        deployerAddress.address,
        payoutAddress.address
      )).to.be.revertedWith("INVALID_AIRDROP_REFERENCE_CONTRACT");

    });
    it("Should not allow an invalid whitelist reference contract to be used", async function () {

      let txWithNewToken = await merkleProofAirdropFactory.newMerkleAirdropAndWhitelistAndERC1155(
        referenceClonableMerkleAirdropMinimalERC1155.address,
        referenceClonableMerkleWhitelist.address,
        referenceClonableERC1155.address,
        merkleRoot,
        Math.floor(new Date().getTime() / 1000), // uint256 _startTime,
        0,
        'Testoken', //   string memory _tokenName,
        'TEST', //   string memory _tokenSymbol,
        'ipfs://',
        deployerAddress.address,
        payoutAddress.address
      );

      let txWithNewTokenResponse = await txWithNewToken.wait();

      let eventNewERC1155Clone = txWithNewTokenResponse.events.find((item) => item.event === 'NewERC1155Clone');
      let eventNewMerkle1155AirdropCloneFirst = txWithNewTokenResponse.events.find((item) => item.event === 'NewMerkle1155AirdropClone');

      lastERC1155ContractAddress = eventNewERC1155Clone.args.erc1155Clone;
      lastAirdropContractAddress = eventNewMerkle1155AirdropCloneFirst.args.airdropClone;

      const NewAirdropFirst = await ethers.getContractFactory("ClonableMerkleAirdropMinimalERC1155");
      let newAirdropFirst = await NewAirdropFirst.attach(lastAirdropContractAddress);

      let merkleProofFirst = await merkleTreeGenerateProof(testWhitelist, whitelistAddress1.address, testWhitelist[whitelistAddress1.address]);

      let mintTxFirst = await newAirdropFirst.mintMerkleWhitelist(
        merkleProofFirst,
        testWhitelist[whitelistAddress1.address],
        whitelistAddress1.address,
        whitelistAddress1.address
      );

      mintTxResponse = await mintTxFirst.wait();

      const ClonableERC1155First = await ethers.getContractFactory("ClonableERC1155");
      const clonableERC1155First = await ClonableERC1155First.attach(lastERC1155ContractAddress);

      await expect(await clonableERC1155First.balanceOf(whitelistAddress1.address, 1)).to.equal(testWhitelist[whitelistAddress1.address]);

      await expect(merkleProofAirdropFactory.newMerkleAirdropAndWhitelist(
        referenceClonableMerkleAirdropMinimalERC1155.address,
        additionalReferenceClonableMerkleWhitelist.address,
        merkleRoot,
        Math.floor(new Date().getTime() / 1000), // uint256 _startTime,
        0,
        lastERC1155ContractAddress,
        2,
        'ipfs://',
        deployerAddress.address,
        payoutAddress.address
      )).to.be.revertedWith("INVALID_WHITELIST_REFERENCE_CONTRACT");

    });
  });
  context("function newMerkleAirdrop", async function () {
    it("Should allow an existing airdrop token address & whitelist address to be reused on a new airdrop", async function () {

      let txWithNewToken = await merkleProofAirdropFactory.newMerkleAirdropAndWhitelistAndERC1155(
        referenceClonableMerkleAirdropMinimalERC1155.address,
        referenceClonableMerkleWhitelist.address,
        referenceClonableERC1155.address,
        merkleRoot,
        Math.floor(new Date().getTime() / 1000), // uint256 _startTime,
        0,
        'Testoken', //   string memory _tokenName,
        'TEST', //   string memory _tokenSymbol,
        'ipfs://',
        deployerAddress.address,
        payoutAddress.address
      );

      let txWithNewTokenResponse = await txWithNewToken.wait();

      let eventNewERC1155Clone = txWithNewTokenResponse.events.find((item) => item.event === 'NewERC1155Clone');
      let eventNewMerkle1155AirdropCloneFirst = txWithNewTokenResponse.events.find((item) => item.event === 'NewMerkle1155AirdropClone');

      lastERC1155ContractAddress = eventNewERC1155Clone.args.erc1155Clone;
      lastAirdropContractAddress = eventNewMerkle1155AirdropCloneFirst.args.airdropClone;
      lastWhitelistContractAddress = eventNewMerkle1155AirdropCloneFirst.args.merkleProofWhitelist;

      const NewAirdropFirst = await ethers.getContractFactory("ClonableMerkleAirdropMinimalERC1155");
      let newAirdropFirst = await NewAirdropFirst.attach(lastAirdropContractAddress);

      let merkleProofFirst = await merkleTreeGenerateProof(testWhitelist, whitelistAddress1.address, testWhitelist[whitelistAddress1.address]);

      let mintTxFirst = await newAirdropFirst.mintMerkleWhitelist(
        merkleProofFirst,
        testWhitelist[whitelistAddress1.address],
        whitelistAddress1.address,
        whitelistAddress1.address
      );

      mintTxResponse = await mintTxFirst.wait();

      const ClonableERC1155First = await ethers.getContractFactory("ClonableERC1155");
      const clonableERC1155First = await ClonableERC1155First.attach(lastERC1155ContractAddress);

      await expect(await clonableERC1155First.balanceOf(whitelistAddress1.address, 1)).to.equal(testWhitelist[whitelistAddress1.address]);

      // address _airdropReferenceContract,
      // address _whitelistContract,
      // address _tokenContract,
      // uint256 _tokenId,
      // uint256 _startTime,
      // uint256 _endTime
      let tx = await merkleProofAirdropFactory.newMerkleAirdrop(
        referenceClonableMerkleAirdropMinimalERC1155.address,
        lastWhitelistContractAddress,
        lastERC1155ContractAddress,
        2,
        Math.floor(new Date().getTime() / 1000), // uint256 _startTime,
        0,
        deployerAddress.address,
        payoutAddress.address
      );

      let txResponse = await tx.wait();

      let eventNewMerkle1155AirdropClone = txResponse.events.find((item) => item.event === 'NewMerkle1155AirdropClone');

      lastAirdropContractAddress = eventNewMerkle1155AirdropClone.args.airdropClone;

      const NewAirdrop = await ethers.getContractFactory("ClonableMerkleAirdropMinimalERC1155");
      let newAirdrop = await NewAirdrop.attach(lastAirdropContractAddress);

      let merkleProof = await merkleTreeGenerateProof(testWhitelist, whitelistAddress1.address, testWhitelist[whitelistAddress1.address]);

      let mintTx = await newAirdrop.mintMerkleWhitelist(
        merkleProof,
        testWhitelist[whitelistAddress1.address],
        whitelistAddress1.address,
        whitelistAddress1.address
      );

      mintTxResponse = await mintTx.wait();

      const ClonableERC1155 = await ethers.getContractFactory("ClonableERC1155");
      const clonableERC1155 = await ClonableERC1155.attach(lastERC1155ContractAddress);

      await expect(await clonableERC1155.balanceOf(whitelistAddress1.address, 2)).to.equal(testWhitelist[whitelistAddress1.address]);
    });
    it("Should not allow an invalid airdrop reference contract to be used", async function () {
      let txWithNewToken = await merkleProofAirdropFactory.newMerkleAirdropAndWhitelistAndERC1155(
        referenceClonableMerkleAirdropMinimalERC1155.address,
        referenceClonableMerkleWhitelist.address,
        referenceClonableERC1155.address,
        merkleRoot,
        Math.floor(new Date().getTime() / 1000), // uint256 _startTime,
        0,
        'Testoken', //   string memory _tokenName,
        'TEST', //   string memory _tokenSymbol,
        'ipfs://',
        deployerAddress.address,
        payoutAddress.address
      );

      let txWithNewTokenResponse = await txWithNewToken.wait();

      let eventNewERC1155Clone = txWithNewTokenResponse.events.find((item) => item.event === 'NewERC1155Clone');
      let eventNewMerkle1155AirdropCloneFirst = txWithNewTokenResponse.events.find((item) => item.event === 'NewMerkle1155AirdropClone');

      lastERC1155ContractAddress = eventNewERC1155Clone.args.erc1155Clone;
      lastAirdropContractAddress = eventNewMerkle1155AirdropCloneFirst.args.airdropClone;
      lastWhitelistContractAddress = eventNewMerkle1155AirdropCloneFirst.args.merkleProofWhitelist;

      const NewAirdropFirst = await ethers.getContractFactory("ClonableMerkleAirdropMinimalERC1155");
      let newAirdropFirst = await NewAirdropFirst.attach(lastAirdropContractAddress);

      let merkleProofFirst = await merkleTreeGenerateProof(testWhitelist, whitelistAddress1.address, testWhitelist[whitelistAddress1.address]);

      let mintTxFirst = await newAirdropFirst.mintMerkleWhitelist(
        merkleProofFirst,
        testWhitelist[whitelistAddress1.address],
        whitelistAddress1.address,
        whitelistAddress1.address
      );

      mintTxResponse = await mintTxFirst.wait();

      const ClonableERC1155First = await ethers.getContractFactory("ClonableERC1155");
      const clonableERC1155First = await ClonableERC1155First.attach(lastERC1155ContractAddress);

      await expect(await clonableERC1155First.balanceOf(whitelistAddress1.address, 1)).to.equal(testWhitelist[whitelistAddress1.address]);

      // address _airdropReferenceContract,
      // address _whitelistContract,
      // address _tokenContract,
      // uint256 _tokenId,
      // uint256 _startTime,
      // uint256 _endTime
      await expect(merkleProofAirdropFactory.newMerkleAirdrop(
        additionalReferenceClonableMerkleAirdropMinimalERC1155.address,
        lastWhitelistContractAddress,
        lastERC1155ContractAddress,
        2,
        Math.floor(new Date().getTime() / 1000), // uint256 _startTime,
        0,
        deployerAddress.address,
        payoutAddress.address
      )).to.be.revertedWith("INVALID_AIRDROP_REFERENCE_CONTRACT");
    });
    it("Should should set the provided admin address as the owner of the airdrop contract", async function () {
      let txWithNewToken = await merkleProofAirdropFactory.newMerkleAirdropAndWhitelistAndERC1155(
        referenceClonableMerkleAirdropMinimalERC1155.address,
        referenceClonableMerkleWhitelist.address,
        referenceClonableERC1155.address,
        merkleRoot,
        Math.floor(new Date().getTime() / 1000), // uint256 _startTime,
        0,
        'Testoken', //   string memory _tokenName,
        'TEST', //   string memory _tokenSymbol,
        'ipfs://',
        deployerAddress.address,
        payoutAddress.address
      );

      let txWithNewTokenResponse = await txWithNewToken.wait();

      let eventNewERC1155Clone = txWithNewTokenResponse.events.find((item) => item.event === 'NewERC1155Clone');
      let eventNewMerkle1155AirdropCloneFirst = txWithNewTokenResponse.events.find((item) => item.event === 'NewMerkle1155AirdropClone');

      lastERC1155ContractAddress = eventNewERC1155Clone.args.erc1155Clone;
      lastAirdropContractAddress = eventNewMerkle1155AirdropCloneFirst.args.airdropClone;
      lastWhitelistContractAddress = eventNewMerkle1155AirdropCloneFirst.args.merkleProofWhitelist;

      const NewAirdropFirst = await ethers.getContractFactory("ClonableMerkleAirdropMinimalERC1155");
      let newAirdropFirst = await NewAirdropFirst.attach(lastAirdropContractAddress);

      let merkleProofFirst = await merkleTreeGenerateProof(testWhitelist, whitelistAddress1.address, testWhitelist[whitelistAddress1.address]);

      let mintTxFirst = await newAirdropFirst.mintMerkleWhitelist(
        merkleProofFirst,
        testWhitelist[whitelistAddress1.address],
        whitelistAddress1.address,
        whitelistAddress1.address
      );

      mintTxResponse = await mintTxFirst.wait();

      const ClonableERC1155First = await ethers.getContractFactory("ClonableERC1155");
      const clonableERC1155First = await ClonableERC1155First.attach(lastERC1155ContractAddress);

      await expect(await clonableERC1155First.balanceOf(whitelistAddress1.address, 1)).to.equal(testWhitelist[whitelistAddress1.address]);

      // address _airdropReferenceContract,
      // address _whitelistContract,
      // address _tokenContract,
      // uint256 _tokenId,
      // uint256 _startTime,
      // uint256 _endTime
      let tx = await merkleProofAirdropFactory.newMerkleAirdrop(
        referenceClonableMerkleAirdropMinimalERC1155.address,
        lastWhitelistContractAddress,
        lastERC1155ContractAddress,
        2,
        Math.floor(new Date().getTime() / 1000), // uint256 _startTime,
        0,
        deployerAddress.address,
        payoutAddress.address
      );

      let txResponse = await tx.wait();

      let eventNewMerkle1155AirdropClone = txResponse.events.find((item) => item.event === 'NewMerkle1155AirdropClone');

      lastAirdropContractAddress = eventNewMerkle1155AirdropClone.args.airdropClone;

      const NewAirdrop = await ethers.getContractFactory("ClonableMerkleAirdropMinimalERC1155");
      let newAirdrop = await NewAirdrop.attach(lastAirdropContractAddress);

      expect(await newAirdrop.owner()).to.equal(deployerAddress.address);
    })
  });
  context("function newMerkleWhitelist", async function () {
    it("Should allow an new merkle whitelist to be deployed", async function () {

      expect(await merkleProofAirdropFactory.newMerkleWhitelist(
        referenceClonableMerkleWhitelist.address,
        merkleRoot,
      )).to.emit(merkleProofAirdropFactory, "NewMerkleWhitelistClone")
      
    });
    it("Should not allow an new merkle whitelist to be deployed with an invalid whitelist reference address", async function () {

      await expect(merkleProofAirdropFactory.newMerkleWhitelist(
        additionalReferenceClonableMerkleWhitelist.address,
        merkleRoot,
      )).to.be.revertedWith("INVALID_WHITELIST_REFERENCE_CONTRACT");
      
    });
  });
  context("function newERC1155", async function () {
    it("Should allow an new ERC1155 to be deployed", async function () {

      expect(await merkleProofAirdropFactory.newERC1155(
        referenceClonableERC1155.address,
        'Testoken', //   string memory _tokenName,
        'TEST', //   string memory _tokenSymbol,
        'ipfs://',
        deployerAddress.address,
        deployerAddress.address
      )).to.emit(merkleProofAirdropFactory, "NewERC1155Clone")
      
    });
    it("Should not allow a new ERC1155 to be deployed with an invalid ERC1155 reference address", async function () {

      await expect(merkleProofAirdropFactory.newERC1155(
        additionalReferenceClonableERC1155.address,
        'Testoken', //   string memory _tokenName,
        'TEST', //   string memory _tokenSymbol,
        'ipfs://',
        deployerAddress.address,
        deployerAddress.address
      )).to.be.revertedWith("INVALID_ERC1155_REFERENCE_CONTRACT");
      
    });
    it("Should set the supplied admin address as the owner of the new ERC1155 contract", async function () {

      let tx = await merkleProofAirdropFactory.newERC1155(
        referenceClonableERC1155.address,
        'Testoken', //   string memory _tokenName,
        'TEST', //   string memory _tokenSymbol,
        'ipfs://',
        deployerAddress.address,
        deployerAddress.address
      );

      let txResponse = await tx.wait();

      let eventNewMerkleERC1155 = txResponse.events.find((item) => item.event === 'NewERC1155Clone');

      const ClonableERC1155 = await ethers.getContractFactory("ClonableERC1155");

      let newERC1155 = await ClonableERC1155.attach(eventNewMerkleERC1155.args.erc1155Clone);
      
      expect(await newERC1155.owner()).to.equal(deployerAddress.address);
      
    });
  });
  context("function mintMerkleWhitelist", async function () {
    it("Should subsequently allow whitelisted claimants to mint their allocation of the token", async function () {

      let tx = await merkleProofAirdropFactory.newMerkleAirdropAndWhitelistAndERC1155(
        referenceClonableMerkleAirdropMinimalERC1155.address,
        referenceClonableMerkleWhitelist.address,
        referenceClonableERC1155.address,
        merkleRoot,
        Math.floor(new Date().getTime() / 1000), // uint256 _startTime,
        0,
        'Testoken', //   string memory _tokenName,
        'TEST', //   string memory _tokenSymbol,
        'ipfs://',
        deployerAddress.address,
        payoutAddress.address
      );

      let txResponse = await tx.wait();

      let eventNewERC1155Clone = txResponse.events.find((item) => item.event === 'NewERC1155Clone');
      let eventNewMerkle1155AirdropClone = txResponse.events.find((item) => item.event === 'NewMerkle1155AirdropClone');

      lastERC1155ContractAddress = eventNewERC1155Clone.args.erc1155Clone;
      lastAirdropContractAddress = eventNewMerkle1155AirdropClone.args.airdropClone;

      const NewAirdrop = await ethers.getContractFactory("ClonableMerkleAirdropMinimalERC1155");
      let newAirdrop = await NewAirdrop.attach(lastAirdropContractAddress);

      let merkleProof = await merkleTreeGenerateProof(testWhitelist, whitelistAddress1.address, testWhitelist[whitelistAddress1.address]);

      let mintTx = await newAirdrop.connect(whitelistAddress1).mintMerkleWhitelist(
        merkleProof,
        testWhitelist[whitelistAddress1.address],
        whitelistAddress1.address,
        whitelistAddress1.address
      );

      mintTxResponse = await mintTx.wait();

      const ClonableERC1155 = await ethers.getContractFactory("ClonableERC1155");
      const clonableERC1155 = await ClonableERC1155.attach(lastERC1155ContractAddress);

      await expect(await clonableERC1155.balanceOf(whitelistAddress1.address, 1)).to.equal(testWhitelist[whitelistAddress1.address]);

    });
    it("Should only allow whitelisted claimants to mint their allocation of the token once", async function () {

      let tx = await merkleProofAirdropFactory.newMerkleAirdropAndWhitelistAndERC1155(
        referenceClonableMerkleAirdropMinimalERC1155.address,
        referenceClonableMerkleWhitelist.address,
        referenceClonableERC1155.address,
        merkleRoot,
        Math.floor(new Date().getTime() / 1000), // uint256 _startTime,
        0,
        'Testoken', //   string memory _tokenName,
        'TEST', //   string memory _tokenSymbol,
        'ipfs://',
        deployerAddress.address,
        payoutAddress.address
      );

      let txResponse = await tx.wait();

      let eventNewERC1155Clone = txResponse.events.find((item) => item.event === 'NewERC1155Clone');
      let eventNewMerkle1155AirdropClone = txResponse.events.find((item) => item.event === 'NewMerkle1155AirdropClone');

      lastERC1155ContractAddress = eventNewERC1155Clone.args.erc1155Clone;
      lastAirdropContractAddress = eventNewMerkle1155AirdropClone.args.airdropClone;

      const NewAirdrop = await ethers.getContractFactory("ClonableMerkleAirdropMinimalERC1155");
      let newAirdrop = await NewAirdrop.attach(lastAirdropContractAddress);

      let merkleProof = await merkleTreeGenerateProof(testWhitelist, whitelistAddress1.address, testWhitelist[whitelistAddress1.address]);

      await expect(newAirdrop.connect(whitelistAddress1).mintMerkleWhitelist(
        merkleProof,
        2,
        whitelistAddress1.address,
        whitelistAddress1.address
      )).to.be.revertedWith('INVALID_MERKLE_PROOF');

      let mintTx = await newAirdrop.connect(whitelistAddress1).mintMerkleWhitelist(
        merkleProof,
        testWhitelist[whitelistAddress1.address],
        whitelistAddress1.address,
        whitelistAddress1.address
      );

      mintTxResponse = await mintTx.wait();

      const ClonableERC1155 = await ethers.getContractFactory("ClonableERC1155");
      const clonableERC1155 = await ClonableERC1155.attach(lastERC1155ContractAddress);

      await expect(await clonableERC1155.balanceOf(whitelistAddress1.address, 1)).to.equal(testWhitelist[whitelistAddress1.address]);

      await expect(newAirdrop.connect(whitelistAddress1).mintMerkleWhitelist(
        merkleProof,
        testWhitelist[whitelistAddress1.address],
        whitelistAddress1.address,
        whitelistAddress1.address
      )).to.be.revertedWith('MERKLE_CLAIM_ALREADY_MADE');

      await expect(newAirdrop.connect(whitelistAddress1).mintMerkleWhitelist(
        merkleProof,
        testWhitelist[whitelistAddress1.address],
        whitelistAddress1.address,
        whitelistAddress2.address
      )).to.be.revertedWith('MERKLE_CLAIM_ALREADY_MADE');

    });
    it("Should allow another address to run a claim on behalf of a whitelisted claimant", async function () {

      let tx = await merkleProofAirdropFactory.newMerkleAirdropAndWhitelistAndERC1155(
        referenceClonableMerkleAirdropMinimalERC1155.address,
        referenceClonableMerkleWhitelist.address,
        referenceClonableERC1155.address,
        merkleRoot,
        Math.floor(new Date().getTime() / 1000), // uint256 _startTime,
        0,
        'Testoken', //   string memory _tokenName,
        'TEST', //   string memory _tokenSymbol,
        'ipfs://',
        deployerAddress.address,
        payoutAddress.address
      );

      let txResponse = await tx.wait();

      let eventNewERC1155Clone = txResponse.events.find((item) => item.event === 'NewERC1155Clone');
      let eventNewMerkle1155AirdropClone = txResponse.events.find((item) => item.event === 'NewMerkle1155AirdropClone');

      lastERC1155ContractAddress = eventNewERC1155Clone.args.erc1155Clone;
      lastAirdropContractAddress = eventNewMerkle1155AirdropClone.args.airdropClone;

      const NewAirdrop = await ethers.getContractFactory("ClonableMerkleAirdropMinimalERC1155");
      let newAirdrop = await NewAirdrop.attach(lastAirdropContractAddress);

      let merkleProof = await merkleTreeGenerateProof(testWhitelist, whitelistAddress1.address, testWhitelist[whitelistAddress1.address]);

      let mintTx = await newAirdrop.mintMerkleWhitelist(
        merkleProof,
        testWhitelist[whitelistAddress1.address],
        whitelistAddress1.address,
        whitelistAddress1.address
      );

      mintTxResponse = await mintTx.wait();

      const ClonableERC1155 = await ethers.getContractFactory("ClonableERC1155");
      const clonableERC1155 = await ClonableERC1155.attach(lastERC1155ContractAddress);

      await expect(await clonableERC1155.balanceOf(whitelistAddress1.address, 1)).to.equal(testWhitelist[whitelistAddress1.address]);

      await expect(newAirdrop.mintMerkleWhitelist(
        merkleProof,
        testWhitelist[whitelistAddress1.address],
        whitelistAddress1.address,
        whitelistAddress1.address
      )).to.be.revertedWith('MERKLE_CLAIM_ALREADY_MADE');

    });
    it("Should not allow another address to run a claim on behalf of a whitelisted claimant if the recipient is not the whitelisted claimant", async function () {

      let tx = await merkleProofAirdropFactory.newMerkleAirdropAndWhitelistAndERC1155(
        referenceClonableMerkleAirdropMinimalERC1155.address,
        referenceClonableMerkleWhitelist.address,
        referenceClonableERC1155.address,
        merkleRoot,
        Math.floor(new Date().getTime() / 1000), // uint256 _startTime,
        0,
        'Testoken', //   string memory _tokenName,
        'TEST', //   string memory _tokenSymbol,
        'ipfs://',
        deployerAddress.address,
        payoutAddress.address
      );

      let txResponse = await tx.wait();

      let eventNewERC1155Clone = txResponse.events.find((item) => item.event === 'NewERC1155Clone');
      let eventNewMerkle1155AirdropClone = txResponse.events.find((item) => item.event === 'NewMerkle1155AirdropClone');

      lastERC1155ContractAddress = eventNewERC1155Clone.args.erc1155Clone;
      lastAirdropContractAddress = eventNewMerkle1155AirdropClone.args.airdropClone;

      const NewAirdrop = await ethers.getContractFactory("ClonableMerkleAirdropMinimalERC1155");
      let newAirdrop = await NewAirdrop.attach(lastAirdropContractAddress);

      let merkleProof = await merkleTreeGenerateProof(testWhitelist, whitelistAddress1.address, testWhitelist[whitelistAddress1.address]);
      
      await expect(newAirdrop.mintMerkleWhitelist(
        merkleProof,
        testWhitelist[whitelistAddress1.address],
        whitelistAddress1.address,
        whitelistAddress2.address
      )).to.be.revertedWith('INVALID_MERKLE_PROOF');

    })
  });
  context("function setClonableAirdropReferenceValidity", async function () {
    it("Should allow new airdrop reference contracts to be added and removed", async function () {

      await expect(merkleProofAirdropFactory.newMerkleAirdropAndWhitelistAndERC1155(
        additionalReferenceClonableMerkleAirdropMinimalERC1155.address,
        referenceClonableMerkleWhitelist.address,
        referenceClonableERC1155.address,
        merkleRoot,
        Math.floor(new Date().getTime() / 1000), // uint256 _startTime,
        0,
        'Testoken', //   string memory _tokenName,
        'TEST', //   string memory _tokenSymbol,
        'ipfs://',
        deployerAddress.address,
        payoutAddress.address
      )).to.be.revertedWith("INVALID_AIRDROP_REFERENCE_CONTRACT");

      await merkleProofAirdropFactory.setClonableAirdropReferenceValidity(additionalReferenceClonableMerkleAirdropMinimalERC1155.address, true);

      await expect(merkleProofAirdropFactory.newMerkleAirdropAndWhitelistAndERC1155(
        additionalReferenceClonableMerkleAirdropMinimalERC1155.address,
        referenceClonableMerkleWhitelist.address,
        referenceClonableERC1155.address,
        merkleRoot,
        Math.floor(new Date().getTime() / 1000), // uint256 _startTime,
        0,
        'Testoken', //   string memory _tokenName,
        'TEST', //   string memory _tokenSymbol,
        'ipfs://',
        deployerAddress.address,
        payoutAddress.address
      )).to.emit(merkleProofAirdropFactory, "NewMerkle1155AirdropClone");

      await merkleProofAirdropFactory.setClonableAirdropReferenceValidity(additionalReferenceClonableMerkleAirdropMinimalERC1155.address, false);

      await expect(merkleProofAirdropFactory.newMerkleAirdropAndWhitelistAndERC1155(
        additionalReferenceClonableMerkleAirdropMinimalERC1155.address,
        referenceClonableMerkleWhitelist.address,
        referenceClonableERC1155.address,
        merkleRoot,
        Math.floor(new Date().getTime() / 1000), // uint256 _startTime,
        0,
        'Testoken', //   string memory _tokenName,
        'TEST', //   string memory _tokenSymbol,
        'ipfs://',
        deployerAddress.address,
        payoutAddress.address
      )).to.be.revertedWith("INVALID_AIRDROP_REFERENCE_CONTRACT");
    });
  });
  context("function setClonableWhitelistReferenceValidity", async function () {
    it("Should allow new whitelist reference contracts to be added and removed", async function () {

      await expect(merkleProofAirdropFactory.newMerkleAirdropAndWhitelistAndERC1155(
        referenceClonableMerkleAirdropMinimalERC1155.address,
        additionalReferenceClonableMerkleWhitelist.address,
        referenceClonableERC1155.address,
        merkleRoot,
        Math.floor(new Date().getTime() / 1000), // uint256 _startTime,
        0,
        'Testoken', //   string memory _tokenName,
        'TEST', //   string memory _tokenSymbol,
        'ipfs://',
        deployerAddress.address,
        payoutAddress.address
      )).to.be.revertedWith("INVALID_WHITELIST_REFERENCE_CONTRACT");

      await merkleProofAirdropFactory.setClonableWhitelistReferenceValidity(additionalReferenceClonableMerkleWhitelist.address, true);

      await expect(merkleProofAirdropFactory.newMerkleAirdropAndWhitelistAndERC1155(
        referenceClonableMerkleAirdropMinimalERC1155.address,
        additionalReferenceClonableMerkleWhitelist.address,
        referenceClonableERC1155.address,
        merkleRoot,
        Math.floor(new Date().getTime() / 1000), // uint256 _startTime,
        0,
        'Testoken', //   string memory _tokenName,
        'TEST', //   string memory _tokenSymbol,
        'ipfs://',
        deployerAddress.address,
        payoutAddress.address
      )).to.emit(merkleProofAirdropFactory, "NewMerkle1155AirdropClone");

      await merkleProofAirdropFactory.setClonableWhitelistReferenceValidity(additionalReferenceClonableMerkleWhitelist.address, false);

      await expect(merkleProofAirdropFactory.newMerkleAirdropAndWhitelistAndERC1155(
        referenceClonableMerkleAirdropMinimalERC1155.address,
        additionalReferenceClonableMerkleWhitelist.address,
        referenceClonableERC1155.address,
        merkleRoot,
        Math.floor(new Date().getTime() / 1000), // uint256 _startTime,
        0,
        'Testoken', //   string memory _tokenName,
        'TEST', //   string memory _tokenSymbol,
        'ipfs://',
        deployerAddress.address,
        payoutAddress.address
      )).to.be.revertedWith("INVALID_WHITELIST_REFERENCE_CONTRACT");
    });
  });
  context("function setClonableERC1155ReferenceValidity", async function () {
    it("Should allow new whitelist reference contracts to be added and removed", async function () {
      await expect(merkleProofAirdropFactory.newMerkleAirdropAndWhitelistAndERC1155(
        referenceClonableMerkleAirdropMinimalERC1155.address,
        referenceClonableMerkleWhitelist.address,
        additionalReferenceClonableERC1155.address,
        merkleRoot,
        Math.floor(new Date().getTime() / 1000), // uint256 _startTime,
        0,
        'Testoken', //   string memory _tokenName,
        'TEST', //   string memory _tokenSymbol,
        'ipfs://',
        deployerAddress.address,
        payoutAddress.address
      )).to.be.revertedWith("INVALID_ERC1155_REFERENCE_CONTRACT");

      await merkleProofAirdropFactory.setClonableERC1155ReferenceValidity(additionalReferenceClonableERC1155.address, true);

      await expect(merkleProofAirdropFactory.newMerkleAirdropAndWhitelistAndERC1155(
        referenceClonableMerkleAirdropMinimalERC1155.address,
        referenceClonableMerkleWhitelist.address,
        additionalReferenceClonableERC1155.address,
        merkleRoot,
        Math.floor(new Date().getTime() / 1000), // uint256 _startTime,
        0,
        'Testoken', //   string memory _tokenName,
        'TEST', //   string memory _tokenSymbol,
        'ipfs://',
        deployerAddress.address,
        payoutAddress.address
      )).to.emit(merkleProofAirdropFactory, "NewMerkle1155AirdropClone");

      await merkleProofAirdropFactory.setClonableERC1155ReferenceValidity(additionalReferenceClonableERC1155.address, false);

      await expect(merkleProofAirdropFactory.newMerkleAirdropAndWhitelistAndERC1155(
        referenceClonableMerkleAirdropMinimalERC1155.address,
        referenceClonableMerkleWhitelist.address,
        additionalReferenceClonableERC1155.address,
        merkleRoot,
        Math.floor(new Date().getTime() / 1000), // uint256 _startTime,
        0,
        'Testoken', //   string memory _tokenName,
        'TEST', //   string memory _tokenSymbol,
        'ipfs://',
        deployerAddress.address,
        payoutAddress.address
      )).to.be.revertedWith("INVALID_ERC1155_REFERENCE_CONTRACT");
    });
  });
});
