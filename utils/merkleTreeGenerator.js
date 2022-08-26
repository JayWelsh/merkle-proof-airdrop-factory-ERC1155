const { MerkleTree } = require('merkletreejs')
const ethers = require('ethers');

const merkleTreeGenerator = async (whitelist) => {
  const leaves = Object.entries(whitelist).map((x) =>  {
    return ethers.utils.solidityKeccak256(["address", "uint96"], [x[0], x[1]]);
  });
  const tree = new MerkleTree(leaves, ethers.utils.keccak256, { sortPairs: true });
  const root = tree.getRoot().toString('hex');
  return '0x' + root;
}

const merkleTreeGenerateProof = async (whitelist, ethAddress, amount) => {
  const leaves = Object.entries(whitelist).map((x) =>  {
    return ethers.utils.solidityKeccak256(["address", "uint96"], [x[0], x[1]]);
  });
  const tree = new MerkleTree(leaves, ethers.utils.keccak256, { sortPairs: true });
  const leaf = ethers.utils.solidityKeccak256(["address", "uint96"], [ethAddress, amount]);
  const proof = tree.getHexProof(leaf);
  return proof;
}

module.exports = {
  merkleTreeGenerator,
  merkleTreeGenerateProof
};