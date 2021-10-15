# Solana SPL Token Metadata Update

This script updates existing NFTs created with Candy Machine on the blockchain with updated metadata.
It have 2 commands: `download-meta` current metadata and `update` with new metadata.

## Prepare

Install dependencies.

```
yarn
```

Set your Candy Machine ID within: `src/constans.ts`.
Place all your tokens addresses (mint id) as string array to the `./src/data/3d-soldiers.json`.

## Download current meta (SKIP. it is done)

You can download existing metadata for further reuse on `update` command. Run

```
yarn metadata-download
```
It will get array of tokens from `./src/data/3d-soldiers.json` and fetch all metadata to the file `src/data/metadata-cache.json` (may take ~1hr for 1k items).

## Create new updated metadata on Arweave.

It can be done with `metaplex upload` same as when creating new candy machine.
Otherwise newly updated links need to be formated to format of `metaplex` cache file.
Put cache file into -> `./src/data/arweave-links.json`

## Update metadata for tokens

Place `metadata-cache.json` into `./src/data/`.

Local keypair should be the same as keypair used to create related Candy Machine, and assumed to be an `Update Authority` for each token in the list.
Default `env` is `devnet

```
yarn run update --keypair <PATH_TO_LOCAL_KEYPAIR> --env mainnet-beta
```

TODO:

- Failed tx needs to be handled and retried.
- It needs to add some sleep method in case of rpc rate limit.
