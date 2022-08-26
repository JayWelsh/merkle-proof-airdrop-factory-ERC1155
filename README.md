# Merkle Proof Airdrop Factory (ERC1155 airdrops)

A collection of contracts which together form an airdrop factory for new ERC1155 airdrops to be cost-effectively launched (each new airdrop uses clones instead of deploying whole new logic contracts), claims are made via Merkle Proofs. This seeks to help projects which run ERC1155 airdrops on a semi-regular basis.

Factory operators have the option of whether each new airdrop should make use of an existing or new ERC1155 contract and whether or not to make use of an existing or new MerkleProof whitelist (i.e. new airdrop contracts deployed by the factory can make use of previously deployed whitelist & ERC1155 contracts, or new airdrops can be deployed which come with a fresh ERC1155/whitelist contract).

These ERC1155 contracts are also compliant with ERC2981.