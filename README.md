# Merkle Proof Airdrop Factory (ERC1155 airdrops)

A collection of contracts which together form an airdrop factory for new ERC1155 airdrops to be cost-effectively launched (each new airdrop uses clones instead of deploying whole new logic contracts), claims are made via Merkle Proofs. This seeks to help projects which run ERC1155 airdrops on a semi-regular basis.

Factory operators have the option of whether each new airdrop should make use of an existing or new ERC1155 contract and whether or not to make use of an existing or new MerkleProof whitelist (i.e. new airdrop contracts deployed by the factory can make use of previously deployed whitelist & ERC1155 contracts, or new airdrops can be deployed which come with a fresh ERC1155 and/or whitelist contract).

These ERC1155 contracts are also compliant with ERC2981.

# Scripts

## scripts/deployment.js

Typically, this is the first script which would be run - each project making use of this repository would likely only need to ever run this script once (results in a reusable factory contract and cloneable reference contracts).

This script is used to deploy all required reference contracts as well as the airdrop factory contract which leverages the reference contracts for cloning.

It is not important to change the variables provided to the reference contracts' `initialize` functions, since clones deployed by the factory won't be concerned with these values.

**The outputted contract addresses during deployment should be added to the `/utils/contractAddresses.js` file.**
## scripts/new-airdrop-new-token.js

Typically, this script would be run whenever a project wants a fresh token contract to be deployed along with their airdrop contract (i.e. has not deployed a token contract via the factory before or when it isn't desired to reuse an existing token contract deployed by the factory).

This script makes use of the resultant factory contract and reference contracts derived from running `scripts/deployment.js`, in order to cost-effectively deploy functional airdrop contracts using clones.

This script results in a fresh airdrop contract as well as a fresh token contract (ERC1155).

**It is important to change the variables in the [`networkToAirdropConfig`](https://github.com/JayWelsh/merkle-proof-airdrop-factory-ERC1155/blob/main/scripts/new-airdrop-new-token.js#L25) object in the `scripts/new-airdrop-new-token.js` file to match the required setup of your airdrop.**

## scripts/new-airdrop-reuse-token.js

Typically, this script would be run whenever a project wants a fresh airdrop contract but not a fresh token contract (i.e. has already deployed token contract via `scripts/new-airdrop-new-token.js` and wants to make use of the same token contract from a fresh airdrop).

This script makes use of the resultant factory contract and reference contracts derived from running `scripts/deployment.js`, as well as a token contract deployed by `scripts/new-airdrop-new-token.js`, in order to cost-effectively deploy functional airdrop contracts using clones which make use of an existing token contract.

This script results in a fresh airdrop contract and reuses an existing token contract (ERC1155).

**It is important to change the variables in the [`networkToAirdropConfig`](https://github.com/JayWelsh/merkle-proof-airdrop-factory-ERC1155/blob/main/scripts/new-airdrop-reuse-token.js#L23) object in the `scripts/new-airdrop-reuse-token.js` file to match the required setup of your airdrop.**

**This script is built to make use of an existing token contract which was deployed by the `scripts/new-airdrop-new-token.js` script, attempting to use this script with an externally deployed token contract is unlikely to work since the new airdrop contract needs to be granted minting permissions via [line 187](https://github.com/JayWelsh/merkle-proof-airdrop-factory-ERC1155/blob/main/contracts/MerkleAirdropFactory.sol#L187) of `contracts/MerkleAirdropFactory.sol`**