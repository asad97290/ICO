nvm use 20

## Deploy Smart Contracts

cd ICO-smart-contracts

add .env file according to .env.example

npm i

npx hardhat compile

npx hardhat test

update args/ directory for smart contract deployment parameters

## Testnet deployment
npx hardhat run scripts/deployToken.js  --network arbitrum-sepolia

npx hardhat run scripts/deployICO.js  --network arbitrum-sepolia

## Mainnet deployment
npx hardhat run scripts/deployToken.js  --network arbitrum-mainnet

npx hardhat run scripts/deployICO.js  --network arbitrum-mainnet


## Start Backend

cd ICO-backend

add .env file according to .env.example

yarn 

npm run start:dev

## Start Frontend

cd ICO-frontend

yarn

add contract abi and address in src/contracts directory 

npm run dev


